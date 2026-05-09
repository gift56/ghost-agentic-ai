"use client";

import { useMemo, useState } from "react";

export type ProjectDialogType = "create" | "rename" | "delete";

export type ProjectDialogProject = {
  id: string;
  name: string;
  slug: string;
};

type UseProjectDialogsResult = {
  activeDialog: ProjectDialogType | null;
  selectedProject: ProjectDialogProject | null;
  projectName: string;
  slugPreview: string;
  isLoading: boolean;
  setProjectName: (value: string) => void;
  openCreateDialog: () => void;
  openRenameDialog: (project: ProjectDialogProject) => void;
  openDeleteDialog: (project: ProjectDialogProject) => void;
  closeDialog: () => void;
  submit: (onSubmit: (payload: {
    name: string;
    slug: string;
    selectedProject: ProjectDialogProject | null;
    activeDialog: ProjectDialogType;
  }) => Promise<void> | void) => Promise<void>;
};

function toSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "new-project";
}

export function useProjectDialogs(): UseProjectDialogsResult {
  const [activeDialog, setActiveDialog] = useState<ProjectDialogType | null>(
    null,
  );
  const [selectedProject, setSelectedProject] =
    useState<ProjectDialogProject | null>(null);
  const [projectName, setProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const slugPreview = useMemo(() => toSlug(projectName), [projectName]);

  function openCreateDialog() {
    setSelectedProject(null);
    setProjectName("");
    setActiveDialog("create");
  }

  function openRenameDialog(project: ProjectDialogProject) {
    setSelectedProject(project);
    setProjectName(project.name);
    setActiveDialog("rename");
  }

  function openDeleteDialog(project: ProjectDialogProject) {
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

  async function submit(
    onSubmit: (payload: {
      name: string;
      slug: string;
      selectedProject: ProjectDialogProject | null;
      activeDialog: ProjectDialogType;
    }) => Promise<void> | void,
  ) {
    if (!activeDialog) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        name: projectName.trim(),
        slug: slugPreview,
        selectedProject,
        activeDialog,
      });
      closeDialog();
    } finally {
      setIsLoading(false);
    }
  }

  return {
    activeDialog,
    selectedProject,
    projectName,
    slugPreview,
    isLoading,
    setProjectName,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
    submit,
  };
}
