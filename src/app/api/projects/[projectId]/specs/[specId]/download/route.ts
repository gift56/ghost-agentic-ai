import { get } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getAccessibleProjectByRoomId,
  getCurrentProjectIdentity,
} from "@/lib/project-access";

type RouteContext = {
  params: Promise<{
    projectId: string;
    specId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { projectId, specId } = await context.params;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identity = await getCurrentProjectIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessible = await getAccessibleProjectByRoomId(projectId, identity);
  if (!accessible) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const row = await prisma.projectSpec.findFirst({
    where: { id: specId, projectId },
    select: { id: true, filePath: true },
  });

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const blobResult = await get(row.filePath, { access: "private" });
    if (!blobResult || blobResult.statusCode !== 200 || !blobResult.stream) {
      return NextResponse.json(
        { error: "Failed to read specification file" },
        { status: 502 },
      );
    }

    const filename = `spec-${row.id}.md`;
    return new Response(blobResult.stream, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to read specification file" },
      { status: 502 },
    );
  }
}
