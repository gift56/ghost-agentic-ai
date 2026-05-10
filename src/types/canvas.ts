import type { Edge, Node } from "@xyflow/react";

import type { CanvasShapeId } from "@/lib/canvas-shape-defs";

/** Node fill + paired label color (see `src/prompts/ui-context.md`). */
export type CanvasNodeColorPair = {
  fill: string;
  text: string;
};

export const NODE_COLORS: readonly CanvasNodeColorPair[] = [
  { fill: "#1F1F1F", text: "#EDEDED" },
  { fill: "#10233D", text: "#52A8FF" },
  { fill: "#2E1938", text: "#BF7AF0" },
  { fill: "#331B00", text: "#FF990A" },
  { fill: "#3C1618", text: "#FF6166" },
  { fill: "#3A1726", text: "#F75F8F" },
  { fill: "#0F2E18", text: "#62C073" },
  { fill: "#062822", text: "#0AC7B4" },
] as const;

export const DEFAULT_CANVAS_NODE_COLOR = NODE_COLORS[0].fill;
export const DEFAULT_CANVAS_NODE_FOREGROUND = NODE_COLORS[0].text;

export function normalizeCanvasHex(value: string | undefined): string {
  if (!value) return "";
  let v = value.trim().toLowerCase();
  if (v.startsWith("#")) v = v.slice(1);
  if (v.length === 3) {
    v = v
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return v;
}

export function hexWithAlpha(hex: string, alpha: number): string {
  const h = normalizeCanvasHex(hex);
  if (h.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function resolveCanvasNodeForeground(color: string, foreground?: string): string {
  if (foreground) return foreground;
  const bg = normalizeCanvasHex(color);
  const pair = NODE_COLORS.find(
    (p) => normalizeCanvasHex(p.fill) === bg,
  );
  return pair?.text ?? NODE_COLORS[0].text;
}

export type CanvasNodeData = {
  label: string;
  color: string;
  /** Paired label color; omitted on older nodes → derived from `color` when possible */
  foreground?: string;
  shape: CanvasShapeId;
};

export const canvasNode = "canvasNode" as const;
export const canvasEdge = "canvasEdge" as const;

export type CanvasEdgeData = {
  label?: string;
};

export type CanvasNode = Node<CanvasNodeData, typeof canvasNode>;
export type CanvasEdge = Edge<CanvasEdgeData, typeof canvasEdge>;
