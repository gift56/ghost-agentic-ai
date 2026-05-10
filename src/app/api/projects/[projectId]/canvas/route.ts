import { get, put } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getAccessibleProjectByRoomId,
  getCurrentProjectIdentity,
} from "@/lib/project-access";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

function isCanvasPayload(value: unknown): value is {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
} {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return Array.isArray(o.nodes) && Array.isArray(o.edges);
}

async function requireCanvasAccess(projectId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const identity = await getCurrentProjectIdentity();
  if (!identity) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const accessible = await getAccessibleProjectByRoomId(projectId, identity);
  if (!accessible) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const };
}

export async function GET(_request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const access = await requireCanvasAccess(projectId);
  if ("error" in access) return access.error;

  const row = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });

  const url = row?.canvasJsonPath?.trim() ?? "";
  if (!url) {
    return NextResponse.json({ canvas: null }, { status: 200 });
  }

  try {
    const blobResult = await get(url, { access: "private" });
    if (!blobResult || blobResult.statusCode !== 200 || !blobResult.stream) {
      return NextResponse.json(
        { error: "Failed to read saved canvas" },
        { status: 502 },
      );
    }
    const json = (await new Response(blobResult.stream).json()) as unknown;
    if (!isCanvasPayload(json)) {
      return NextResponse.json(
        { error: "Invalid canvas snapshot" },
        { status: 502 },
      );
    }
    return NextResponse.json({ canvas: json });
  } catch {
    return NextResponse.json(
      { error: "Failed to read saved canvas" },
      { status: 502 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const access = await requireCanvasAccess(projectId);
  if ("error" in access) return access.error;

  const body = (await request.json().catch(() => null)) as unknown;
  const canvas = body && typeof body === "object" && "canvas" in body
    ? (body as { canvas: unknown }).canvas
    : body;

  if (!isCanvasPayload(canvas)) {
    return NextResponse.json({ error: "Invalid canvas payload" }, { status: 400 });
  }

  const payload = JSON.stringify(canvas);

  try {
    const blob = await put(`canvas/${projectId}.json`, payload, {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/json",
      allowOverwrite: true,
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: blob.url },
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[canvas PUT]", error);
    return NextResponse.json(
      { error: "Failed to persist canvas" },
      { status: 500 },
    );
  }
}
