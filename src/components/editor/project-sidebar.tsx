"use client";

import { Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type SidebarProject = {
  id: string;
  name: string;
  slug: string;
  isOwned: boolean;
};

type ProjectSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  projects: SidebarProject[];
  onCreateProject: () => void;
  onRenameProject: (project: SidebarProject) => void;
  onDeleteProject: (project: SidebarProject) => void;
};

export function ProjectSidebar({
  isOpen,
  onClose,
  projects,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: ProjectSidebarProps) {
  const myProjects = projects.filter((project) => project.isOwned);
  const sharedProjects = projects.filter((project) => !project.isOwned);

  return (
    <aside
      className={`pointer-events-none fixed inset-y-0 left-0 z-40 w-80 p-4 pt-18 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-out`}
      aria-hidden={!isOpen}
    >
      <div className="pointer-events-auto flex h-full flex-col rounded-xl border border-border bg-(--bg-elevated) shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Projects</h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close project sidebar"
          >
            <X />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-4">
          <Tabs defaultValue="my-projects" className="h-full">
            <TabsList className="w-full">
              <TabsTrigger value="my-projects">My Projects</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
            </TabsList>

            <TabsContent value="my-projects" className="mt-4">
              {myProjects.length ? (
                <ul className="space-y-2">
                  {myProjects.map((project) => (
                    <li
                      key={project.id}
                      className="rounded-lg border border-border bg-(--bg-subtle) p-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {project.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            /{project.slug}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Rename ${project.name}`}
                          onClick={() => onRenameProject(project)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${project.name}`}
                          onClick={() => onDeleteProject(project)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed border-border bg-(--bg-subtle) p-4 text-center text-sm text-muted-foreground">
                  No projects yet.
                </div>
              )}
            </TabsContent>
            <TabsContent value="shared" className="mt-4">
              {sharedProjects.length ? (
                <ul className="space-y-2">
                  {sharedProjects.map((project) => (
                    <li
                      key={project.id}
                      className="rounded-lg border border-border bg-(--bg-subtle) p-2.5"
                    >
                      <p className="truncate text-sm font-medium text-foreground">
                        {project.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        /{project.slug}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed border-border bg-(--bg-subtle) p-4 text-center text-sm text-muted-foreground">
                  No shared projects yet.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t border-border p-4">
          <Button className="w-full" data-icon="inline-start" onClick={onCreateProject}>
            <Plus />
            New Project
          </Button>
        </div>
      </div>
    </aside>
  );
}
