import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getAccessibleProjectByRoomId,
  getCurrentProjectIdentity,
} from "@/lib/project-access";

function specFilename(specId: string): string {
  return `spec-${specId}.md`;
}

function isMissingTableError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2021"
  );
}

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { projectId } = await context.params;

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

  let rows: { id: string; createdAt: Date }[];
  try {
    rows = await prisma.projectSpec.findMany({
      where: { projectId },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        {
          error:
            "Specs table is missing. Apply migrations: `npx prisma migrate deploy`",
        },
        { status: 503 },
      );
    }
    throw error;
  }

  return NextResponse.json({
    specs: rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      filename: specFilename(r.id),
    })),
  });
}
