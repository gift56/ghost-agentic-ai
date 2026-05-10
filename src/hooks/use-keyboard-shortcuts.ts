"use client";

import { useEffect } from "react";

import type { Edge, Node, ReactFlowInstance } from "@xyflow/react";

const ZOOM_ANIM_MS = 200;

export type UseKeyboardShortcutsParams<
  NodeType extends Node = Node,
  EdgeType extends Edge = Edge,
> = {
  reactFlowRef: React.RefObject<ReactFlowInstance<NodeType, EdgeType> | null>;
  onUndo: () => void;
  onRedo: () => void;
};

function isEditableFieldTarget(target: EventTarget | null): boolean {
  const el = target instanceof Element ? target : null;
  if (!el) return false;
  return Boolean(
    el.closest("input, textarea, [contenteditable=\"true\"]"),
  );
}

/**
 * Global canvas shortcuts: zoom (+/=, -), undo/redo (mod+Z / mod+shift+Z / mod+Y).
 * Skips handling while focus is in inputs, textareas, or contenteditable fields.
 */
export function useKeyboardShortcuts<
  NodeType extends Node = Node,
  EdgeType extends Edge = Edge,
>({
  reactFlowRef,
  onUndo,
  onRedo,
}: UseKeyboardShortcutsParams<NodeType, EdgeType>): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (isEditableFieldTarget(event.target)) return;

      const rf = reactFlowRef.current;
      const mod = event.metaKey || event.ctrlKey;

      if (!mod && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        rf?.zoomIn({ duration: ZOOM_ANIM_MS });
        return;
      }

      if (!mod && event.key === "-") {
        event.preventDefault();
        rf?.zoomOut({ duration: ZOOM_ANIM_MS });
        return;
      }

      if (mod && event.key.toLowerCase() === "z") {
        if (event.shiftKey) {
          event.preventDefault();
          onRedo();
        } else {
          event.preventDefault();
          onUndo();
        }
        return;
      }

      if (mod && event.key.toLowerCase() === "y") {
        event.preventDefault();
        onRedo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onRedo, onUndo, reactFlowRef]);
}
