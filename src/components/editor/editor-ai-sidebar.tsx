"use client";

import { useUser as useClerkUser } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useCreateFeed,
  useCreateFeedMessage,
  useFeedMessages,
  useSelf,
  useUpdateMyPresence,
} from "@liveblocks/react/suspense";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import {
  AlertTriangle,
  Bot,
  Download,
  FileText,
  Loader2,
  Send,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { designAgent } from "@/trigger/design-agent";
import {
  AI_CHAT_FEED_ID,
  AI_STATUS_FEED_ID,
  type AiStatusFeedPayload,
  aiChatFeedPayloadSchema,
  latestValidAiStatusPayload,
  sortedValidAiChatMessages,
} from "@/types/tasks";

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

type EditorAiSidebarProps = {
  roomId: string;
  projectId: string;
  onClose: () => void;
};

function phaseFallbackLabel(phase: AiStatusFeedPayload["phase"]): string {
  switch (phase) {
    case "start":
      return "Starting…";
    case "processing":
      return "Updating canvas…";
    case "complete":
      return "Finished";
    case "error":
      return "Something went wrong";
    default:
      return "";
  }
}

const TERMINAL_RUN_STATUSES = new Set([
  "COMPLETED",
  "FAILED",
  "CANCELED",
  "CRASHED",
  "SYSTEM_FAILURE",
  "TIMED_OUT",
]);

function isTerminalRunStatus(status: string | undefined): boolean {
  if (!status) return false;
  return TERMINAL_RUN_STATUSES.has(status);
}

function completionMessageForRun(run: {
  status: string;
  output?: unknown;
  error?: unknown;
}): string {
  if (run.status === "COMPLETED") {
    if (
      typeof run.output === "object" &&
      run.output !== null &&
      "summary" in run.output &&
      typeof (run.output as { summary?: unknown }).summary === "string" &&
      (run.output as { summary: string }).summary.trim().length > 0
    ) {
      return (run.output as { summary: string }).summary.trim();
    }
    return "Your diagram is ready.";
  }
  const err =
    typeof run.error === "object" &&
    run.error !== null &&
    "message" in run.error &&
    typeof (run.error as { message?: unknown }).message === "string"
      ? (run.error as { message: string }).message.trim()
      : "";
  return err.length > 0
    ? err
    : "The design task did not complete successfully.";
}

function formatChatTime(createdAt: number) {
  return new Date(createdAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EditorAiSidebar({
  roomId,
  projectId,
  onClose,
}: EditorAiSidebarProps) {
  const [draft, setDraft] = useState("");
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [chatSendError, setChatSendError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { user: clerkUser } = useClerkUser();
  const self = useSelf();
  const updateMyPresence = useUpdateMyPresence();
  const createFeed = useCreateFeed();
  const createFeedMessage = useCreateFeedMessage();
  const { messages: statusFeedMessages } = useFeedMessages(AI_STATUS_FEED_ID);
  const { messages: chatFeedMessages } = useFeedMessages(AI_CHAT_FEED_ID);

  const chatRows = useMemo(
    () => sortedValidAiChatMessages(chatFeedMessages),
    [chatFeedMessages],
  );

  const latestFeedStatus = useMemo(
    () => latestValidAiStatusPayload(statusFeedMessages),
    [statusFeedMessages],
  );

  const sharedStatusLabel = useMemo(() => {
    if (!latestFeedStatus) return null;
    const body =
      typeof latestFeedStatus.text === "string" &&
      latestFeedStatus.text.trim().length > 0
        ? latestFeedStatus.text.trim()
        : phaseFallbackLabel(latestFeedStatus.phase);
    return body.length > 0 ? body : null;
  }, [latestFeedStatus]);

  useEffect(() => {
    void createFeed(AI_CHAT_FEED_ID).catch(() => {
      /* best-effort; server auth also provisions feeds */
    });
  }, [createFeed, roomId]);

  useEffect(() => {
    const el = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatRows]);

  const onDesignRunComplete = useCallback(
    (
      completedRun: {
        status: string;
        output?: unknown;
        error?: unknown;
      },
      err?: Error,
    ) => {
      void (async () => {
        const content =
          err?.message?.trim() ||
          completionMessageForRun({
            status: completedRun.status,
            output: completedRun.output,
            error: completedRun.error,
          });
        const parsed = aiChatFeedPayloadSchema.safeParse({
          sender: "Ghost AI",
          role: "assistant" as const,
          content,
          timestamp: Date.now(),
        });
        if (parsed.success) {
          try {
            await createFeedMessage(AI_CHAT_FEED_ID, parsed.data);
          } catch {
            /* best-effort */
          }
        }
        updateMyPresence({ thinking: false });
        setActiveRunId(null);
        setAccessToken(null);
      })();
    },
    [createFeedMessage, updateMyPresence],
  );

  const { run } = useRealtimeRun<typeof designAgent>(activeRunId ?? undefined, {
    accessToken: accessToken ?? undefined,
    enabled: Boolean(activeRunId && accessToken),
    onComplete: onDesignRunComplete,
  });

  useEffect(() => {
    return () => {
      updateMyPresence({ thinking: false });
    };
  }, [updateMyPresence]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || submitting) return;

      const senderName =
        typeof self?.info?.name === "string" && self.info.name.trim().length > 0
          ? self.info.name.trim()
          : clerkUser?.fullName?.trim() ||
            clerkUser?.primaryEmailAddress?.emailAddress ||
            "Anonymous";

      if (!clerkUser?.id && !self?.id) {
        setChatSendError("You must be signed in to send a message.");
        return;
      }

      const chatPayload = {
        sender: senderName,
        role: "user" as const,
        content: trimmed,
        timestamp: Date.now(),
      };
      const parsedChat = aiChatFeedPayloadSchema.safeParse(chatPayload);
      if (!parsedChat.success) {
        setChatSendError("Could not validate message.");
        return;
      }

      setChatSendError(null);
      setSubmitting(true);
      updateMyPresence({ thinking: true });

      const postSystemChat = async (content: string) => {
        const parsedSystem = aiChatFeedPayloadSchema.safeParse({
          sender: "Ghost AI",
          role: "system" as const,
          content,
          timestamp: Date.now(),
        });
        if (!parsedSystem.success) return;
        try {
          await createFeedMessage(AI_CHAT_FEED_ID, parsedSystem.data);
        } catch {
          /* best-effort */
        }
      };

      let postedToChat = false;
      try {
        await createFeedMessage(AI_CHAT_FEED_ID, parsedChat.data);
        postedToChat = true;
        setDraft("");

        const triggerRes = await fetch("/api/ai/design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ prompt: trimmed, roomId, projectId }),
        });
        const triggerJson = (await triggerRes.json().catch(() => null)) as {
          runId?: string;
          publicToken?: string;
          error?: string;
        } | null;
        if (!triggerRes.ok || !triggerJson?.runId) {
          const detail =
            typeof triggerJson?.error === "string" &&
            triggerJson.error.trim().length > 0
              ? triggerJson.error
              : `Failed to start design task (${triggerRes.status}).`;
          throw new Error(detail);
        }

        let token = triggerJson.publicToken;
        if (!token) {
          const tokenRes = await fetch("/api/ai/design/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ runId: triggerJson.runId }),
          });
          if (!tokenRes.ok) {
            throw new Error(`Failed to issue run token (${tokenRes.status}).`);
          }
          const tokenJson = (await tokenRes.json()) as { token?: string };
          if (!tokenJson.token) {
            throw new Error("No token returned from token API.");
          }
          token = tokenJson.token;
        }

        setActiveRunId(triggerJson.runId);
        setAccessToken(token);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        if (!postedToChat) {
          setChatSendError(message);
        } else {
          await postSystemChat(`Could not start the design run: ${message}`);
        }
        updateMyPresence({ thinking: false });
      } finally {
        setSubmitting(false);
      }
    },
    [
      clerkUser,
      createFeedMessage,
      projectId,
      roomId,
      self,
      submitting,
      updateMyPresence,
    ],
  );

  const myChatSenderLabel = useMemo(() => {
    if (
      typeof self?.info?.name === "string" &&
      self.info.name.trim().length > 0
    ) {
      return self.info.name.trim();
    }
    return (
      clerkUser?.fullName?.trim() ||
      clerkUser?.primaryEmailAddress?.emailAddress ||
      null
    );
  }, [clerkUser, self]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(draft);
    }
  };

  const feedRoomGenerationActive = useMemo(() => {
    if (!latestFeedStatus) return false;
    return (
      latestFeedStatus.phase === "start" ||
      latestFeedStatus.phase === "processing"
    );
  }, [latestFeedStatus]);

  const runIsLocalActive = useMemo(
    () =>
      Boolean(
        activeRunId &&
        accessToken &&
        (!run || !isTerminalRunStatus(run.status)),
      ),
    [activeRunId, accessToken, run],
  );

  const statusStripBody = useMemo(() => {
    if (sharedStatusLabel) return sharedStatusLabel;
    if (runIsLocalActive || feedRoomGenerationActive) {
      if (latestFeedStatus) return phaseFallbackLabel(latestFeedStatus.phase);
      return "Starting…";
    }
    return null;
  }, [
    feedRoomGenerationActive,
    latestFeedStatus,
    runIsLocalActive,
    sharedStatusLabel,
  ]);

  const showInputStatusStrip = useMemo(
    () =>
      Boolean(
        (runIsLocalActive || feedRoomGenerationActive) && statusStripBody,
      ),
    [feedRoomGenerationActive, runIsLocalActive, statusStripBody],
  );

  const isWorking = useMemo(() => {
    if (submitting) return true;
    if (feedRoomGenerationActive) return true;
    if (!activeRunId) return false;
    if (!run) return true;
    return !isTerminalRunStatus(run.status);
  }, [activeRunId, feedRoomGenerationActive, run, submitting]);

  const stripIsError = latestFeedStatus?.phase === "error";

  return (
    <div className="flex h-full flex-col border-surface-border bg-(--bg-base)/95 shadow-2xl ring-1 ring-foreground/10">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-surface-border px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-surface-border bg-subtle text-accent-text">
            <Bot className="size-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading font-semibold text-primary-text">
              AI Workspace
            </h2>
            <p className="text-sm text-muted-text">Collaborate with Ghost AI</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {feedRoomGenerationActive ? (
            <span
              className="flex items-center gap-1.5 rounded-full border border-surface-border bg-subtle px-2 py-0.5 text-xs text-accent-text"
              title="Someone in this room is generating with Ghost AI"
            >
              <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
              <span className="max-w-32 truncate">AI active</span>
            </span>
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close AI sidebar"
          >
            <X />
          </Button>
        </div>
      </header>

      <Tabs
        defaultValue="architect"
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="shrink-0 overflow-hidden border-b border-surface-border px-4 pt-3 pb-3">
          <TabsList className="flex h-auto min-h-0 w-full max-w-full gap-2 rounded-xl bg-muted p-1">
            <TabsTrigger
              value="architect"
              className={cn(
                "h-auto min-h-6 min-w-0 flex-1 rounded-full px-2 py-0.5 text-center text-sm font-medium text-muted-text !after:hidden",
                "wrap-break-word whitespace-normal shadow-none data-active:shadow-none!",
                "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0",
                "hover:text-primary-text",
                "border border-transparent bg-transparent hover:bg-transparent dark:data-active:border-transparent",
                "data-active:border-transparent dark:data-active:border-transparent dark:data-active:bg-primary data-active:text-white",
                "data-active:bg-primary data-active:text-white data-active:shadow-none",
              )}
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className={cn(
                "h-auto min-h-6 min-w-0 flex-1 rounded-full px-2 py-0.5 text-center text-sm font-medium text-muted-text !after:hidden",
                "whitespace-normal shadow-none data-active:shadow-none!",
                "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0",
                "hover:text-primary-text",
                "border border-transparent bg-transparent hover:bg-transparent dark:data-active:border-transparent",
                "data-active:border-transparent dark:data-active:border-transparent dark:data-active:bg-primary data-active:text-white",
                "data-active:bg-primary data-active:text-white data-active:shadow-none",
              )}
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="architect"
          className="mt-0 flex min-h-0 flex-1 flex-col gap-0 overflow-hidden"
        >
          <ScrollArea ref={scrollAreaRef} className="min-h-0 flex-1">
            <div className="flex flex-col gap-3 p-4">
              {chatRows.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl border border-surface-border bg-subtle text-accent-text">
                    <Bot className="size-7" aria-hidden />
                  </div>
                  <div className="max-w-60 space-y-1">
                    <p className="text-sm font-medium text-primary-text">
                      Start a diagram conversation
                    </p>
                    <p className="text-sm text-muted-text">
                      Pick a starter or describe the system you want to design.
                      Ghost AI will update this canvas in real time.
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-2">
                    {STARTER_PROMPTS.map((label) => (
                      <button
                        key={label}
                        type="button"
                        className="rounded-full border border-transparent bg-subtle px-3 py-2 text-left text-sm text-accent-text transition-colors hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => void sendMessage(label)}
                        disabled={isWorking}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {chatRows.map((row) => {
                    const isUser = row.payload.role === "user";
                    const isSelf =
                      isUser &&
                      myChatSenderLabel !== null &&
                      row.payload.sender === myChatSenderLabel;
                    return (
                      <div
                        key={row.id}
                        className={cn(
                          "flex w-full gap-2",
                          isSelf ? "justify-end" : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[90%] rounded-xl border px-3 py-2 text-sm",
                            isUser
                              ? "border-[#62C073]/50 bg-[#62C073] text-(--bg-base)"
                              : "border-surface-border bg-elevated text-primary-text",
                          )}
                        >
                          <div
                            className={cn(
                              "mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs",
                              isUser
                                ? "text-(--bg-base)/75"
                                : "text-muted-text",
                            )}
                          >
                            <span
                              className={cn(
                                "font-medium",
                                isUser
                                  ? "text-(--bg-base)"
                                  : "text-primary-text",
                              )}
                            >
                              {row.payload.sender}
                            </span>
                            <span className="tabular-nums opacity-80">
                              {formatChatTime(row.createdAt)}
                            </span>
                            <span
                              className={cn(
                                "rounded px-1.5 py-0 text-[10px] uppercase tracking-wide",
                                isUser
                                  ? "bg-(--bg-base)/15 text-(--bg-base)/90"
                                  : "bg-subtle text-muted-text",
                              )}
                            >
                              {row.payload.role}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap wrap-break-word leading-snug">
                            {row.payload.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </ScrollArea>

          <div className="shrink-0 border-t border-surface-border p-3">
            {chatSendError ? (
              <p className="mb-2 text-xs text-state-error">{chatSendError}</p>
            ) : null}
            {showInputStatusStrip && statusStripBody ? (
              <div
                className={cn(
                  "mb-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
                  stripIsError
                    ? "border-state-error/35 bg-state-error/10 text-state-error"
                    : "border-surface-border bg-elevated text-primary-text",
                )}
                role="status"
              >
                {stripIsError ? (
                  <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                ) : (
                  <span className="relative flex size-2 shrink-0">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#62C073] opacity-35" />
                    <span className="relative inline-flex size-2 rounded-full bg-[#62C073]" />
                  </span>
                )}
                <p className="min-w-0 flex-1 leading-snug wrap-break-word">
                  {statusStripBody}
                </p>
              </div>
            ) : null}
            <div className="flex gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  isWorking
                    ? "Ghost AI is working on the canvas…"
                    : "Describe your architecture…"
                }
                rows={2}
                disabled={isWorking}
                className="min-h-18 max-h-40 resize-none overflow-y-auto disabled:opacity-60"
              />
              <Button
                type="button"
                size="icon"
                aria-label="Send message"
                disabled={isWorking || draft.trim().length === 0}
                className={cn(
                  "mt-0.5 shrink-0 self-start text-(--bg-base) disabled:cursor-not-allowed disabled:opacity-45",
                  "bg-[#62C073] hover:bg-[#62C073]/90",
                )}
                onClick={() => void sendMessage(draft)}
              >
                {isWorking ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : (
                  <Send aria-hidden />
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="specs" className="mt-0 flex flex-col gap-4 p-4">
          <Button
            type="button"
            className="w-full bg-accent text-white hover:bg-accent/90"
          >
            Generate Spec
          </Button>

          <div className="rounded-xl border border-surface-border bg-elevated p-4">
            <div className="flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-surface-border bg-subtle text-accent-text">
                <FileText className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-medium text-primary-text">
                  Sample project spec.md
                </p>
                <p className="line-clamp-3 text-sm text-muted-text">
                  # Architecture overview
                  <br />
                  Services communicate over async events with a shared schema
                  registry. Demo content only.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled
                  className="gap-1.5"
                >
                  <Download className="size-3.5" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
