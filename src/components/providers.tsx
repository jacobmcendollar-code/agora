"use client";

import { SessionProvider } from "next-auth/react";
import { NsfwProvider } from "@/components/nsfw-provider";
import { ToastProvider } from "@/components/toast-provider";
import { ThemeInit } from "@/components/theme-init";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeInit />
      <NsfwProvider>
        <ToastProvider>{children}</ToastProvider>
      </NsfwProvider>
    </SessionProvider>
  );
}