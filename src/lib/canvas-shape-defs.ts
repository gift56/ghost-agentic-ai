import type { LucideIcon } from "lucide-react";
import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  Square,
} from "lucide-react";

export const CANVAS_SHAPE_DRAG_MIME = "application/x-ghost-canvas-shape";

export type CanvasShapeId =
  | "rectangle"
  | "diamond"
  | "circle"
  | "pill"
  | "cylinder"
  | "hexagon";

export type CanvasShapeDragPayload = {
  shape: CanvasShapeId;
  width: number;
  height: number;
};

export type CanvasShapeDefinition = {
  id: CanvasShapeId;
  label: string;
  icon: LucideIcon;
  width: number;
  height: number;
};

export const CANVAS_SHAPE_DEFINITIONS: readonly CanvasShapeDefinition[] = [
  { id: "rectangle", label: "Rectangle", icon: Square, width: 200, height: 88 },
  { id: "diamond", label: "Diamond", icon: Diamond, width: 168, height: 168 },
  { id: "circle", label: "Circle", icon: Circle, width: 112, height: 112 },
  { id: "pill", label: "Pill", icon: Pill, width: 200, height: 64 },
  { id: "cylinder", label: "Cylinder", icon: Cylinder, width: 120, height: 100 },
  { id: "hexagon", label: "Hexagon", icon: Hexagon, width: 144, height: 124 },
] as const;

export function encodeCanvasShapeDragPayload(
  payload: CanvasShapeDragPayload,
): string {
  return JSON.stringify(payload);
}

export function parseCanvasShapeDragPayload(
  raw: string,
): CanvasShapeDragPayload | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    const shape = o.shape;
    const width = o.width;
    const height = o.height;
    if (
      shape !== "rectangle" &&
      shape !== "diamond" &&
      shape !== "circle" &&
      shape !== "pill" &&
      shape !== "cylinder" &&
      shape !== "hexagon"
    ) {
      return null;
    }
    if (typeof width !== "number" || typeof height !== "number") return null;
    if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
    return { shape, width, height };
  } catch {
    return null;
  }
}
