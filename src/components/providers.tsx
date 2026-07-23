"use client";

import { SessionProvider } from "next-auth/react";
import { NsfwProvider } from "@/components/nsfw-provider";
import { ToastProvider } from "@/components/toast-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NsfwProvider>
        <ToastProvider>{children}</ToastProvider>
      </NsfwProvider>
    </SessionProvider>
  );
}