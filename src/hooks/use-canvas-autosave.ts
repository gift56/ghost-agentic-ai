"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export type CanvasAutosaveStatus = "idle" | "saving" | "saved" | "error";

const DEFAULT_DEBOUNCE_MS = 1500;

type UseCanvasAutosaveOptions = {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  /** When false, autosave timers do not run (e.g. until initial blob hydration finishes). */
  enabled: boolean;
  debounceMs?: number;
};

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseCanvasAutosaveOptions): {
  status: CanvasAutosaveStatus;
  flush: () => Promise<void>;
} {
  const [status, setStatus] = useState<CanvasAutosaveStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useLayoutEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  });

  const snapshotKey = useMemo(
    () => JSON.stringify({ nodes, edges }),
    [nodes, edges],
  );

  const clearSavedReset = useCallback(() => {
    if (savedResetRef.current) {
      clearTimeout(savedResetRef.current);
      savedResetRef.current = null;
    }
  }, []);

  const persist = useCallback(async () => {
    const payload = {
      nodes: nodesRef.current,
      edges: edgesRef.current,
    };

    setStatus((s) => (s === "saving" ? s : "saving"));

    try {
      const res = await fetch(`/api/projects/${projectId}/canvas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvas: payload }),
        credentials: "same-origin",
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("saved");
      clearSavedReset();
      savedResetRef.current = setTimeout(() => {
        setStatus("idle");
        savedResetRef.current = null;
      }, 2000);
    } catch {
      setStatus("error");
    }
  }, [clearSavedReset, projectId]);

  const flush = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    clearSavedReset();
    await persist();
  }, [clearSavedReset, persist]);

  useEffect(() => {
    if (!enabled) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void persist();
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [debounceMs, enabled, persist, projectId, snapshotKey]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      clearSavedReset();
    },
    [clearSavedReset],
  );

  return { status, flush };
}
