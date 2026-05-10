"use client";

import {
  ClerkLoaded,
  ClerkLoading,
  UserButton,
  useUser as useClerkUser,
} from "@clerk/nextjs";
import { shallow, useOthers } from "@liveblocks/react/suspense";
import { useCallback, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";

const AVATAR_PX = 32;

type Collaborator = {
  id: string;
  name: string;
  picture: string;
};

function useCollaborators(): Collaborator[] {
  const { user } = useClerkUser();
  const clerkId = user?.id;

  return useOthers(
    useCallback(
      (others) => {
        if (!clerkId) return [];
        const byId = new Map<string, Collaborator>();
        for (const o of others) {
          if (o.id === clerkId) continue;
          if (byId.has(o.id)) continue;
          const info = o.info as
            | { name?: string; avatar?: string }
            | undefined;
          byId.set(o.id, {
            id: o.id,
            name:
              typeof info?.name === "string" && info.name.trim().length > 0
                ? info.name.trim()
                : "Anonymous",
            picture:
              typeof info?.avatar === "string" && info.avatar.trim().length > 0
                ? info.avatar.trim()
                : "",
          });
        }
        return Array.from(byId.values());
      },
      [clerkId],
    ),
    shallow,
  );
}

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

function CollaboratorAvatar({
  collaborator,
  stackIndex,
  stackSize,
}: {
  collaborator: Collaborator;
  stackIndex: number;
  stackSize: number;
}) {
  const [broken, setBroken] = useState(false);

  return (
    <div
      className="relative shrink-0 rounded-full ring-2 ring-zinc-950"
      style={{ zIndex: stackSize - stackIndex }}
      aria-hidden
    >
      {collaborator.picture && !broken ? (
        <img
          src={collaborator.picture}
          alt=""
          width={AVATAR_PX}
          height={AVATAR_PX}
          draggable={false}
          className="pointer-events-none h-8 w-8 rounded-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <div
          className="pointer-events-none flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-medium text-zinc-100"
          title={collaborator.name}
        >
          {initialsFromName(collaborator.name)}
        </div>
      )}
    </div>
  );
}

const MAX_VISIBLE = 5;

/**
 * Top canvas strip: overlapping collaborator avatars (others only), optional divider,
 * and Clerk UserButton for the signed-in user — navbar-sized controls stay on the canvas.
 */
export function EditorCanvasPresenceAvatars() {
  const collaborators = useCollaborators();
  const visible = collaborators.slice(0, MAX_VISIBLE);
  const overflow = Math.max(0, collaborators.length - MAX_VISIBLE);
  const showDivider = collaborators.length > 0;

  return (
    <div className="flex items-center gap-3">
      {collaborators.length > 0 ? (
        <div
          className="pointer-events-none flex items-center pl-1"
          aria-label="Active collaborators"
        >
          <div className="flex items-center -space-x-2">
            {visible.map((c, i) => (
              <CollaboratorAvatar
                key={c.id}
                collaborator={c}
                stackIndex={i}
                stackSize={visible.length + (overflow > 0 ? 1 : 0)}
              />
            ))}
            {overflow > 0 ? (
              <div
                className="relative z-30 flex h-8 min-w-8 items-center justify-center rounded-full bg-zinc-800 px-1.5 text-[10px] font-medium text-zinc-200 ring-2 ring-zinc-950"
                title={`${overflow} more collaborator${overflow === 1 ? "" : "s"}`}
              >
                +{overflow}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {showDivider ? (
        <div className="h-6 w-px shrink-0 bg-zinc-700" aria-hidden />
      ) : null}
      <div className="flex shrink-0 items-center">
        <ClerkLoading>
          <Skeleton className="h-8 w-8 rounded-full" />
        </ClerkLoading>
        <ClerkLoaded>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "h-8 w-8",
                userButtonTrigger:
                  "rounded-full focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:outline-none",
              },
            }}
          />
        </ClerkLoaded>
      </div>
    </div>
  );
}
