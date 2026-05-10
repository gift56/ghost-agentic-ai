"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import {
  type SidebarProject,
  ProjectSidebar,
} from "@/components/editor/project-sidebar";

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
        isAiSidebarOpen={isAiSidebarOpen}
        onToggleAiSidebar={() => setIsAiSidebarOpen((open) => !open)}
        onShareClick={onShareProject}
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
        {showWorkspaceActions ? (
          <aside
            className={`hidden border-l border-border bg-(--bg-elevated) transition-[width] duration-300 ease-out lg:block ${
              isAiSidebarOpen ? "w-80" : "w-0 overflow-hidden border-l-0"
            }`}
          >
            <div className="flex h-full w-80 items-center justify-center p-6 text-center text-sm text-muted-foreground">
              AI sidebar placeholder
            </div>
          </aside>
        ) : null}
      </main>
    </div>
  );
}
