import { LiveblocksError } from "@liveblocks/node";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getLiveblocks, userIdToCursorColor } from "@/lib/liveblocks";
import {
  getAccessibleProjectByRoomId,
  getCurrentProjectIdentity,
} from "@/lib/project-access";

function resolveDisplayName(
  user: NonNullable<Awaited<ReturnType<typeof currentUser>>>,
): string {
  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (fullName) {
    return fullName;
  }
  if (user.username) {
    return user.username;
  }
  if (user.primaryEmailAddress?.emailAddress) {
    return user.primaryEmailAddress.emailAddress;
  }
  return "Anonymous";
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as {
    room?: unknown;
  } | null;
  const roomRaw = typeof payload?.room === "string" ? payload.room.trim() : "";

  if (!roomRaw) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  const identity = await getCurrentProjectIdentity();

  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getAccessibleProjectByRoomId(roomRaw, identity);

  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const liveblocks = getLiveblocks();

  try {
    await liveblocks.getOrCreateRoom(roomRaw, {
      defaultAccesses: ["room:write"],
    });
  } catch (error) {
    if (error instanceof LiveblocksError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    throw error;
  }

  const user = await currentUser();
  const displayName = user ? resolveDisplayName(user) : "Anonymous";
  const avatar = user?.imageUrl ?? "";
  const color = userIdToCursorColor(userId);

  const session = liveblocks.prepareSession(userId, {
    userInfo: {
      name: displayName,
      avatar,
      color,
    },
  });

  session.allow(roomRaw, session.FULL_ACCESS);

  const { status, body } = await session.authorize();

  return new Response(body, { status });
}
