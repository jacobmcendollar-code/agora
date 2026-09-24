"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";

type TargetType = "post" | "comment";
type VoteValue = 1 | -1 | 0;

type EngagementState = {
  votes: Record<string, VoteValue>;
  saved: Record<string, boolean>;
};

type EngagementActions = {
  register: (targetType: TargetType, targetId: string) => void;
  setVote: (targetType: TargetType, targetId: string, value: VoteValue) => void;
  setSaved: (postId: string, saved: boolean) => void;
};

const ActionsContext = createContext<EngagementActions | null>(null);
const StateContext = createContext<EngagementState>({ votes: {}, saved: {} });

const POST_CHUNK = 80;
const COMMENT_CHUNK = 200;

function voteKey(targetType: TargetType, targetId: string) {
  return `${targetType}:${targetId}`;
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

export function EngagementProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [state, setState] = useState<EngagementState>({ votes: {}, saved: {} });
  const statusRef = useRef(status);
  statusRef.current = status;
  const knownPosts = useRef(new Set<string>());
  const knownComments = useRef(new Set<string>());
  const queuedPosts = useRef(new Set<string>());
  const queuedComments = useRef(new Set<string>());
  const revision = useRef(new Map<string, number>());
  const revisionClock = useRef(0);
  const timer = useRef<number | null>(null);

  const bump = useCallback((key: string) => {
    revisionClock.current += 1;
    revision.current.set(key, revisionClock.current);
  }, []);

  const flush = useCallback(async () => {
    if (statusRef.current !== "authenticated") {
      queuedPosts.current.clear();
      queuedComments.current.clear();
      return;
    }

    const postIds = [...queuedPosts.current];
    const commentIds = [...queuedComments.current];
    queuedPosts.current.clear();
    queuedComments.current.clear();
    if (postIds.length === 0 && commentIds.length === 0) return;

    const postBatches = chunk(postIds, POST_CHUNK);
    const commentBatches = chunk(commentIds, COMMENT_CHUNK);
    const rounds = Math.max(postBatches.length, commentBatches.length);

    await Promise.all(
      Array.from({ length: rounds }, async (_, index) => {
        const posts = postBatches[index] ?? [];
        const comments = commentBatches[index] ?? [];
        const started = new Map<string, number>();
        for (const id of posts) {
          started.set(voteKey("post", id), revision.current.get(voteKey("post", id)) ?? 0);
          started.set(`saved:${id}`, revision.current.get(`saved:${id}`) ?? 0);
        }
        for (const id of comments) {
          started.set(
            voteKey("comment", id),
            revision.current.get(voteKey("comment", id)) ?? 0
          );
        }

        const params = new URLSearchParams();
        if (posts.length) params.set("postIds", posts.join(","));
        if (comments.length) params.set("commentIds", comments.join(","));

        try {
          const res = await fetch(`/api/engagement?${params.toString()}`);
          if (!res.ok) return;
          const data = await res.json();
          if (statusRef.current !== "authenticated") return;

          setState((prev) => {
            const votes = { ...prev.votes };
            const saved = { ...prev.saved };
            let changed = false;

            for (const id of posts) {
              const key = voteKey("post", id);
              if ((revision.current.get(key) ?? 0) !== started.get(key)) continue;
              const raw = data?.votes?.posts?.[id];
              const value: VoteValue = raw === 1 || raw === -1 ? raw : 0;
              if (votes[key] !== value) {
                votes[key] = value;
                changed = true;
              }

              const savedKey = `saved:${id}`;
              if ((revision.current.get(savedKey) ?? 0) !== started.get(savedKey)) continue;
              const isSaved = Boolean(data?.saved?.[id]);
              if (saved[id] !== isSaved) {
                saved[id] = isSaved;
                changed = true;
              }
            }

            for (const id of comments) {
              const key = voteKey("comment", id);
              if ((revision.current.get(key) ?? 0) !== started.get(key)) continue;
              const raw = data?.votes?.comments?.[id];
              const value: VoteValue = raw === 1 || raw === -1 ? raw : 0;
              if (votes[key] !== value) {
                votes[key] = value;
                changed = true;
              }
            }

            return changed ? { votes, saved } : prev;
          });
        } catch {
          // Leave the buttons at the default. A later navigation can try again.
        }
      })
    );
  }, []);

  const schedule = useCallback(() => {
    if (typeof window === "undefined") return;
    if (timer.current != null) return;
    timer.current = window.setTimeout(() => {
      timer.current = null;
      void flush();
    }, 30);
  }, [flush]);

  const register = useCallback(
    (targetType: TargetType, targetId: string) => {
      if (statusRef.current !== "authenticated") return;
      const known = targetType === "post" ? knownPosts.current : knownComments.current;
      const queued = targetType === "post" ? queuedPosts.current : queuedComments.current;
      if (known.has(targetId)) return;
      known.add(targetId);
      queued.add(targetId);
      schedule();
    },
    [schedule]
  );

  const setVote = useCallback(
    (targetType: TargetType, targetId: string, value: VoteValue) => {
      const key = voteKey(targetType, targetId);
      bump(key);
      setState((prev) => {
        if (prev.votes[key] === value) return prev;
        return { ...prev, votes: { ...prev.votes, [key]: value } };
      });
    },
    [bump]
  );

  const setSaved = useCallback(
    (postId: string, saved: boolean) => {
      bump(`saved:${postId}`);
      setState((prev) => {
        if (prev.saved[postId] === saved) return prev;
        return { ...prev, saved: { ...prev.saved, [postId]: saved } };
      });
    },
    [bump]
  );

  useEffect(() => {
    if (status !== "authenticated") return;
    if (queuedPosts.current.size || queuedComments.current.size) schedule();
  }, [status, schedule]);

  const actions = useRef<EngagementActions>({ register, setVote, setSaved });
  actions.current.register = register;
  actions.current.setVote = setVote;
  actions.current.setSaved = setSaved;

  const stableActions = useRef<EngagementActions>({
    register: (targetType, targetId) => actions.current.register(targetType, targetId),
    setVote: (targetType, targetId, value) =>
      actions.current.setVote(targetType, targetId, value),
    setSaved: (postId, saved) => actions.current.setSaved(postId, saved),
  });

  return (
    <ActionsContext.Provider value={stableActions.current}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </ActionsContext.Provider>
  );
}

export function useEngagementVote(
  targetType: TargetType,
  targetId: string,
  enabled: boolean
) {
  const actions = useContext(ActionsContext);
  const { votes } = useContext(StateContext);
  const [value, setValue] = useState<VoteValue>(0);
  const local = useRef(false);
  const remote = votes[voteKey(targetType, targetId)];

  useEffect(() => {
    local.current = false;
    if (!enabled) {
      setValue(0);
      return;
    }
    actions?.register(targetType, targetId);
  }, [actions, enabled, targetType, targetId]);

  useEffect(() => {
    if (!enabled || local.current || remote === undefined) return;
    setValue(remote);
  }, [enabled, remote]);

  const setLocal = useCallback(
    (next: VoteValue) => {
      local.current = true;
      setValue(next);
      actions?.setVote(targetType, targetId, next);
    },
    [actions, targetType, targetId]
  );

  return [value, setLocal] as const;
}

export function useEngagementSaved(
  postId: string,
  enabled: boolean,
  initialSaved: boolean
) {
  const actions = useContext(ActionsContext);
  const { saved: savedMap } = useContext(StateContext);
  const [saved, setSaved] = useState(initialSaved);
  const local = useRef(false);
  const remote = savedMap[postId];

  useEffect(() => {
    local.current = false;
    if (!enabled) return;
    actions?.register("post", postId);
  }, [actions, enabled, postId]);

  useEffect(() => {
    if (!enabled || local.current || remote === undefined) return;
    setSaved(remote);
  }, [enabled, remote]);

  const setLocal = useCallback(
    (next: boolean) => {
      local.current = true;
      setSaved(next);
      actions?.setSaved(postId, next);
    },
    [actions, postId]
  );

  return [saved, setLocal] as const;
}
