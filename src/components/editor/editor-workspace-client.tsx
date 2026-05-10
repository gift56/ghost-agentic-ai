"use client";

import { useState } from "react";

import { EditorWorkspaceCanvas } from "@/components/editor/editor-workspace-canvas";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ShareDialog } from "@/components/editor/share-dialog";
import { EditorLayout } from "@/components/editor/editor-layout";
import type { SidebarProject } from "@/components/editor/project-sidebar";
import { useProjectActions } from "@/hooks/use-project-actions";

type EditorWorkspaceClientProps = {
  roomId: string;
  projectName: string;
  ownedProjects: SidebarProject[];
  sharedProjects: SidebarProject[];
  isOwner: boolean;
};

export function EditorWorkspaceClient({
  roomId,
  projectName,
  ownedProjects,
  sharedProjects,
  isOwner,
}: EditorWorkspaceClientProps) {
  const actions = useProjectActions();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isStarterTemplatesOpen, setIsStarterTemplatesOpen] = useState(false);

  return (
    <>
      <EditorLayout
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        activeRoomId={roomId}
        projectName={projectName}
        showWorkspaceActions
        onCreateProject={actions.openCreateDialog}
        onRenameProject={actions.openRenameDialog}
        onDeleteProject={actions.openDeleteDialog}
        onShareProject={() => setIsShareDialogOpen(true)}
        onOpenStarterTemplates={() => setIsStarterTemplatesOpen(true)}
      >
        <EditorWorkspaceCanvas
          roomId={roomId}
          starterTemplatesOpen={isStarterTemplatesOpen}
          onStarterTemplatesOpenChange={setIsStarterTemplatesOpen}
        />
      </EditorLayout>
      <ProjectDialogs
        activeDialog={actions.activeDialog}
        selectedProject={actions.selectedProject}
        projectName={actions.projectName}
        roomIdPreview={actions.roomIdPreview}
        isLoading={actions.isLoading}
        onClose={actions.closeDialog}
        onProjectNameChange={actions.setProjectName}
        onCreate={actions.createProject}
        onRename={actions.renameProject}
        onDelete={actions.deleteProject}
      />
      <ShareDialog
        roomId={roomId}
        isOwner={isOwner}
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
      />
    </>
  );
}
