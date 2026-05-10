import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

type ProjectIdentity = {
  userId: string;
  email: string | null;
};

export type AccessibleProject = {
  id: string;
  name: string;
  isOwner: boolean;
};

export async function getCurrentProjectIdentity(): Promise<ProjectIdentity | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();
  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null;

  return {
    userId,
    email: primaryEmail,
  };
}

export async function getAccessibleProjectByRoomId(
  roomId: string,
  identity: ProjectIdentity,
): Promise<AccessibleProject | null> {
  const project = await prisma.project.findFirst({
    where: {
      id: roomId,
      OR: [
        { ownerId: identity.userId },
        identity.email
          ? {
              collaborators: {
                some: {
                  email: identity.email,
                },
              },
            }
          : undefined,
      ].filter(Boolean) as Array<Record<string, unknown>>,
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  });

  if (!project) {
    return null;
  }

  return {
    id: project.id,
    name: project.name,
    isOwner: project.ownerId === identity.userId,
  };
}
