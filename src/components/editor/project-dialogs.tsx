"use client";

import { Loader2, Trash2 } from "lucide-react";

import { EditorDialogShell } from "@/components/editor/editor-dialog-shell";
import type { ProjectDialogType } from "@/hooks/use-project-actions";
import type { SidebarProject } from "@/components/editor/project-sidebar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type ProjectDialogsProps = {
  activeDialog: ProjectDialogType | null;
  selectedProject: SidebarProject | null;
  projectName: string;
  roomIdPreview: string;
  isLoading: boolean;
  onClose: () => void;
  onProjectNameChange: (value: string) => void;
  onCreate: () => Promise<void>;
  onRename: () => Promise<void>;
  onDelete: () => Promise<void>;
};

export function ProjectDialogs({
  activeDialog,
  selectedProject,
  projectName,
  roomIdPreview,
  isLoading,
  onClose,
  onProjectNameChange,
  onCreate,
  onRename,
  onDelete,
}: ProjectDialogsProps) {
  return (
    <Dialog open={activeDialog !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-fit border-none bg-transparent p-0 ring-0">
        {activeDialog === "create" ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void onCreate();
            }}
          >
            <EditorDialogShell
              title="Create Project"
              description="Start with a name and we will generate a room ID."
              footer={
                <>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!projectName.trim() || isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : null}
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
                  Room ID preview: <span className="font-mono text-foreground">{roomIdPreview}</span>
                </p>
              </div>
            </EditorDialogShell>
          </form>
        ) : null}

        {activeDialog === "rename" && selectedProject ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void onRename();
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
                    {isLoading ? <Loader2 className="animate-spin" /> : null}
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
                <Button type="button" variant="destructive" onClick={() => void onDelete()} disabled={isLoading} data-icon="inline-start">
                  {isLoading ? <Loader2 className="animate-spin" /> : <Trash2 />}
                  {isLoading ? "Deleting..." : "Delete Project"}
                </Button>
              </>
            }
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
