import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

type CollaboratorRecord = {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: "OWNER" | "COLLABORATOR";
};

const CLERK_EMAIL_CHUNK_SIZE = 500;

async function getIdentity() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null;
  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const displayName = fullName || user?.username || null;
  const avatarUrl = user?.imageUrl ?? null;

  return { userId, email, displayName, avatarUrl };
}

async function getProjectForAccess(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      ownerId: true,
      collaborators: {
        select: {
          email: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

async function enrichCollaborators(
  emails: string[],
): Promise<
  Array<{
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
  }>
> {
  if (!emails.length) {
    return [];
  }

  const client = await clerkClient();
  const byEmail = new Map<
    string,
    { displayName: string | null; avatarUrl: string | null }
  >();

  for (let start = 0; start < emails.length; start += CLERK_EMAIL_CHUNK_SIZE) {
    const chunk = emails.slice(start, start + CLERK_EMAIL_CHUNK_SIZE);
    if (!chunk.length) {
      continue;
    }

    const users = await client.users.getUserList({
      emailAddress: chunk,
      limit: chunk.length,
    });

    for (const user of users.data) {
      for (const address of user.emailAddresses) {
        const normalizedEmail = address.emailAddress.toLowerCase();
        if (!byEmail.has(normalizedEmail)) {
          const fullName =
            `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
          byEmail.set(normalizedEmail, {
            displayName: fullName || user.username || null,
            avatarUrl: user.imageUrl ?? null,
          });
        }
      }
    }
  }

  return emails.map((email) => {
    const clerkData = byEmail.get(email);
    return {
      email,
      displayName: clerkData?.displayName ?? null,
      avatarUrl: clerkData?.avatarUrl ?? null,
    };
  });
}

async function getOwnerRecord(
  ownerId: string,
): Promise<{ email: string; displayName: string | null; avatarUrl: string | null } | null> {
  const client = await clerkClient();

  try {
    const owner = await client.users.getUser(ownerId);
    const email =
      owner.primaryEmailAddress?.emailAddress?.toLowerCase() ??
      owner.emailAddresses[0]?.emailAddress?.toLowerCase() ??
      null;

    if (!email) {
      return null;
    }

    const fullName = `${owner.firstName ?? ""} ${owner.lastName ?? ""}`.trim();
    return {
      email,
      displayName: fullName || owner.username || null,
      avatarUrl: owner.imageUrl ?? null,
    };
  } catch {
    return null;
  }
}

async function buildPeopleWithAccess(
  projectId: string,
  ownerId: string,
  identity?: {
    userId: string;
    email: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  } | null,
): Promise<CollaboratorRecord[]> {
  const [collaborators, owner] = await Promise.all([
    prisma.projectCollaborator.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      select: { email: true },
    }),
    getOwnerRecord(ownerId),
  ]);

  const collaboratorEmails = collaborators.map((item) => item.email.toLowerCase());
  const enrichedCollaborators = await enrichCollaborators(collaboratorEmails);

  const collaboratorRecords: CollaboratorRecord[] = enrichedCollaborators.map((item) => ({
    ...item,
    role: "COLLABORATOR",
  }));

  const fallbackOwner =
    !owner && identity?.userId === ownerId && identity.email
      ? {
          email: identity.email,
          displayName: identity.displayName,
          avatarUrl: identity.avatarUrl,
        }
      : null;

  const ownerRecord = owner ?? fallbackOwner;

  if (!ownerRecord) return collaboratorRecords;

  const isOwnerDuplicated = collaboratorRecords.some((item) => item.email === ownerRecord.email);
  if (isOwnerDuplicated) {
    return collaboratorRecords;
  }

  return [{ ...ownerRecord, role: "OWNER" }, ...collaboratorRecords];
}

export async function GET(_request: Request, context: RouteContext) {
  const identity = await getIdentity();

  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await context.params;
  const project = await getProjectForAccess(projectId);

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isCollaborator =
    identity.email !== null
      ? project.collaborators.some(
          (collaborator) => collaborator.email === identity.email,
        )
      : false;

  if (project.ownerId !== identity.userId && !isCollaborator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const collaborators = await buildPeopleWithAccess(project.id, project.ownerId, identity);

  return NextResponse.json({
    collaborators,
    isOwner: project.ownerId === identity.userId,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const identity = await getIdentity();

  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await context.params;
  const project = await getProjectForAccess(projectId);

  if (!project || project.ownerId !== identity.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const email = body.email?.trim().toLowerCase() ?? "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  await prisma.projectCollaborator.upsert({
    where: {
      projectId_email: {
        projectId,
        email,
      },
    },
    update: {},
    create: {
      projectId,
      email,
    },
  });

  return NextResponse.json(
    {
      collaborators: await buildPeopleWithAccess(projectId, project.ownerId, identity),
    },
    { status: 201 },
  );
}

export async function DELETE(request: Request, context: RouteContext) {
  const identity = await getIdentity();

  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await context.params;
  const project = await getProjectForAccess(projectId);

  if (!project || project.ownerId !== identity.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const email =
    new URL(request.url).searchParams.get("email")?.trim().toLowerCase() ?? "";

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  await prisma.projectCollaborator.deleteMany({
    where: {
      projectId,
      email,
    },
  });

  return NextResponse.json({
    collaborators: await buildPeopleWithAccess(projectId, project.ownerId, identity),
  });
}
