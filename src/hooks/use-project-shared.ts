"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type ProjectCollaborator = {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: "OWNER" | "COLLABORATOR";
};

type UseProjectSharedOptions = {
  roomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type UseProjectSharedState = {
  collaborators: ProjectCollaborator[];
  inviteEmail: string;
  isLoading: boolean;
  isInviting: boolean;
  error: string | null;
  copied: boolean;
  projectLink: string;
  setInviteEmail: (value: string) => void;
  onDialogOpenChange: (open: boolean) => void;
  inviteCollaborator: () => Promise<void>;
  removeCollaborator: (email: string) => Promise<void>;
  copyProjectLink: () => Promise<void>;
};

export function useProjectShared({
  roomId,
  open,
  onOpenChange,
}: UseProjectSharedOptions): UseProjectSharedState {
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const projectLink = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/editor/${roomId}`;
  }, [roomId]);

  const loadCollaborators = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${roomId}/collaborators`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to load collaborators.");
      }

      const data = (await response.json()) as {
        collaborators: ProjectCollaborator[];
      };
      setCollaborators(data.collaborators);
    } catch {
      setError("Failed to load collaborators.");
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  function onDialogOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setInviteEmail("");
      setError(null);
    }
  }

  useEffect(() => {
    if (!open) return undefined;

    const timer = window.setTimeout(() => {
      void loadCollaborators();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, loadCollaborators]);

  async function inviteCollaborator() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      return;
    }

    setIsInviting(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${roomId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to invite collaborator.");
      }

      const data = (await response.json()) as {
        collaborators: ProjectCollaborator[];
      };
      setInviteEmail("");
      setCollaborators(data.collaborators);
    } catch {
      setError("Failed to invite collaborator.");
    } finally {
      setIsInviting(false);
    }
  }

  async function removeCollaborator(email: string) {
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${roomId}/collaborators?email=${encodeURIComponent(email)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error("Failed to remove collaborator.");
      }

      const data = (await response.json()) as {
        collaborators: ProjectCollaborator[];
      };
      setCollaborators(data.collaborators);
    } catch {
      setError("Failed to remove collaborator.");
    }
  }

  async function copyProjectLink() {
    try {
      if (!projectLink) {
        return;
      }

      await navigator.clipboard.writeText(projectLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setError("Failed to copy project link.");
    }
  }

  return {
    collaborators,
    inviteEmail,
    isLoading,
    isInviting,
    error,
    copied,
    projectLink,
    setInviteEmail,
    onDialogOpenChange,
    inviteCollaborator,
    removeCollaborator,
    copyProjectLink,
  };
}
