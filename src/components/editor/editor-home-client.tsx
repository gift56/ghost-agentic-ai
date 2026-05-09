"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { EditorLayout } from "@/components/editor/editor-layout";
import type { SidebarProject } from "@/components/editor/project-sidebar";
import { useProjectDialogs } from "@/components/editor/use-project-dialogs";
import { Button } from "@/components/ui/button";

const initialProjects: SidebarProject[] = [
  {
    id: "p_01",
    name: "Platform Architecture",
    slug: "platform-architecture",
    isOwned: true,
  },
  {
    id: "p_02",
    name: "Billing Flow Refresh",
    slug: "billing-flow-refresh",
    isOwned: true,
  },
  {
    id: "p_03",
    name: "Agent Runtime Docs",
    slug: "agent-runtime-docs",
    isOwned: false,
  },
];

export function EditorHomeClient() {
  const [projects, setProjects] = useState(initialProjects);
  const dialogs = useProjectDialogs();

  return (
    <>
      <EditorLayout
        projects={projects}
        onCreateProject={dialogs.openCreateDialog}
        onRenameProject={(project) => dialogs.openRenameDialog(project)}
        onDeleteProject={(project) => dialogs.openDeleteDialog(project)}
      >
        <section className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-6 py-12">
          <div className="mx-auto max-w-xl text-center">
            <h1 className="text-2xl font-semibold text-foreground">
              Create a project or open an existing one
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Start a new architecture workspace, or choose a project from the
              sidebar.
            </p>
            <div className="mt-6 flex justify-center">
              <Button
                data-icon="inline-start"
                onClick={dialogs.openCreateDialog}
              >
                <Plus />
                New Project
              </Button>
            </div>
          </div>
        </section>
      </EditorLayout>
      <ProjectDialogs
        activeDialog={dialogs.activeDialog}
        selectedProject={dialogs.selectedProject}
        projectName={dialogs.projectName}
        slugPreview={dialogs.slugPreview}
        isLoading={dialogs.isLoading}
        onClose={dialogs.closeDialog}
        onProjectNameChange={dialogs.setProjectName}
        onSubmit={() =>
          dialogs.submit(
            async ({ activeDialog, name, slug, selectedProject }) => {
              if (activeDialog === "create") {
                setProjects((current) => [
                  {
                    id: `p_${Date.now()}`,
                    name,
                    slug,
                    isOwned: true,
                  },
                  ...current,
                ]);
                return;
              }

              if (activeDialog === "rename" && selectedProject) {
                setProjects((current) =>
                  current.map((project) =>
                    project.id === selectedProject.id
                      ? { ...project, name, slug }
                      : project,
                  ),
                );
                return;
              }

              if (activeDialog === "delete" && selectedProject) {
                setProjects((current) =>
                  current.filter((project) => project.id !== selectedProject.id),
                );
              }
            },
          )
        }
      />
    </>
  );
}
