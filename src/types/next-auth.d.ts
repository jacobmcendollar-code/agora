import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      showNsfw: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    username?: string;
    showNsfw?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    showNsfw: boolean;
  }
}