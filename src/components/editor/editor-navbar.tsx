"use client";

import { ClerkLoaded, ClerkLoading, UserButton } from "@clerk/nextjs";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type EditorNavbarProps = {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
}: EditorNavbarProps) {
  return (
    <header className="flex h-14 items-center border-b border-border bg-(--bg-surface) px-4">
      <div className="flex flex-1 items-center">
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
      </div>
      <div className="flex flex-1 items-center justify-center" />
      <div className="flex flex-1 items-center justify-end">
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