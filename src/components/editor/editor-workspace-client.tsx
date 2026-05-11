"use client";

import { useCallback, useRef, useState } from "react";

import { EditorWorkspaceCanvas } from "@/components/editor/editor-workspace-canvas";
import { EditorWorkspaceRoom } from "@/components/editor/editor-workspace-room";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ShareDialog } from "@/components/editor/share-dialog";
import { EditorLayout } from "@/components/editor/editor-layout";
import type { SidebarProject } from "@/components/editor/project-sidebar";
import type { CanvasAutosaveStatus } from "@/hooks/use-canvas-autosave";
import { useProjectActions } from "@/hooks/use-project-actions";

type EditorWorkspaceClientProps = {
  roomId: string;
  projectName: string;
  savedCanvasBlobUrl: string | null;
  ownedProjects: SidebarProject[];
  sharedProjects: SidebarProject[];
  isOwner: boolean;
};

export function EditorWorkspaceClient({
  roomId,
  projectName,
  savedCanvasBlobUrl,
  ownedProjects,
  sharedProjects,
  isOwner,
}: EditorWorkspaceClientProps) {
  const actions = useProjectActions();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isStarterTemplatesOpen, setIsStarterTemplatesOpen] = useState(false);
  const [canvasSaveStatus, setCanvasSaveStatus] =
    useState<CanvasAutosaveStatus>("idle");
  const autosaveFlushRef = useRef<() => Promise<void>>(async () => {});

  const handleAutosaveFlushReady = useCallback((flush: () => Promise<void>) => {
    autosaveFlushRef.current = flush;
  }, []);

  return (
    <EditorWorkspaceRoom roomId={roomId}>
      <EditorLayout
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        activeRoomId={roomId}
        projectName={projectName}
        showWorkspaceActions
        aiSidebarRoomId={roomId}
        aiSidebarProjectId={roomId}
        onCreateProject={actions.openCreateDialog}
        onRenameProject={actions.openRenameDialog}
        onDeleteProject={actions.openDeleteDialog}
        onShareProject={() => setIsShareDialogOpen(true)}
        onOpenStarterTemplates={() => setIsStarterTemplatesOpen(true)}
        canvasSave={{
          status: canvasSaveStatus,
          onManualSave: () => {
            void autosaveFlushRef.current();
          },
        }}
      >
        <EditorWorkspaceCanvas
          roomId={roomId}
          savedCanvasBlobUrl={savedCanvasBlobUrl}
          starterTemplatesOpen={isStarterTemplatesOpen}
          onStarterTemplatesOpenChange={setIsStarterTemplatesOpen}
          onSaveStatusChange={setCanvasSaveStatus}
          onAutosaveFlushReady={handleAutosaveFlushReady}
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
    </EditorWorkspaceRoom>
  );
}
