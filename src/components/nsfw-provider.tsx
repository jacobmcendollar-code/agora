"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";

type NsfwContextValue = {
  showNsfw: boolean;
  setShowNsfw: (value: boolean) => void;
  ready: boolean;
};

const NsfwContext = createContext<NsfwContextValue>({
  showNsfw: false,
  setShowNsfw: () => {},
  ready: false,
});

export function NsfwProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const [saving, setSaving] = useState(false);

  const ready = status !== "loading";
  // Logged out = never show adult content
  const showNsfw = Boolean(session?.user?.showNsfw);

  async function setShowNsfw(value: boolean) {
    if (!session?.user?.id || saving) return;

    if (value) {
      const ok = window.confirm(
        "This will show adult content. Confirm you are 18 or older."
      );
      if (!ok) return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/user/show-nsfw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showNsfw: value }),
      });
      if (!res.ok) return;

      // Updates JWT/session so the setting follows the account
      await update({ showNsfw: value });
    } finally {
      setSaving(false);
    }
  }

  return (
    <NsfwContext.Provider value={{ showNsfw, setShowNsfw, ready }}>
      {children}
    </NsfwContext.Provider>
  );
}

export function useNsfw() {
  return useContext(NsfwContext);
}