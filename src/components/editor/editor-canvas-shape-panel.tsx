"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";

import { CanvasNodeShapeView } from "@/components/editor/canvas-node-shape-view";
import {
  CANVAS_SHAPE_DRAG_MIME,
  CANVAS_SHAPE_DEFINITIONS,
  encodeCanvasShapeDragPayload,
  type CanvasShapeId,
} from "@/lib/canvas-shape-defs";
import { DEFAULT_CANVAS_NODE_COLOR } from "@/types/canvas";

type ShapeDragGhost = {
  shape: CanvasShapeId;
  width: number;
  height: number;
  x: number;
  y: number;
};

function setEmptyDragPreview(event: React.DragEvent) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  event.dataTransfer.setDragImage(canvas, 0, 0);
}

export function EditorCanvasShapePanel() {
  const [dragGhost, setDragGhost] = useState<ShapeDragGhost | null>(null);

  const clearGhost = useCallback(() => {
    setDragGhost(null);
  }, []);

  return (
    <>
      {typeof document !== "undefined" &&
        dragGhost &&
        createPortal(
          <div
            className="pointer-events-none fixed z-10050 opacity-[0.82] shadow-lg"
            style={{
              width: dragGhost.width,
              height: dragGhost.height,
              left: dragGhost.x - dragGhost.width / 2,
              top: dragGhost.y - dragGhost.height / 2,
            }}
          >
            <CanvasNodeShapeView
              shape={dragGhost.shape}
              width={dragGhost.width}
              height={dragGhost.height}
              fill={DEFAULT_CANVAS_NODE_COLOR}
              ghost
            />
          </div>,
          document.body,
        )}
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-zinc-900/95 px-2 py-1.5 shadow-lg backdrop-blur-sm">
        {CANVAS_SHAPE_DEFINITIONS.map(
          ({ id, label, icon: Icon, width, height }) => (
            <button
              key={id}
              type="button"
              draggable
              title={label}
              aria-label={`Drag ${label} onto canvas`}
              className="flex size-9 cursor-grab items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 active:cursor-grabbing"
              onDragStart={(event) => {
                setEmptyDragPreview(event);
                const encoded = encodeCanvasShapeDragPayload({
                  shape: id,
                  width,
                  height,
                });
                event.dataTransfer.setData(CANVAS_SHAPE_DRAG_MIME, encoded);
                event.dataTransfer.setData("text/plain", encoded);
                event.dataTransfer.effectAllowed = "copy";
                setDragGhost({
                  shape: id,
                  width,
                  height,
                  x: event.clientX,
                  y: event.clientY,
                });
              }}
              onDrag={(event) => {
                setDragGhost((prev) =>
                  prev
                    ? {
                        ...prev,
                        x: event.clientX,
                        y: event.clientY,
                      }
                    : null,
                );
              }}
              onDragEnd={clearGhost}
            >
              <Icon className="size-5" strokeWidth={1.75} aria-hidden />
            </button>
          ),
        )}
      </div>
    </>
  );
}
