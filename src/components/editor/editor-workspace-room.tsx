"use client";

import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

import { LiveMap, LiveObject } from "@liveblocks/client";
import {
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { useCallback, type ReactNode } from "react";

import { userIdToCursorColor } from "@/lib/cursor-color";

function fallbackResolvedUsers(userIds: string[]) {
  return userIds.map((id) => ({
    name: "Collaborator",
    avatar: "",
    color: userIdToCursorColor(id),
  }));
}

type EditorWorkspaceRoomProps = {
  roomId: string;
  children: ReactNode;
};

/**
 * Wraps the workspace tree in `LiveblocksProvider` + `RoomProvider` so the canvas
 * AND the AI sidebar share the same room context (presence, storage, events).
 */
export function EditorWorkspaceRoom({
  roomId,
  children,
}: EditorWorkspaceRoomProps) {
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
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
}
