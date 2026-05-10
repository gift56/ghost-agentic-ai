import type { Edge, Node } from "@xyflow/react";

import type { CanvasShapeId } from "@/lib/canvas-shape-defs";

export const DEFAULT_CANVAS_NODE_COLOR = "var(--color-card)";

export type CanvasNodeData = {
  label: string;
  color: string;
  shape: CanvasShapeId;
};

export const canvasNode = "canvasNode" as const;
export const canvasEdge = "canvasEdge" as const;

export type CanvasNode = Node<CanvasNodeData, typeof canvasNode>;
export type CanvasEdge = Edge<Record<string, never>, typeof canvasEdge>;
