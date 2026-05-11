import { auth } from "@clerk/nextjs/server";
import { auth as triggerAuth, tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getAccessibleProjectByRoomId,
  getCurrentProjectIdentity,
} from "@/lib/project-access";
import type { designAgent } from "@/trigger/design-agent";

type DesignBody = {
  prompt?: unknown;
  roomId?: unknown;
  projectId?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as DesignBody | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt, roomId, projectId } = body;
  if (!isNonEmptyString(prompt) || !isNonEmptyString(roomId) || !isNonEmptyString(projectId)) {
    return NextResponse.json(
      { error: "prompt, roomId, and projectId are required" },
      { status: 400 },
    );
  }

  if (roomId !== projectId) {
    return NextResponse.json(
      { error: "roomId must match projectId for this workspace" },
      { status: 400 },
    );
  }

  const identity = await getCurrentProjectIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessible = await getAccessibleProjectByRoomId(projectId, identity);
  if (!accessible) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let handle: { id: string };
  try {
    handle = await tasks.trigger<typeof designAgent>("design-agent", {
      prompt,
      roomId,
      userId,
    });
  } catch (error) {
    console.error("[POST /api/ai/design] trigger failed", error);
    return NextResponse.json(
      { error: "Failed to start design task" },
      { status: 502 },
    );
  }

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId,
      userId,
    },
  });

  let publicToken: string;
  try {
    publicToken = await triggerAuth.createPublicToken({
      scopes: {
        read: {
          runs: [handle.id],
          tasks: ["design-agent"],
        },
      },
      expirationTime: "1h",
    });
  } catch (error) {
    console.error("[POST /api/ai/design] createPublicToken failed", error);
    return NextResponse.json(
      { error: "Failed to issue run token", runId: handle.id },
      { status: 502 },
    );
  }

  return NextResponse.json({ runId: handle.id, publicToken });
}
