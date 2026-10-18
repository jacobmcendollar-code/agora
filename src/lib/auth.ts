import NextAuth, { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { loadAccountForSession } from "./active-user";
import { ensureComplianceSchema } from "./ensure-compliance-schema";
import { prisma } from "./prisma";

class RestrictedAccount extends CredentialsSignin {
  code = "restricted";
}

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
        await ensureComplianceSchema();
        const user = await prisma.user.findUnique({
          where: { username: username.toLowerCase() },
          select: {
            id: true,
            username: true,
            email: true,
            passwordHash: true,
            image: true,
            showNsfw: true,
            banned: true,
            sessionVersion: true,
          },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;
        if (user.banned) throw new RestrictedAccount();

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          image: user.image,
          showNsfw: user.showNsfw,
          banned: user.banned,
          sessionVersion: user.sessionVersion,
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
        token.sessionVersion =
          typeof user.sessionVersion === "number" ? user.sessionVersion : 0;
      }

      // After toggle: session.update({ showNsfw }) refreshes the token
      if (trigger === "update" && session && typeof session.showNsfw === "boolean") {
        token.showNsfw = session.showNsfw;
      }

      return token;
    },
    async session({ session, token }) {
      const userId = typeof token.id === "string" ? token.id : "";
      if (!userId || !session.user) return session;

      const account = await loadAccountForSession(
        userId,
        typeof token.sessionVersion === "number" ? token.sessionVersion : 0
      );
      if (!account) {
        return { expires: session.expires } as typeof session;
      }

      session.user.id = account.id;
      session.user.username = account.username;
      session.user.banned = account.banned;
      session.user.sessionVersion = account.sessionVersion;
      session.user.showNsfw = Boolean(token.showNsfw);
      if (!session.user.image) {
        const fromToken =
          typeof token.picture === "string" ? token.picture : null;
        if (fromToken) {
          session.user.image = fromToken;
        } else {
          const dbUser = await prisma.user.findUnique({
            where: { id: account.id },
            select: { image: true },
          });
          session.user.image = dbUser?.image ?? null;
        }
      }
      return session;
    },
  },
});
