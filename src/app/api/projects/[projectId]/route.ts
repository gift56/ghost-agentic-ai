import { BlobNotFoundError, del } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const DEFAULT_PROJECT_NAME = "Untitled Project";

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await context.params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project || project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { name?: string };
  const name = body.name?.trim() || DEFAULT_PROJECT_NAME;

  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: { name },
  });

  return NextResponse.json({ project: updatedProject });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await context.params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      ownerId: true,
      canvasJsonPath: true,
      specs: { select: { filePath: true } },
    },
  });

  if (!project || project.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const blobUrls = new Set<string>();
  const canvasUrl = project.canvasJsonPath?.trim() ?? "";
  if (canvasUrl) blobUrls.add(canvasUrl);
  for (const spec of project.specs) {
    const path = spec.filePath?.trim() ?? "";
    if (path) blobUrls.add(path);
  }

  await prisma.project.delete({
    where: { id: projectId },
  });

  await Promise.all(
    [...blobUrls].map(async (url) => {
      try {
        await del(url);
      } catch (error) {
        if (error instanceof BlobNotFoundError) return;
        console.error("[DELETE /api/projects/:projectId] blob delete failed", {
          projectId,
          url,
          error,
        });
      }
    }),
  );

  return new NextResponse(null, { status: 204 });
}
