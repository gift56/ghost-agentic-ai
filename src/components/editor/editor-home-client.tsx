"use client";

import { Plus } from "lucide-react";

import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { EditorLayout } from "@/components/editor/editor-layout";
import type { SidebarProject } from "@/components/editor/project-sidebar";
import { Button } from "@/components/ui/button";
import { useProjectActions } from "@/hooks/use-project-actions";

type EditorHomeClientProps = {
  ownedProjects: SidebarProject[];
  sharedProjects: SidebarProject[];
};

export function EditorHomeClient({ ownedProjects, sharedProjects }: EditorHomeClientProps) {
  const actions = useProjectActions();

  return (
    <>
      <EditorLayout
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onCreateProject={actions.openCreateDialog}
        onRenameProject={actions.openRenameDialog}
        onDeleteProject={actions.openDeleteDialog}
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
              <Button data-icon="inline-start" onClick={actions.openCreateDialog}>
                <Plus />
                New Project
              </Button>
            </div>
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
    </>
  );
}
