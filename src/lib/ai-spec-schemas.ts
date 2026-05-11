import { z } from "zod";

import type { CanvasShapeId } from "@/lib/canvas-shape-defs";

const CANVAS_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const satisfies readonly CanvasShapeId[];

export const specChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(12_000),
});

const positionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

/** Node shape sent from the client canvas (matches `canvasNode` storage). */
export const specCanvasNodeSchema = z
  .object({
    id: z.string().min(1).max(256),
    type: z.literal("canvasNode"),
    position: positionSchema,
    data: z.object({
      label: z.string().max(2000),
      color: z.string().max(64),
      foreground: z.string().max(64).optional(),
      shape: z.enum(CANVAS_SHAPES),
    }),
    width: z.number().finite().optional(),
    height: z.number().finite().optional(),
  })
  .passthrough();

/** Edge shape sent from the client canvas (matches `canvasEdge` storage). */
export const specCanvasEdgeSchema = z
  .object({
    id: z.string().min(1).max(256),
    type: z.literal("canvasEdge").optional(),
    source: z.string().min(1).max(256),
    target: z.string().min(1).max(256),
    data: z.object({ label: z.string().max(500).optional() }).optional(),
  })
  .passthrough();

/** Body for `POST /api/ai/spec` (no client-supplied project id). */
export const specGenerationApiBodySchema = z.object({
  roomId: z.string().min(1).max(200),
  chatHistory: z.array(specChatMessageSchema).max(400),
  nodes: z.array(specCanvasNodeSchema).max(400),
  edges: z.array(specCanvasEdgeSchema).max(800),
});

/** Payload passed to the `generate-spec` Trigger.dev task (server-resolved `projectId`). */
export const generateSpecTaskPayloadSchema = z.object({
  projectId: z.string().min(1).max(200),
  roomId: z.string().min(1).max(200),
  userId: z.string().min(1).max(200),
  chatHistory: z.array(specChatMessageSchema).max(400),
  nodes: z.array(specCanvasNodeSchema).max(400),
  edges: z.array(specCanvasEdgeSchema).max(800),
});

export type GenerateSpecTaskPayload = z.infer<typeof generateSpecTaskPayloadSchema>;
