"use client";

import { Trash2 } from "lucide-react";

import { EditorDialogShell } from "@/components/editor/editor-dialog-shell";
import {
  type ProjectDialogType,
  type ProjectDialogProject,
} from "@/components/editor/use-project-dialogs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type ProjectDialogsProps = {
  activeDialog: ProjectDialogType | null;
  selectedProject: ProjectDialogProject | null;
  projectName: string;
  slugPreview: string;
  isLoading: boolean;
  onClose: () => void;
  onProjectNameChange: (value: string) => void;
  onSubmit: () => void;
};

export function ProjectDialogs({
  activeDialog,
  selectedProject,
  projectName,
  slugPreview,
  isLoading,
  onClose,
  onProjectNameChange,
  onSubmit,
}: ProjectDialogsProps) {
  return (
    <Dialog open={activeDialog !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-fit border-none bg-transparent p-0 ring-0">
        {activeDialog === "create" ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <EditorDialogShell
              title="Create Project"
              description="Start with a name and we will generate a project slug."
              footer={
                <>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!projectName.trim() || isLoading}>
                    Create Project
                  </Button>
                </>
              }
            >
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="project-name-create">
                    Project Name
                  </label>
                  <Input
                    id="project-name-create"
                    value={projectName}
                    onChange={(event) => onProjectNameChange(event.target.value)}
                    placeholder="New Architecture Workspace"
                    autoFocus
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Slug preview:{" "}
                  <span className="font-mono text-foreground">/{slugPreview}</span>
                </p>
              </div>
            </EditorDialogShell>
          </form>
        ) : null}

        {activeDialog === "rename" && selectedProject ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <EditorDialogShell
              title="Rename Project"
              description={`Current project: ${selectedProject.name}`}
              footer={
                <>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!projectName.trim() || isLoading}>
                    Save Name
                  </Button>
                </>
              }
            >
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="project-name-rename">
                  Project Name
                </label>
                <Input
                  id="project-name-rename"
                  value={projectName}
                  onChange={(event) => onProjectNameChange(event.target.value)}
                  autoFocus
                />
              </div>
            </EditorDialogShell>
          </form>
        ) : null}

        {activeDialog === "delete" && selectedProject ? (
          <EditorDialogShell
            title="Delete Project"
            description={`Delete "${selectedProject.name}"? This action cannot be undone.`}
            footer={
              <>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={onSubmit} disabled={isLoading} data-icon="inline-start">
                  <Trash2 />
                  Delete Project
                </Button>
              </>
            }
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
