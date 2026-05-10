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
  onCreateProject: () => void;
  onRenameProject: (project: SidebarProject) => void;
  onDeleteProject: (project: SidebarProject) => void;
};

export function EditorLayout({
  children,
  ownedProjects,
  sharedProjects,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: EditorLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-background">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
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
        onCreateProject={onCreateProject}
        onRenameProject={onRenameProject}
        onDeleteProject={onDeleteProject}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
