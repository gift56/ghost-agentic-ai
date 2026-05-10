import { Liveblocks } from "@liveblocks/node";

const globalForLiveblocks = globalThis as unknown as {
  liveblocks: Liveblocks | undefined;
};

/** Fixed palette for stable cursor colors across sessions. */
const CURSOR_COLOR_PALETTE = [
  "#F43F5E",
  "#EC4899",
  "#A855F7",
  "#8B5CF6",
  "#6366F1",
  "#3B82F6",
  "#0EA5E9",
  "#06B6D4",
  "#14B8A6",
  "#22C55E",
  "#84CC16",
  "#EAB308",
  "#F97316",
] as const;

/**
 * Maps a user ID to a stable color from {@link CURSOR_COLOR_PALETTE}.
 */
export function userIdToCursorColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CURSOR_COLOR_PALETTE.length;
  return CURSOR_COLOR_PALETTE[index];
}

function createLiveblocksClient(): Liveblocks {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;

  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
  }

  return new Liveblocks({ secret });
}

export function getLiveblocks(): Liveblocks {
  globalForLiveblocks.liveblocks ??= createLiveblocksClient();
  return globalForLiveblocks.liveblocks;
}
