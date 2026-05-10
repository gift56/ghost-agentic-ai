"use client";

import { useMemo } from "react";

import { CanvasNodeShapeView } from "@/components/editor/canvas-node-shape-view";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { CanvasNode } from "@/types/canvas";

const PREVIEW_W = 280;
const PREVIEW_H = 152;
const PREVIEW_PAD = 14;

type DiagramBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

function getNodeBounds(node: CanvasNode): DiagramBounds {
  const w = node.width ?? 160;
  const h = node.height ?? 88;
  const x = node.position.x;
  const y = node.position.y;
  return { minX: x, minY: y, maxX: x + w, maxY: y + h };
}

function unionBounds(a: DiagramBounds, b: DiagramBounds): DiagramBounds {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

function diagramBounds(nodes: readonly CanvasNode[]): DiagramBounds {
  if (!nodes.length) {
    return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  }
  return nodes.reduce(
    (acc, n) => unionBounds(acc, getNodeBounds(n)),
    getNodeBounds(nodes[0]),
  );
}

function nodeCenter(node: CanvasNode): { x: number; y: number } {
  const w = node.width ?? 160;
  const h = node.height ?? 88;
  return {
    x: node.position.x + w / 2,
    y: node.position.y + h / 2,
  };
}

function TemplateDiagramPreview({ template }: { template: CanvasTemplate }) {
  const { scale, offsetX, offsetY } = useMemo(() => {
    const b = diagramBounds(template.nodes);
    const bw = Math.max(1, b.maxX - b.minX);
    const bh = Math.max(1, b.maxY - b.minY);
    const innerW = PREVIEW_W - PREVIEW_PAD * 2;
    const innerH = PREVIEW_H - PREVIEW_PAD * 2;
    const s = Math.min(innerW / bw, innerH / bh, 1.2);
    const contentW = bw * s;
    const contentH = bh * s;
    const ox = PREVIEW_PAD + (innerW - contentW) / 2 - b.minX * s;
    const oy = PREVIEW_PAD + (innerH - contentH) / 2 - b.minY * s;
    return { scale: s, offsetX: ox, offsetY: oy };
  }, [template]);

  const nodeById = useMemo(() => {
    const m = new Map<string, CanvasNode>();
    for (const n of template.nodes) m.set(n.id, n);
    return m;
  }, [template.nodes]);

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-border bg-zinc-950/80"
      style={{ width: PREVIEW_W, height: PREVIEW_H }}
      aria-hidden
    >
      <svg
        width={PREVIEW_W}
        height={PREVIEW_H}
        className="absolute inset-0 text-zinc-500"
      >
        {template.edges.map((edge) => {
          const sNode = nodeById.get(edge.source);
          const tNode = nodeById.get(edge.target);
          if (!sNode || !tNode) return null;
          const s = nodeCenter(sNode);
          const t = nodeCenter(tNode);
          const x1 = offsetX + s.x * scale;
          const y1 = offsetY + s.y * scale;
          const x2 = offsetX + t.x * scale;
          const y2 = offsetY + t.y * scale;
          return (
            <line
              key={edge.id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={1.25}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {template.nodes.map((node) => (
          <div
            key={node.id}
            className="absolute overflow-hidden"
            style={{
              left: node.position.x,
              top: node.position.y,
              width: node.width ?? 160,
              height: node.height ?? 88,
            }}
          >
            <CanvasNodeShapeView
              shape={node.data.shape}
              width={node.width ?? 160}
              height={node.height ?? 88}
              fill={node.data.color}
              ghost
            />
          </div>
        ))}
      </div>
      {template.nodes.length === 0 ? (
        <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Empty
        </span>
      ) : null}
    </div>
  );
}

export type StarterTemplatesModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: readonly CanvasTemplate[];
  onImport: (template: CanvasTemplate) => void;
};

export function StarterTemplatesModal({
  open,
  onOpenChange,
  templates,
  onImport,
}: StarterTemplatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(90dvh,720px)] w-full max-w-3xl! flex-col gap-0 p-0 sm:max-w-3xl!"
        showCloseButton
      >
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>Starter templates</DialogTitle>
          <DialogDescription>
            Replace the current canvas with a predefined diagram. Your previous
            nodes and edges are cleared when you import.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[min(60dvh,480px)] px-4 py-4">
          <div className="grid gap-4 pb-2 sm:grid-cols-2">
            {templates.map((template) => (
              <article
                key={template.id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-4",
                )}
              >
                <TemplateDiagramPreview template={template} />
                <div className="min-w-0 space-y-1">
                  <h3 className="truncate font-medium text-foreground">
                    {template.name}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {template.description}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="mt-auto w-full shrink-0 min-h-10 py-2! px-4!"
                  onClick={() => {
                    onImport(template);
                    onOpenChange(false);
                  }}
                >
                  Import template
                </Button>
              </article>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
