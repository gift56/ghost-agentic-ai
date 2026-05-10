"use client";

import { useCallback, useState } from "react";
import { Bot, Download, FileText, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

type ChatBubble = {
  id: string;
  text: string;
};

type EditorAiSidebarProps = {
  onClose: () => void;
};

export function EditorAiSidebar({ onClose }: EditorAiSidebarProps) {
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [draft, setDraft] = useState("");

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `m-${Date.now()}`;
    setMessages((prev) => [...prev, { id, text: trimmed }]);
    setDraft("");
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(draft);
    }
  };

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
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close AI sidebar"
        >
          <X />
        </Button>
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
                "h-auto min-h-8 min-w-0 flex-1 rounded-md px-2 py-1 text-center text-sm font-medium text-muted-text !after:hidden",
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
                "h-auto min-h-8 min-w-0 flex-1 rounded-md px-2 py-1 text-center text-sm font-medium text-muted-text !after:hidden",
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
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-3 p-4">
              {messages.length === 0 ? (
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
                      Ghost AI responses will appear here once connected.
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-2">
                    {STARTER_PROMPTS.map((label) => (
                      <button
                        key={label}
                        type="button"
                        className="rounded-full border border-transparent bg-subtle px-3 py-2 text-left text-sm text-accent-text transition-colors hover:bg-elevated"
                        onClick={() => sendMessage(label)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className="flex w-full justify-end"
                    >
                      <div className="max-w-[85%] rounded-xl border-2 border-brand/50 bg-brand-dim px-3 py-2 text-sm text-copy-primary">
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {messages.length > 0 ? (
                    <div className="flex w-full justify-start">
                      <div className="max-w-[85%] rounded-xl border border-surface-border bg-elevated px-3 py-2 text-sm text-accent-text">
                        Ghost AI replies will appear here once generation is
                        connected.
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </ScrollArea>

          <div className="shrink-0 border-t border-surface-border p-3">
            <div className="flex gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Describe your architecture…"
                rows={2}
                className="min-h-18 max-h-40 resize-none overflow-y-auto"
              />
              <Button
                type="button"
                size="icon"
                aria-label="Send message"
                className="mt-0.5 shrink-0 self-start bg-accent text-white hover:bg-accent/90"
                onClick={() => sendMessage(draft)}
              >
                <Send />
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
