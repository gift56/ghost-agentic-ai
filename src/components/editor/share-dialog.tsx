"use client";

import { Link2, Loader2, Mail, Trash2, UserPlus2, X } from "lucide-react";
import Image from "next/image";

import { useProjectShared } from "@/hooks/use-project-shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type ShareDialogProps = {
  roomId: string;
  isOwner: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getInitials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

export function ShareDialog({
  roomId,
  isOwner,
  open,
  onOpenChange,
}: ShareDialogProps) {
  const {
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
  } = useProjectShared({
    roomId,
    open,
    onOpenChange,
  });

  return (
    <Dialog open={open} onOpenChange={onDialogOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-2xl! border-none bg-transparent p-0 ring-0"
      >
        <section className="w-full rounded-3xl border border-cyan-500/20 bg-[#070b17]/95 text-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur">
          <header className="flex items-start justify-between border-b border-white/10 px-6 py-5">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Share project
              </h3>
              <p className="mt-1 text-sm text-zinc-400">
                {isOwner
                  ? "Invite collaborators, copy the workspace link, and manage access."
                  : "View who has access and copy the workspace link."}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
              aria-label="Close share dialog"
              className="text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              <X />
            </Button>
          </header>

          <div className="space-y-4 px-6 py-5">
            <section className="rounded-2xl border border-white/10 bg-white/2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Workspace link
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Share a direct link with teammates after granting access.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void copyProjectLink()}
                  data-icon="inline-start"
                  className="border-white/10 bg-black/30 text-white hover:bg-cyan-500/15 hover:text-cyan-200"
                >
                  <Link2 />
                  {copied ? "Copied!" : "Copy link"}
                </Button>
              </div>
              <Input
                value={projectLink}
                readOnly
                className="mt-3 border-white/10 bg-black/25 text-zinc-300"
              />
            </section>

            {isOwner ? (
              <form
                className="rounded-2xl border border-white/10 bg-white/2 p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void inviteCollaborator();
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      id="invite-collaborator-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      placeholder="teammate@company.com"
                      className="border-white/10 bg-black/25 pl-9 text-zinc-200"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!inviteEmail.trim() || isInviting}
                    data-icon="inline-start"
                    className="bg-cyan-500 text-black hover:bg-cyan-400"
                  >
                    {isInviting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <UserPlus2 />
                    )}
                    Invite
                  </Button>
                </div>
              </form>
            ) : null}

            <section>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">
                  People with access
                </p>
                <p className="text-xs text-zinc-500">
                  {isLoading ? "Loading..." : `${collaborators.length} total`}
                </p>
              </div>

              {isLoading ? (
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/2 px-4 py-3 text-sm text-zinc-400">
                  <Loader2 className="animate-spin" />
                  Loading collaborators...
                </div>
              ) : collaborators.length ? (
                <ul className="space-y-2">
                  {collaborators.map((collaborator, index) => (
                    <li
                      key={`${collaborator.email}-${index}`}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/2 px-3 py-2.5"
                    >
                      {collaborator.avatarUrl ? (
                        <Image
                          src={collaborator.avatarUrl}
                          alt={collaborator.displayName ?? collaborator.email}
                          className="size-9 rounded-full object-cover"
                          width={36}
                          height={36}
                        />
                      ) : (
                        <div className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/30 text-xs font-semibold text-zinc-400">
                          {getInitials(
                            collaborator.displayName ?? collaborator.email,
                          )}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-zinc-100">
                            {collaborator.displayName ?? collaborator.email}
                          </p>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] ${
                              collaborator.role === "OWNER"
                                ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-200"
                                : "border-white/15 bg-white/5 text-zinc-400"
                            }`}
                          >
                            {collaborator.role}
                          </span>
                        </div>
                        <p className="truncate text-xs text-zinc-500">
                          {collaborator.email}
                        </p>
                      </div>
                      {isOwner && collaborator.role !== "OWNER" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${collaborator.email}`}
                          onClick={() =>
                            void removeCollaborator(collaborator.email)
                          }
                          className="text-zinc-500 hover:bg-red-500/20 hover:text-red-300"
                        >
                          <Trash2 />
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl border border-white/10 bg-white/2 px-4 py-3 text-sm text-zinc-500">
                  No collaborators yet.
                </p>
              )}
            </section>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
