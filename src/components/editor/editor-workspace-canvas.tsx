"use client";

import "@xyflow/react/dist/style.css";
import "@liveblocks/react-flow/styles.css";

import { LiveMap, LiveObject } from "@liveblocks/client";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { ErrorBoundary } from "react-error-boundary";

import { EditorWorkspaceCanvasFlow } from "@/components/editor/editor-workspace-canvas-flow";

type EditorWorkspaceCanvasProps = {
  roomId: string;
  starterTemplatesOpen: boolean;
  onStarterTemplatesOpenChange: (open: boolean) => void;
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
  starterTemplatesOpen,
  onStarterTemplatesOpenChange,
}: EditorWorkspaceCanvasProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, isThinking: false }}
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
              starterTemplatesOpen={starterTemplatesOpen}
              onStarterTemplatesOpenChange={onStarterTemplatesOpenChange}
            />
          </ClientSideSuspense>
        </ErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
