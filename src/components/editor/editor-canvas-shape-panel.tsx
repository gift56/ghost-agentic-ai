"use client";

import {
  CANVAS_SHAPE_DRAG_MIME,
  CANVAS_SHAPE_DEFINITIONS,
  encodeCanvasShapeDragPayload,
} from "@/lib/canvas-shape-defs";

export function EditorCanvasShapePanel() {
  return (
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
              const encoded = encodeCanvasShapeDragPayload({
                shape: id,
                width,
                height,
              });
              event.dataTransfer.setData(CANVAS_SHAPE_DRAG_MIME, encoded);
              event.dataTransfer.setData("text/plain", encoded);
              event.dataTransfer.effectAllowed = "copy";
            }}
          >
            <Icon className="size-5" strokeWidth={1.75} aria-hidden />
          </button>
        ),
      )}
    </div>
  );
}
