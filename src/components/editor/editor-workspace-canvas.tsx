"use client";

import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

import { LiveMap, LiveObject } from "@liveblocks/client";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { useCallback } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { EditorWorkspaceCanvasFlow } from "@/components/editor/editor-workspace-canvas-flow";
import type { CanvasAutosaveStatus } from "@/hooks/use-canvas-autosave";
import { userIdToCursorColor } from "@/lib/cursor-color";

function fallbackResolvedUsers(userIds: string[]) {
  return userIds.map((id) => ({
    name: "Collaborator",
    avatar: "",
    color: userIdToCursorColor(id),
  }));
}

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
  const resolveUsers = useCallback(
    async ({ userIds }: { userIds: string[] }) => {
      if (userIds.length === 0) {
        return [];
      }

      try {
        const res = await fetch("/api/liveblocks-resolve-users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds }),
          credentials: "same-origin",
        });

        if (!res.ok) {
          return fallbackResolvedUsers(userIds);
        }

        const data = (await res.json()) as {
          users: Array<{ name: string; avatar: string; color: string }>;
        };

        if (!Array.isArray(data.users) || data.users.length !== userIds.length) {
          return fallbackResolvedUsers(userIds);
        }

        return data.users;
      } catch {
        return fallbackResolvedUsers(userIds);
      }
    },
    [],
  );

  return (
    <LiveblocksProvider
      authEndpoint="/api/liveblocks-auth"
      resolveUsers={resolveUsers}
    >
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, thinking: false }}
        initialStorage={() => ({
          flow: new LiveObject({
            nodes: new LiveMap(),
            edges: new LiveMap(),
          }),
        })}
      >
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
      </RoomProvider>
    </LiveblocksProvider>
  );
}
