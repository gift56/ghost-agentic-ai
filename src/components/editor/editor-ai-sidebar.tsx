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
import { useLiveblocksFlow } from "@liveblocks/react-flow";
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
import ReactMarkdown, { type Components } from "react-markdown";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { designAgent } from "@/trigger/design-agent";
import type { generateSpec } from "@/trigger/generate-spec";
import {
  canvasEdge,
  canvasNode,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas";
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

type ProjectSpecSummary = {
  id: string;
  createdAt: string;
  filename: string;
};

function formatSpecTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function fetchSpecMarkdown(
  projectId: string,
  specId: string,
): Promise<string> {
  const path = `/api/projects/${encodeURIComponent(projectId)}/specs/${encodeURIComponent(specId)}/download`;
  const res = await fetch(path, { credentials: "same-origin" });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      detail.trim().length > 0
        ? detail
        : `Could not load spec (${res.status}).`,
    );
  }
  return res.text();
}

const SPEC_MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => (
    <h1 className="mt-4 text-base font-semibold text-primary-text first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-3 text-sm font-semibold text-primary-text first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 text-sm font-medium text-primary-text first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-2 leading-relaxed text-primary-text last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-4 text-primary-text last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-4 text-primary-text last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-accent-text underline underline-offset-2 hover:text-primary-text"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const inline = !className;
    return inline ? (
      <code
        className="rounded bg-subtle px-1 py-0.5 font-mono text-[0.85em] text-accent-text"
        {...props}
      >
        {children}
      </code>
    ) : (
      <code
        className={cn("font-mono text-[0.85em] text-primary-text", className)}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-2 overflow-x-auto rounded-lg border border-surface-border bg-subtle p-3 text-xs text-primary-text last:mb-0">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-surface-border pl-3 text-muted-text last:mb-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-surface-border" />,
  strong: ({ children }) => (
    <strong className="font-semibold text-primary-text">{children}</strong>
  ),
};

async function downloadSpecFile(
  projectId: string,
  spec: Pick<ProjectSpecSummary, "id" | "filename">,
) {
  const path = `/api/projects/${encodeURIComponent(projectId)}/specs/${encodeURIComponent(spec.id)}/download`;
  const res = await fetch(path, { credentials: "same-origin" });
  if (!res.ok) {
    throw new Error(`Download failed (${res.status}).`);
  }
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = spec.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

function canvasNodesToSpecPayload(nodes: CanvasNode[]) {
  return nodes.map((n) => {
    const width =
      typeof n.width === "number" && Number.isFinite(n.width)
        ? n.width
        : undefined;
    const height =
      typeof n.height === "number" && Number.isFinite(n.height)
        ? n.height
        : undefined;
    return {
      id: n.id,
      type: canvasNode,
      position: { x: n.position.x, y: n.position.y },
      data: {
        label: typeof n.data.label === "string" ? n.data.label : "",
        color: typeof n.data.color === "string" ? n.data.color : "",
        shape: n.data.shape,
        ...(n.data.foreground !== undefined
          ? { foreground: n.data.foreground }
          : {}),
      },
      ...(width !== undefined ? { width } : {}),
      ...(height !== undefined ? { height } : {}),
    };
  });
}

function canvasEdgesToSpecPayload(edges: CanvasEdge[]) {
  return edges.map((e) => ({
    id: e.id,
    ...(e.type === canvasEdge ? { type: canvasEdge } : {}),
    source: e.source,
    target: e.target,
    ...(e.data?.label !== undefined && String(e.data.label).length > 0
      ? { data: { label: String(e.data.label) } }
      : {}),
  }));
}

function completionMessageForSpecRun(run: {
  status: string;
  output?: unknown;
  error?: unknown;
}): string {
  if (run.status === "COMPLETED") {
    return "Architecture spec saved.";
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
    : "Spec generation did not complete successfully.";
}

export function EditorAiSidebar({
  roomId,
  projectId,
  onClose,
}: EditorAiSidebarProps) {
  const [draft, setDraft] = useState("");
  const [sidebarTab, setSidebarTab] = useState<"architect" | "specs">(
    "architect",
  );
  const [projectSpecs, setProjectSpecs] = useState<ProjectSpecSummary[]>([]);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [specsError, setSpecsError] = useState<string | null>(null);
  const [selectedSpecId, setSelectedSpecId] = useState<string | null>(null);
  const [previewMarkdown, setPreviewMarkdown] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [specDownloadError, setSpecDownloadError] = useState<string | null>(
    null,
  );
  const [specActiveRunId, setSpecActiveRunId] = useState<string | null>(null);
  const [specAccessToken, setSpecAccessToken] = useState<string | null>(null);
  const [specGenSubmitting, setSpecGenSubmitting] = useState(false);
  const [specGenError, setSpecGenError] = useState<string | null>(null);
  const previewRequestIdRef = useRef(0);
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

  const {
    nodes: liveNodes,
    edges: liveEdges,
    isLoading: canvasFlowLoading,
  } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: false,
    nodes: { initial: [] },
    edges: { initial: [] },
  });

  const chatRows = useMemo(
    () => sortedValidAiChatMessages(chatFeedMessages),
    [chatFeedMessages],
  );

  const chatHistoryForSpec = useMemo(
    () =>
      chatRows.map((row) => ({
        role: row.payload.role,
        content: row.payload.content,
      })),
    [chatRows],
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

  const loadProjectSpecs = useCallback(async () => {
    setSpecsError(null);
    setSpecsLoading(true);
    try {
      const res = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/specs`,
        { credentials: "same-origin" },
      );
      const json = (await res.json().catch(() => null)) as {
        specs?: ProjectSpecSummary[];
        error?: string;
      } | null;
      if (!res.ok) {
        const msg =
          typeof json?.error === "string" && json.error.trim().length > 0
            ? json.error
            : `Could not load specs (${res.status}).`;
        throw new Error(msg);
      }
      setProjectSpecs(Array.isArray(json?.specs) ? json.specs : []);
    } catch (e) {
      setProjectSpecs([]);
      setSpecsError(e instanceof Error ? e.message : "Could not load specs.");
    } finally {
      setSpecsLoading(false);
    }
  }, [projectId]);

  const selectedSpec = useMemo(
    () => projectSpecs.find((s) => s.id === selectedSpecId) ?? null,
    [projectSpecs, selectedSpecId],
  );

  const openSpecPreview = useCallback(
    (specId: string) => {
      const requestId = ++previewRequestIdRef.current;
      setSelectedSpecId(specId);
      setPreviewMarkdown(null);
      setPreviewError(null);
      setPreviewLoading(true);
      void (async () => {
        try {
          const md = await fetchSpecMarkdown(projectId, specId);
          if (previewRequestIdRef.current !== requestId) return;
          setPreviewMarkdown(md);
        } catch (e) {
          if (previewRequestIdRef.current !== requestId) return;
          setPreviewError(
            e instanceof Error ? e.message : "Could not load preview.",
          );
        } finally {
          if (previewRequestIdRef.current === requestId) {
            setPreviewLoading(false);
          }
        }
      })();
    },
    [projectId],
  );

  const onSpecDownload = useCallback(
    async (spec: Pick<ProjectSpecSummary, "id" | "filename">) => {
      setSpecDownloadError(null);
      try {
        await downloadSpecFile(projectId, spec);
      } catch (e) {
        setSpecDownloadError(
          e instanceof Error ? e.message : "Download failed.",
        );
      }
    },
    [projectId],
  );

  const closeSpecPreview = useCallback(() => {
    previewRequestIdRef.current += 1;
    setSelectedSpecId(null);
    setPreviewMarkdown(null);
    setPreviewError(null);
    setPreviewLoading(false);
  }, []);

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

  const onSpecRunComplete = useCallback(
    (
      completedRun: {
        status: string;
        output?: unknown;
        error?: unknown;
      },
      completeErr?: Error,
    ) => {
      updateMyPresence({ thinking: false });
      setSpecActiveRunId(null);
      setSpecAccessToken(null);

      const postAssistant = async (content: string) => {
        const parsed = aiChatFeedPayloadSchema.safeParse({
          sender: "Ghost AI",
          role: "assistant" as const,
          content,
          timestamp: Date.now(),
        });
        if (!parsed.success) return;
        try {
          await createFeedMessage(AI_CHAT_FEED_ID, parsed.data);
        } catch {
          /* best-effort */
        }
      };

      const postSystem = async (content: string) => {
        const parsed = aiChatFeedPayloadSchema.safeParse({
          sender: "Ghost AI",
          role: "system" as const,
          content,
          timestamp: Date.now(),
        });
        if (!parsed.success) return;
        try {
          await createFeedMessage(AI_CHAT_FEED_ID, parsed.data);
        } catch {
          /* best-effort */
        }
      };

      if (
        completedRun.status === "COMPLETED" &&
        (!completeErr || completeErr.message.trim().length === 0)
      ) {
        setSpecGenError(null);
        void loadProjectSpecs();
        void postAssistant("Architecture spec saved.");
        return;
      }

      const msg =
        completeErr?.message?.trim() ||
        completionMessageForSpecRun({
          status: completedRun.status,
          output: completedRun.output,
          error: completedRun.error,
        });
      setSpecGenError(msg);
      void postSystem(`Spec generation failed: ${msg}`);
    },
    [createFeedMessage, loadProjectSpecs, updateMyPresence],
  );

  const { run: specRealtimeRun } = useRealtimeRun<typeof generateSpec>(
    specActiveRunId ?? undefined,
    {
      accessToken: specAccessToken ?? undefined,
      enabled: Boolean(specActiveRunId && specAccessToken),
      onComplete: onSpecRunComplete,
    },
  );

  const specRunBusy = useMemo(
    () =>
      Boolean(
        specActiveRunId &&
        specAccessToken &&
        (!specRealtimeRun || !isTerminalRunStatus(specRealtimeRun.status)),
      ),
    [specAccessToken, specActiveRunId, specRealtimeRun],
  );

  const specRunStatusLabel = useMemo(() => {
    if (!specRunBusy && !specGenSubmitting) return null;
    const meta = specRealtimeRun?.metadata as
      | { phase?: string; status?: string }
      | undefined;
    const phase =
      typeof meta?.phase === "string" ? meta.phase.toLowerCase() : "";
    if (phase === "generating") return "Generating spec…";
    if (phase === "persisting") return "Saving spec…";
    if (phase === "complete" || phase === "starting") return "Finishing…";
    if (phase === "error") return "Spec run failed";
    return specGenSubmitting ? "Starting…" : "Working…";
  }, [specGenSubmitting, specRealtimeRun?.metadata, specRunBusy]);

  const triggerGenerateSpec = useCallback(async () => {
    setSpecGenError(null);
    if (specGenSubmitting || canvasFlowLoading || specRunBusy) return;

    const nodesPayload = canvasNodesToSpecPayload(liveNodes ?? []);
    const edgesPayload = canvasEdgesToSpecPayload(liveEdges ?? []);

    updateMyPresence({ thinking: true });
    setSpecGenSubmitting(true);
    try {
      const triggerRes = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          roomId,
          chatHistory: chatHistoryForSpec,
          nodes: nodesPayload,
          edges: edgesPayload,
        }),
      });
      const triggerJson = (await triggerRes.json().catch(() => null)) as {
        runId?: string;
        error?: string;
      } | null;
      if (!triggerRes.ok || !triggerJson?.runId) {
        const detail =
          typeof triggerJson?.error === "string" &&
          triggerJson.error.trim().length > 0
            ? triggerJson.error
            : `Failed to start spec task (${triggerRes.status}).`;
        throw new Error(detail);
      }

      const tokenRes = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ runId: triggerJson.runId }),
      });
      const tokenJson = (await tokenRes.json().catch(() => null)) as {
        token?: string;
      } | null;
      if (!tokenRes.ok || !tokenJson?.token) {
        throw new Error(`Failed to issue spec run token (${tokenRes.status}).`);
      }

      setSpecActiveRunId(triggerJson.runId);
      setSpecAccessToken(tokenJson.token);
    } catch (error) {
      updateMyPresence({ thinking: false });
      setSpecGenError(
        error instanceof Error ? error.message : "Failed to generate spec.",
      );
    } finally {
      setSpecGenSubmitting(false);
    }
  }, [
    canvasFlowLoading,
    chatHistoryForSpec,
    liveEdges,
    liveNodes,
    roomId,
    specGenSubmitting,
    specRunBusy,
    updateMyPresence,
  ]);

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
    <div className="flex h-full max-w-full min-w-0 flex-col overflow-hidden border-surface-border bg-(--bg-base)/95 shadow-2xl ring-1 ring-foreground/10">
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
        value={sidebarTab}
        onValueChange={(next) => {
          if (next !== "architect" && next !== "specs") return;
          setSidebarTab(next);
          if (next === "specs") void loadProjectSpecs();
        }}
        className="flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-hidden"
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

        <TabsContent
          value="specs"
          className="mt-0 flex min-h-0 min-w-0 max-w-full flex-1 flex-col gap-3 overflow-hidden p-4"
        >
          <Button
            type="button"
            disabled={
              canvasFlowLoading || specGenSubmitting || specRunBusy || isWorking
            }
            className={cn(
              "w-full shrink-0 min-h-10 min-w-0 py-2 text-white",
              "bg-primary hover:bg-primary/90",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
            onClick={() => void triggerGenerateSpec()}
          >
            {specGenSubmitting || specRunBusy ? (
              <Loader2
                className="mr-2 inline size-4 animate-spin"
                aria-hidden
              />
            ) : null}
            Generate Spec
          </Button>

          {specGenError ? (
            <p className="text-xs text-state-error">{specGenError}</p>
          ) : null}

          {specRunStatusLabel && !specGenError ? (
            <p className="text-xs text-muted-text">{specRunStatusLabel}</p>
          ) : null}

          {canvasFlowLoading ? (
            <p className="text-xs text-muted-text">
              Connecting to collaborative canvas…
            </p>
          ) : null}

          {specDownloadError ? (
            <p className="text-xs text-state-error">{specDownloadError}</p>
          ) : null}

          <ScrollArea className="min-h-0 min-w-0 flex-1 overflow-hidden **:data-[slot=scroll-area-viewport]:min-w-0 **:data-[slot=scroll-area-viewport]:max-w-full **:data-[slot=scroll-area-viewport]:overflow-x-hidden">
            <div className="flex min-w-0 max-w-full flex-col gap-2 pr-3 pb-1">
              {specsLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-text">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Loading specs…
                </div>
              ) : specsError ? (
                <p className="py-6 text-center text-sm text-state-error">
                  {specsError}
                </p>
              ) : projectSpecs.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-text">
                  No specs yet. Generate one to see it here.
                </p>
              ) : (
                projectSpecs.map((spec) => (
                  <div
                    key={spec.id}
                    className="flex min-w-0 max-w-full items-stretch gap-1 overflow-hidden rounded-xl border border-surface-border bg-elevated"
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 flex-col gap-0.5 px-3 py-2.5 text-left overflow-hidden transition-colors hover:bg-subtle/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      onClick={() => openSpecPreview(spec.id)}
                    >
                      <span className="truncate text-sm font-medium text-primary-text">
                        {spec.filename}
                      </span>
                      <span className="text-xs text-muted-text tabular-nums">
                        {formatSpecTimestamp(spec.createdAt)}
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center border-l border-surface-border px-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-text hover:text-primary-text"
                        aria-label={`Download ${spec.filename}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          void onSpecDownload(spec);
                        }}
                      >
                        <Download className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Dialog
        open={selectedSpecId !== null}
        onOpenChange={(open) => {
          if (!open) closeSpecPreview();
        }}
      >
        <DialogContent
          className="top-1/2 left-1/2 grid max-h-[min(90vh,640px)] min-h-0 w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-2xl border-surface-border bg-elevated p-0 sm:max-w-2xl"
          showCloseButton
        >
          <DialogHeader className="shrink-0 border-b border-surface-border px-4 py-3 pr-12">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-surface-border bg-subtle text-accent-text">
                  <FileText className="size-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="truncate font-medium text-primary-text">
                    {selectedSpec?.filename ?? "Spec preview"}
                  </DialogTitle>
                  {selectedSpec ? (
                    <p className="mt-0.5 text-xs text-muted-text tabular-nums">
                      {formatSpecTimestamp(selectedSpec.createdAt)}
                    </p>
                  ) : null}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 border-surface-border flex items-center justify-center"
                disabled={!selectedSpec}
                onClick={() => {
                  if (selectedSpec) void onSpecDownload(selectedSpec);
                }}
              >
                <Download className="size-3.5" aria-hidden />
                <span className="mt-1">Download</span>
              </Button>
            </div>
          </DialogHeader>

          <div className="min-h-0 overflow-hidden px-4 pb-4 pt-0">
            <ScrollArea className="h-full min-h-0 **:data-[slot=scroll-area-viewport]:max-h-full **:data-[slot=scroll-area-viewport]]:min-h-0">
              <div className="pr-3 py-3">
                {previewLoading ? (
                  <div className="flex items-center gap-2 py-12 text-sm text-muted-text">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Loading…
                  </div>
                ) : previewError ? (
                  <p className="py-8 text-center text-sm text-state-error">
                    {previewError}
                  </p>
                ) : previewMarkdown ? (
                  <div className="text-sm **:wrap-break-word">
                    <ReactMarkdown components={SPEC_MARKDOWN_COMPONENTS}>
                      {previewMarkdown}
                    </ReactMarkdown>
                  </div>
                ) : null}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
