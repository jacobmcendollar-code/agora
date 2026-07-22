"use client";

import { SessionProvider } from "next-auth/react";
import { NsfwProvider } from "@/components/nsfw-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NsfwProvider>{children}</NsfwProvider>
    </SessionProvider>
  );
}