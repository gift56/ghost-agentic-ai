"use client";

import { useState } from "react";

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
      >
        <section className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center bg-zinc-950 px-6 py-12">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-zinc-100">Canvas Coming Soon</h1>
            <p className="mt-2 text-sm text-zinc-400">
              This workspace shell is ready. Canvas editing will be added next.
            </p>
          </div>
        </section>
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
