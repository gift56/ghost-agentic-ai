import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/editor/access-denied";
import { EditorWorkspaceClient } from "@/components/editor/editor-workspace-client";
import { getEditorHomeProjects } from "@/lib/project-data";
import {
  getAccessibleProjectByRoomId,
  getCurrentProjectIdentity,
} from "@/lib/project-access";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Project workspace shell for architecture collaboration.",
};

type WorkspacePageProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { roomId } = await params;
  const identity = await getCurrentProjectIdentity();

  if (!identity) {
    redirect("/sign-in");
  }

  const project = await getAccessibleProjectByRoomId(roomId, identity);

  if (!project) {
    return <AccessDenied />;
  }

  const { ownedProjects, sharedProjects } = await getEditorHomeProjects();

  return (
    <EditorWorkspaceClient
      roomId={roomId}
      projectName={project.name}
      savedCanvasBlobUrl={
        project.canvasJsonPath.trim() ? project.canvasJsonPath : null
      }
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
      isOwner={project.isOwner}
    />
  );
}
