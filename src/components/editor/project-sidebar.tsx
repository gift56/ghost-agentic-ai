"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ProjectSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
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

            <TabsContent
              value="my-projects"
              className="mt-4 flex flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-(--bg-subtle) p-4 text-center text-sm text-muted-foreground"
            >
              No projects yet.
            </TabsContent>
            <TabsContent
              value="shared"
              className="mt-4 flex flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-(--bg-subtle) p-4 text-center text-sm text-muted-foreground"
            >
              No shared projects yet.
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t border-border p-4">
          <Button className="w-full" data-icon="inline-start">
            <Plus />
            New Project
          </Button>
        </div>
      </div>
    </aside>
  );
}
