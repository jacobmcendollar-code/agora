"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "agora-show-nsfw";

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
  const [showNsfw, setShowNsfwState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setShowNsfwState(stored === "1");
    setReady(true);
  }, []);

  function setShowNsfw(value: boolean) {
    if (value) {
      const ok = window.confirm(
        "This will show NSFW content. Confirm you are 18 or older."
      );
      if (!ok) return;
    }
    setShowNsfwState(value);
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
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