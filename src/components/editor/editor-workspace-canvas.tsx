"use client";

import { ClientSideSuspense } from "@liveblocks/react/suspense";
import { ErrorBoundary } from "react-error-boundary";

import { EditorWorkspaceCanvasFlow } from "@/components/editor/editor-workspace-canvas-flow";
import type { CanvasAutosaveStatus } from "@/hooks/use-canvas-autosave";

type EditorWorkspaceCanvasProps = {
  roomId: string;
  savedCanvasBlobUrl: string | null;
  starterTemplatesOpen: boolean;
  onStarterTemplatesOpenChange: (open: boolean) => void;
  onSaveStatusChange?: (status: CanvasAutosaveStatus) => void;
  onAutosaveFlushReady?: (flush: () => Promise<void>) => void;
};

function EditorWorkspaceCanvasLoading() {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] w-full items-center justify-center bg-zinc-950 text-sm text-zinc-400">
      Connecting to canvas…
    </div>
  );
}

function EditorWorkspaceCanvasError() {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] w-full flex-col items-center justify-center gap-2 bg-zinc-950 px-6 text-center">
      <p className="text-sm font-medium text-zinc-200">
        Liveblocks connection error
      </p>
      <p className="max-w-sm text-xs text-zinc-500">
        The collaborative canvas could not connect. Check your network and
        Liveblocks configuration, then reload the page.
      </p>
    </div>
  );
}

export function EditorWorkspaceCanvas({
  roomId,
  savedCanvasBlobUrl,
  starterTemplatesOpen,
  onStarterTemplatesOpenChange,
  onSaveStatusChange,
  onAutosaveFlushReady,
}: EditorWorkspaceCanvasProps) {
  return (
    <ErrorBoundary fallback={<EditorWorkspaceCanvasError />}>
      <ClientSideSuspense fallback={<EditorWorkspaceCanvasLoading />}>
        <EditorWorkspaceCanvasFlow
          projectId={roomId}
          savedCanvasBlobUrl={savedCanvasBlobUrl}
          starterTemplatesOpen={starterTemplatesOpen}
          onStarterTemplatesOpenChange={onStarterTemplatesOpenChange}
          onSaveStatusChange={onSaveStatusChange}
          onAutosaveFlushReady={onAutosaveFlushReady}
        />
      </ClientSideSuspense>
    </ErrorBoundary>
  );
}
