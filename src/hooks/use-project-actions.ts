"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { SidebarProject } from "@/components/editor/project-sidebar";

export type ProjectDialogType = "create" | "rename" | "delete";

type ProjectActionsState = {
  activeDialog: ProjectDialogType | null;
  selectedProject: SidebarProject | null;
  projectName: string;
  roomIdPreview: string;
  isLoading: boolean;
  setProjectName: (value: string) => void;
  openCreateDialog: () => void;
  openRenameDialog: (project: SidebarProject) => void;
  openDeleteDialog: (project: SidebarProject) => void;
  closeDialog: () => void;
  createProject: () => Promise<void>;
  renameProject: () => Promise<void>;
  deleteProject: () => Promise<void>;
};

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "new-project";
}

function shortSuffix() {
  return Math.random().toString(36).slice(2, 7);
}

export function useProjectActions(): ProjectActionsState {
  const router = useRouter();
  const pathname = usePathname();

  const [activeDialog, setActiveDialog] = useState<ProjectDialogType | null>(null);
  const [selectedProject, setSelectedProject] = useState<SidebarProject | null>(null);
  const [projectName, setProjectName] = useState("");
  const [createSuffix, setCreateSuffix] = useState(shortSuffix);
  const [isLoading, setIsLoading] = useState(false);

  const activeProjectId = useMemo(() => pathname.split("/")[2] ?? null, [pathname]);
  const roomIdPreview = useMemo(() => `${slugify(projectName)}-${createSuffix}`, [projectName, createSuffix]);

  function openCreateDialog() {
    setSelectedProject(null);
    setProjectName("");
    setCreateSuffix(shortSuffix());
    setActiveDialog("create");
  }

  function openRenameDialog(project: SidebarProject) {
    setSelectedProject(project);
    setProjectName(project.name);
    setActiveDialog("rename");
  }

  function openDeleteDialog(project: SidebarProject) {
    setSelectedProject(project);
    setProjectName(project.name);
    setActiveDialog("delete");
  }

  function closeDialog() {
    setActiveDialog(null);
    setSelectedProject(null);
    setProjectName("");
    setIsLoading(false);
  }

  async function createProject() {
    if (!projectName.trim()) return;

    const roomId = roomIdPreview;

    setIsLoading(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: roomId, name: projectName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      closeDialog();
      router.push(`/editor/${roomId}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function renameProject() {
    if (!selectedProject || !projectName.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to rename project");
      }

      closeDialog();
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteProject() {
    if (!selectedProject) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      closeDialog();
      if (activeProjectId && activeProjectId === selectedProject.id) {
        router.push("/editor");
        return;
      }
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return {
    activeDialog,
    selectedProject,
    projectName,
    roomIdPreview,
    isLoading,
    setProjectName,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
    createProject,
    renameProject,
    deleteProject,
  };
}
