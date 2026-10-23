import NextAuth, { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { z } from "zod";
import { clientIp, consumeRateLimit, isRateLimited, LIMITS } from "./rate-limit";
import { prisma } from "./prisma";

class RateLimited extends CredentialsSignin {
  code = "rate_limited";
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
        const normalizedUsername = username.toLowerCase();
        const ip = clientIp(await headers());
        const ipLimit = await consumeRateLimit(
          `login:ip:${ip}`,
          LIMITS.loginPerIp.limit,
          LIMITS.loginPerIp.windowMs
        );
        if (!ipLimit.ok) throw new RateLimited();

        const userLock = await isRateLimited(
          `login:fail:${normalizedUsername}`,
          LIMITS.loginFailuresPerUsername.limit
        );
        if (userLock.limited) throw new RateLimited();

        const user = await prisma.user.findUnique({
          where: { username: normalizedUsername },
          select: {
            id: true,
            username: true,
            email: true,
            passwordHash: true,
            image: true,
            showNsfw: true,
          },
        });

        if (!user || !user.passwordHash) {
          await consumeRateLimit(
            `login:fail:${normalizedUsername}`,
            LIMITS.loginFailuresPerUsername.limit,
            LIMITS.loginFailuresPerUsername.windowMs
          );
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await consumeRateLimit(
            `login:fail:${normalizedUsername}`,
            LIMITS.loginFailuresPerUsername.limit,
            LIMITS.loginFailuresPerUsername.windowMs
          );
          return null;
        }

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
