"use client";

import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";
import {
  hexWithAlpha,
  NODE_COLORS,
  normalizeCanvasHex,
  type CanvasNodeColorPair,
} from "@/types/canvas";

type CanvasNodeColorToolbarProps = {
  activeIndex: number;
  onPick: (pair: CanvasNodeColorPair) => void;
};

export function CanvasNodeColorToolbar({
  activeIndex,
  onPick,
}: CanvasNodeColorToolbarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const pair = NODE_COLORS[index];
        if (pair) onPick(pair);
      }
    },
    [onPick],
  );

  return (
    <div
      role="toolbar"
      aria-label="Node colors"
      className={cn(
        "nodrag nopan pointer-events-auto flex items-center gap-1 rounded-full border border-zinc-600/60 bg-zinc-950/95 px-1.5 py-1 shadow-lg backdrop-blur-sm",
      )}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerDownCapture={(e) => e.stopPropagation()}
    >
      {NODE_COLORS.map((pair, index) => {
        const isActive = index === activeIndex;
        const isHovered = hoveredIndex === index;
        return (
          <button
            key={`${pair.fill}-${pair.text}`}
            type="button"
            aria-label={`Color ${index + 1}`}
            aria-pressed={isActive}
            className={cn(
              "relative size-5 shrink-0 rounded-full border transition-[transform,box-shadow,ring] duration-150",
              isActive
                ? "z-1 scale-110 border-zinc-100 ring-2 ring-zinc-100/90 ring-offset-1 ring-offset-zinc-950"
                : "border-zinc-600/80 hover:border-zinc-400/90",
            )}
            style={{
              backgroundColor: pair.fill,
              boxShadow: isHovered
                ? `0 0 6px 1px ${hexWithAlpha(pair.text, 0.48)}`
                : undefined,
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onPick(pair);
            }}
            onKeyDown={(e) => onKeyDown(e, index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        );
      })}
    </div>
  );
}

export function findActiveNodeColorIndex(
  color: string | undefined,
  foreground: string | undefined,
): number {
  const bg = normalizeCanvasHex(color);
  const fg = normalizeCanvasHex(foreground);
  const exact = NODE_COLORS.findIndex(
    (p) =>
      normalizeCanvasHex(p.fill) === bg &&
      normalizeCanvasHex(p.text) === fg,
  );
  if (exact >= 0) return exact;
  const byFill = NODE_COLORS.findIndex(
    (p) => normalizeCanvasHex(p.fill) === bg,
  );
  return byFill >= 0 ? byFill : 0;
}
