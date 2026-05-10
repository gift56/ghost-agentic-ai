"use client";

import { ClerkLoaded, ClerkLoading, UserButton } from "@clerk/nextjs";
import { PanelLeftClose, PanelLeftOpen, PanelRightOpen, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type EditorNavbarProps = {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  projectName?: string;
  showWorkspaceActions?: boolean;
  isAiSidebarOpen?: boolean;
  onToggleAiSidebar?: () => void;
  onShareClick?: () => void;
};

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  projectName,
  showWorkspaceActions = false,
  isAiSidebarOpen = false,
  onToggleAiSidebar,
  onShareClick,
}: EditorNavbarProps) {
  return (
    <header className="flex h-14 items-center border-b border-border bg-(--bg-surface) px-4">
      <div className="flex flex-1 items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label={
            isSidebarOpen ? "Close project sidebar" : "Open project sidebar"
          }
        >
          {isSidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>
        {projectName ? (
          <p className="truncate text-sm font-medium text-foreground">{projectName}</p>
        ) : null}
      </div>
      <div className="flex flex-1 items-center justify-center" />
      <div className="flex flex-1 items-center justify-end gap-2">
        {showWorkspaceActions ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-icon="inline-start"
              onClick={onShareClick}
            >
              <Share2 />
              Share
            </Button>
            <Button
              type="button"
              variant={isAiSidebarOpen ? "secondary" : "outline"}
              size="icon-sm"
              onClick={onToggleAiSidebar}
              aria-label={isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"}
            >
              <PanelRightOpen />
            </Button>
          </>
        ) : null}
        <ClerkLoading>
          <Skeleton className="h-7 w-7 rounded-full" />
        </ClerkLoading>
        <ClerkLoaded>
          <UserButton />
        </ClerkLoaded>
      </div>
    </header>
  );
}
