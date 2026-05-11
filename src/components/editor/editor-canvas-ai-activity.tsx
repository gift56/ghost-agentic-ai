"use client";

import { useEventListener } from "@liveblocks/react/suspense";
import { useStoreApi } from "@xyflow/react";
import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const FOCUS_TIMEOUT_MS = 3500;

type AiFocusState = {
  runId: string;
  userId: string;
  position: { x: number; y: number };
};

/**
 * Renders an "AI cursor" overlay on the React Flow canvas. The position is driven by
 * `ai:focus` RoomEvents broadcast by the design agent server task, and is automatically
 * cleared when the AI sends a null position or after a short timeout.
 */
export function EditorCanvasAiActivity() {
  const [focus, setFocus] = useState<AiFocusState | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactFlowStoreApi = useStoreApi();

  const clearFocus = useCallback(() => {
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
    setFocus(null);
  }, []);

  useEventListener(({ event }) => {
    if (!event || typeof event !== "object" || !("type" in event)) return;
    if (event.type !== "ai:focus") return;

    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }

    if (!event.position) {
      setFocus(null);
      return;
    }

    setFocus({
      runId: event.runId,
      userId: event.userId,
      position: event.position,
    });

    clearTimerRef.current = setTimeout(() => {
      setFocus(null);
      clearTimerRef.current = null;
    }, FOCUS_TIMEOUT_MS);
  });

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const apply = () => {
      if (!focus) {
        el.style.display = "none";
        return;
      }
      const [panX, panY, zoom] = reactFlowStoreApi.getState().transform;
      el.style.display = "";
      el.style.transform = `translate3d(${focus.position.x * zoom + panX}px, ${focus.position.y * zoom + panY}px, 0)`;
    };

    apply();
    return reactFlowStoreApi.subscribe((state, prev) => {
      if (state.transform !== prev.transform) apply();
    });
  }, [focus, reactFlowStoreApi]);

  if (!focus) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      <div
        ref={elementRef}
        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2"
        style={{ display: "none" }}
      >
        <div className="flex items-center gap-1.5 rounded-full border border-brand/50 bg-brand-dim px-2 py-1 text-xs font-medium text-accent-text shadow-lg ring-1 ring-brand/30">
          <Sparkles className="size-3 animate-pulse" aria-hidden />
          <span>Ghost AI</span>
        </div>
        <div className="mx-auto mt-0.5 size-2 rounded-full bg-brand shadow-[0_0_12px_var(--accent-primary)]" />
      </div>
    </div>
  );
}
