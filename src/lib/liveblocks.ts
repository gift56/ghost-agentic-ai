import { Liveblocks } from "@liveblocks/node";

export { userIdToCursorColor } from "@/lib/cursor-color";

const globalForLiveblocks = globalThis as unknown as {
  liveblocks: Liveblocks | undefined;
};

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
