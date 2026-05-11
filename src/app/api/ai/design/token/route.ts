import { auth } from "@clerk/nextjs/server";
import { auth as triggerAuth } from "@trigger.dev/sdk";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type TokenBody = {
  runId?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as TokenBody | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isNonEmptyString(body.runId)) {
    return NextResponse.json({ error: "runId is required" }, { status: 400 });
  }

  const runId = body.runId.trim();

  const taskRun = await prisma.taskRun.findUnique({
    where: { runId },
  });

  if (!taskRun || taskRun.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let token: string;
  try {
    token = await triggerAuth.createPublicToken({
      scopes: {
        read: {
          runs: [runId],
          tasks: ["design-agent"],
        },
      },
      expirationTime: "1h",
    });
  } catch (error) {
    console.error("[POST /api/ai/design/token] createPublicToken failed", error);
    return NextResponse.json(
      { error: "Failed to issue token" },
      { status: 502 },
    );
  }

  return NextResponse.json({ token });
}
