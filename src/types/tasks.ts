import { z } from "zod";

/** Liveblocks room feed id for shared AI activity (design, spec, etc.). */
export const AI_STATUS_FEED_ID = "ai-status-feed" as const;

/** Liveblocks room feed id for collaborative sidebar chat (human messages only). */
export const AI_CHAT_FEED_ID = "ai-chat" as const;

/**
 * Payload for messages appended to {@link AI_STATUS_FEED_ID}.
 * Kept generic for design and future spec-generation flows.
 */
export const aiStatusFeedPayloadSchema = z.object({
  kind: z.enum(["design", "spec"]),
  runId: z.string().min(1),
  userId: z.string().min(1),
  phase: z.enum(["start", "processing", "complete", "error"]),
  text: z.string().max(4000).optional(),
});

export type AiStatusFeedPayload = z.infer<typeof aiStatusFeedPayloadSchema>;

export function parseAiStatusFeedPayload(data: unknown): AiStatusFeedPayload | null {
  const result = aiStatusFeedPayloadSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function latestValidAiStatusPayload(
  messages: ReadonlyArray<{ data: unknown }>,
): AiStatusFeedPayload | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const row = messages[i];
    if (!row) continue;
    const parsed = parseAiStatusFeedPayload(row.data);
    if (parsed) return parsed;
  }
  return null;
}

/**
 * Payload for messages appended to {@link AI_CHAT_FEED_ID}.
 */
export const aiChatFeedPayloadSchema = z.object({
  sender: z.string().min(1).max(200),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(8000),
  timestamp: z.number().int().nonnegative(),
});

export type AiChatFeedPayload = z.infer<typeof aiChatFeedPayloadSchema>;

export function parseAiChatFeedPayload(data: unknown): AiChatFeedPayload | null {
  const result = aiChatFeedPayloadSchema.safeParse(data);
  return result.success ? result.data : null;
}

export type ValidAiChatFeedRow = {
  id: string;
  createdAt: number;
  payload: AiChatFeedPayload;
};

/**
 * Returns feed rows with valid chat payloads, oldest first.
 */
export function sortedValidAiChatMessages(
  messages: ReadonlyArray<{ id: string; data: unknown; createdAt: number }>,
): ValidAiChatFeedRow[] {
  const rows: ValidAiChatFeedRow[] = [];
  for (const m of messages) {
    const payload = parseAiChatFeedPayload(m.data);
    if (!payload) continue;
    rows.push({ id: m.id, createdAt: m.createdAt, payload });
  }
  rows.sort((a, b) => a.createdAt - b.createdAt);
  return rows;
}
