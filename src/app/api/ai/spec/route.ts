import { auth } from "@clerk/nextjs/server";
import { tasks } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

import {
  generateSpecTaskPayloadSchema,
  specGenerationApiBodySchema,
} from "@/lib/ai-spec-schemas";
import { prisma } from "@/lib/prisma";
import {
  getAccessibleProjectByRoomId,
  getCurrentProjectIdentity,
} from "@/lib/project-access";
import type { generateSpec } from "@/trigger/generate-spec";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await request.json().catch(() => null);
  const parsedBody = specGenerationApiBodySchema.safeParse(raw);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsedBody.error.flatten() },
      { status: 400 },
    );
  }

  const { roomId, chatHistory, nodes, edges } = parsedBody.data;

  const identity = await getCurrentProjectIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessible = await getAccessibleProjectByRoomId(roomId, identity);
  if (!accessible) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const projectId = accessible.id;

  const payload = generateSpecTaskPayloadSchema.safeParse({
    projectId,
    roomId,
    userId,
    chatHistory,
    nodes,
    edges,
  });
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid task payload", details: payload.error.flatten() },
      { status: 400 },
    );
  }

  let handle: { id: string };
  try {
    handle = await tasks.trigger<typeof generateSpec>("generate-spec", payload.data);
  } catch (error) {
    console.error("[POST /api/ai/spec] trigger failed", error);
    return NextResponse.json(
      { error: "Failed to start spec generation task" },
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

  return NextResponse.json({ runId: handle.id });
}
