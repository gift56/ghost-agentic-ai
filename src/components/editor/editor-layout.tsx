"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import type { CanvasAutosaveStatus } from "@/hooks/use-canvas-autosave";
import {
  type SidebarProject,
  ProjectSidebar,
} from "@/components/editor/project-sidebar";
import { EditorAiSidebar } from "@/components/editor/editor-ai-sidebar";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type EditorLayoutProps = {
  children: ReactNode;
  ownedProjects: SidebarProject[];
  sharedProjects: SidebarProject[];
  activeRoomId?: string | null;
  projectName?: string;
  showWorkspaceActions?: boolean;
  onCreateProject: () => void;
  onRenameProject: (project: SidebarProject) => void;
  onDeleteProject: (project: SidebarProject) => void;
  onShareProject?: () => void;
  onOpenStarterTemplates?: () => void;
  canvasSave?: {
    status: CanvasAutosaveStatus;
    onManualSave: () => void;
  };
};

export function EditorLayout({
  children,
  ownedProjects,
  sharedProjects,
  activeRoomId,
  projectName,
  showWorkspaceActions = false,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onShareProject,
  onOpenStarterTemplates,
  canvasSave,
}: EditorLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-background">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        projectName={projectName}
        showWorkspaceActions={showWorkspaceActions}
        hideUserButton={showWorkspaceActions}
        isAiSidebarOpen={isAiSidebarOpen}
        onToggleAiSidebar={() => setIsAiSidebarOpen((open) => !open)}
        onShareClick={onShareProject}
        onOpenStarterTemplates={onOpenStarterTemplates}
        canvasSave={canvasSave}
      />
      {isSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close project sidebar"
        />
      ) : null}
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        activeRoomId={activeRoomId}
        onCreateProject={onCreateProject}
        onRenameProject={onRenameProject}
        onDeleteProject={onDeleteProject}
      />
      <main className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">{children}</div>
      </main>
      {showWorkspaceActions ? (
        <Dialog open={isAiSidebarOpen} onOpenChange={setIsAiSidebarOpen}>
          <DialogContent
            showCloseButton={false}
            className="top-0 right-0 left-auto h-dvh w-full max-w-sm translate-x-0 translate-y-0 gap-0 rounded-none border-0 bg-transparent p-0 shadow-none ring-0 duration-200 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-right data-open:zoom-in-100 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-right data-closed:zoom-out-100"
          >
            <EditorAiSidebar onClose={() => setIsAiSidebarOpen(false)} />
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
