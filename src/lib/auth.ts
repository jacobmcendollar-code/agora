import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./prisma";

// Canonical host is www. AUTH_URL in Vercel is still the apex, which makes
// next-auth advertise https://agor4.com callbacks. Apex 308s to www and
// turns the credentials POST into a 405 on /login.
process.env.AUTH_URL = "https://www.agor4.com";
process.env.NEXTAUTH_URL = "https://www.agor4.com";

const loginSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { username: username.toLowerCase() },
          select: {
            id: true,
            username: true,
            email: true,
            passwordHash: true,
            image: true,
            showNsfw: true,
          },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          image: user.image,
          showNsfw: user.showNsfw,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.username = user.name as string;
        token.showNsfw = Boolean(user.showNsfw);
        token.picture = user.image ?? null;
      }

      // After toggle: session.update({ showNsfw }) refreshes the token
      if (trigger === "update" && session && typeof session.showNsfw === "boolean") {
        token.showNsfw = session.showNsfw;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.showNsfw = Boolean(token.showNsfw);
        if (!session.user.image) {
          const fromToken =
            typeof token.picture === "string" ? token.picture : null;
          if (fromToken) {
            session.user.image = fromToken;
          } else {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { image: true },
            });
            session.user.image = dbUser?.image ?? null;
          }
        }
      }
      return session;
    },
  },
});
