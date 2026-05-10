"use client";

import {
  Expand,
  Minus,
  Plus,
  Redo2,
  Undo2,
} from "lucide-react";

import type { Edge, Node, ReactFlowInstance } from "@xyflow/react";

const ZOOM_ANIM_MS = 200;

type EditorCanvasControlBarProps<
  NodeType extends Node = Node,
  EdgeType extends Edge = Edge,
> = {
  reactFlowRef: React.RefObject<ReactFlowInstance<NodeType, EdgeType> | null>;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

export function EditorCanvasControlBar<
  NodeType extends Node = Node,
  EdgeType extends Edge = Edge,
>({
  reactFlowRef,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: EditorCanvasControlBarProps<NodeType, EdgeType>) {
  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-zinc-900/95 px-2 py-1.5 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          title="Zoom out"
          aria-label="Zoom out"
          className="flex size-9 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          onClick={() =>
            reactFlowRef.current?.zoomOut({ duration: ZOOM_ANIM_MS })
          }
        >
          <Minus className="size-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          title="Fit view"
          aria-label="Fit view"
          className="flex size-9 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          onClick={() =>
            reactFlowRef.current?.fitView({
              padding: 0.2,
              duration: ZOOM_ANIM_MS,
            })
          }
        >
          <Expand className="size-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          title="Zoom in"
          aria-label="Zoom in"
          className="flex size-9 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          onClick={() =>
            reactFlowRef.current?.zoomIn({ duration: ZOOM_ANIM_MS })
          }
        >
          <Plus className="size-4" strokeWidth={2} />
        </button>
      </div>
      <div
        className="h-5 w-px shrink-0 bg-border"
        aria-hidden
      />
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          title="Undo"
          aria-label="Undo"
          disabled={!canUndo}
          className="flex size-9 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-35"
          onClick={onUndo}
        >
          <Undo2 className="size-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          title="Redo"
          aria-label="Redo"
          disabled={!canRedo}
          className="flex size-9 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-35"
          onClick={onRedo}
        >
          <Redo2 className="size-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
