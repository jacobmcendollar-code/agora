"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { EngagementProvider } from "@/components/engagement-provider";
import { NsfwProvider } from "@/components/nsfw-provider";
import { ToastProvider } from "@/components/toast-provider";
import { ThemeInit } from "@/components/theme-init";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      <EngagementProvider>
        <ThemeInit />
        <NsfwProvider>
          <ToastProvider>{children}</ToastProvider>
        </NsfwProvider>
      </EngagementProvider>
    </SessionProvider>
  );
}
