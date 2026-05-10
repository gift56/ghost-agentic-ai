"use client";

import {
  useOther,
  useOthersConnectionIds,
  useUser,
} from "@liveblocks/react/suspense";
import { Cursor } from "@liveblocks/react-ui";
import { useStoreApi } from "@xyflow/react";
import { useLayoutEffect, useRef } from "react";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
  }
  if (parts[0] && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return parts[0]?.toUpperCase() ?? "?";
}

function $coordinates(value: unknown): { x: number; y: number } | null {
  if (
    value &&
    typeof value === "object" &&
    "x" in value &&
    "y" in value &&
    typeof (value as { x: unknown }).x === "number" &&
    typeof (value as { y: unknown }).y === "number"
  ) {
    return { x: (value as { x: number }).x, y: (value as { y: number }).y };
  }
  return null;
}

type CollaboratorCursorProps = { connectionId: number };

function cursorSliceEqual(
  a: { userId: string; cursor: { x: number; y: number } | null },
  b: { userId: string; cursor: { x: number; y: number } | null },
) {
  return (
    a.userId === b.userId &&
    a.cursor?.x === b.cursor?.x &&
    a.cursor?.y === b.cursor?.y
  );
}

/**
 * Renders another participant's cursor using Liveblocks presence (`cursor` in flow space)
 * and {@link Cursor} styling tied to that user's presence color.
 */
function CollaboratorCursor({ connectionId }: CollaboratorCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const reactFlowStoreApi = useStoreApi();

  const presenceSlice = useOther(
    connectionId,
    (other) => ({
      userId: typeof other.id === "string" ? other.id : "",
      cursor: $coordinates(other.presence.cursor),
    }),
    cursorSliceEqual,
  );

  const { user } = useUser(presenceSlice.userId);

  useLayoutEffect(() => {
    const element = cursorRef.current;
    if (!element) return;

    const apply = () => {
      const cursor = presenceSlice.cursor;
      const [panX, panY, zoom] = reactFlowStoreApi.getState().transform;
      if (!cursor) {
        element.style.display = "none";
        return;
      }
      element.style.display = "";
      element.style.transform = `translate3d(${cursor.x * zoom + panX}px, ${cursor.y * zoom + panY}px, 0)`;
    };

    apply();
    return reactFlowStoreApi.subscribe((state, prev) => {
      if (state.transform !== prev.transform) apply();
    });
  }, [presenceSlice.cursor, reactFlowStoreApi]);

  if (!presenceSlice.userId || !presenceSlice.cursor) {
    return null;
  }

  const color =
    typeof user?.color === "string" && user.color.length > 0
      ? user.color
      : "#a1a1aa";
  const name =
    typeof user?.name === "string" && user.name.trim().length > 0
      ? user.name.trim()
      : initialsFromName(presenceSlice.userId);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none"
      style={{ display: "none" }}
    >
      <Cursor color={color} label={name} />
    </div>
  );
}

/**
 * Live cursors for other participants only (current user is excluded by Liveblocks
 * `useOthersConnectionIds`).
 */
export function EditorCanvasLiveCursors() {
  const connectionIds = useOthersConnectionIds();

  return (
    <div
      aria-hidden
      className="pointer-events-none lb-root lb-react-flow-cursors [--lb-cursor-pointer-size:15px] [--lb-spacing:6px]"
    >
      {connectionIds.map((connectionId) => (
        <CollaboratorCursor key={connectionId} connectionId={connectionId} />
      ))}
    </div>
  );
}
