import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export type ProjectListItem = {
  id: string;
  name: string;
  roomId: string;
};

export type EditorHomeProjectData = {
  ownedProjects: ProjectListItem[];
  sharedProjects: ProjectListItem[];
};

export async function getEditorHomeProjects(): Promise<EditorHomeProjectData> {
  const { userId } = await auth();

  if (!userId) {
    return { ownedProjects: [], sharedProjects: [] };
  }

  const user = await currentUser();
  const emails = (user?.emailAddresses ?? [])
    .map((email) => email.emailAddress.toLowerCase())
    .filter(Boolean);

  const [ownedProjects, sharedProjects] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    emails.length
      ? prisma.project.findMany({
          where: {
            ownerId: { not: userId },
            collaborators: {
              some: {
                email: { in: emails },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  return {
    ownedProjects: ownedProjects.map((project) => ({
      id: project.id,
      name: project.name,
      roomId: project.id,
    })),
    sharedProjects: sharedProjects.map((project) => ({
      id: project.id,
      name: project.name,
      roomId: project.id,
    })),
  };
}
