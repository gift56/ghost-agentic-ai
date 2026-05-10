"use client";

import {
  memo,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";

import {
  useCanvasEdgeUi,
  useCanvasFlowOnEdgesChange,
} from "@/components/editor/workspace-canvas-flow-context";
import { cn } from "@/lib/utils";
import type { CanvasEdge, CanvasEdgeData, CanvasNode } from "@/types/canvas";

const EDGE_LABEL_HINT = "Add label";

function CanvasEdgeLabelInput({
  initialValue,
  onCommit,
  onClose,
}: {
  initialValue: string;
  onCommit: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const growCh = Math.max(value.length, 3);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  const onPointerDown = useCallback((event: PointerEvent<HTMLInputElement>) => {
    event.stopPropagation();
  }, []);

  const finish = useCallback(
    (next: string) => {
      onCommit(next);
      onClose();
    },
    [onCommit, onClose],
  );

  const onBlur = useCallback(() => {
    finish(value);
  }, [finish, value]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        finish(event.currentTarget.value);
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        finish(event.currentTarget.value);
      }
    },
    [finish],
  );

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      aria-label="Edge label"
      className="nodrag nopan max-w-[min(280px,40vw)] rounded-md border border-zinc-600/80 bg-zinc-900/95 px-2 py-0.5 text-center text-xs text-zinc-100 shadow-sm outline-none ring-1 ring-zinc-500/40 focus-visible:ring-zinc-400/70"
      style={{ width: `${growCh + 2}ch`, minWidth: "6ch" }}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        setValue(event.target.value)
      }
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerDownCapture={onPointerDown}
    />
  );
}

function WorkspaceCanvasEdgeInner({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  markerStart,
  selected,
  data,
  pathOptions,
}: EdgeProps<CanvasEdge>) {
  const onEdgesChange = useCanvasFlowOnEdgesChange();
  const { getEdge } = useReactFlow<CanvasNode, CanvasEdge>();
  const { editingEdgeId, setEditingEdgeId, hoveredEdgeId, setHoveredEdgeId } =
    useCanvasEdgeUi();

  const [labelZoneHovered, setLabelZoneHovered] = useState(false);

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: pathOptions?.borderRadius ?? 0,
    offset: pathOptions?.offset ?? 16,
    stepPosition: pathOptions?.stepPosition,
  });

  const savedLabel = (data?.label ?? "").trim();
  const isEditing = editingEdgeId === id;
  const isHoveredPath = hoveredEdgeId === id;
  const isBright = Boolean(selected || isHoveredPath || labelZoneHovered);

  const strokeRgb = isBright ? "rgb(228 228 231)" : "rgb(113 113 122)";
  const mergedStyle = {
    ...style,
    stroke: strokeRgb,
    strokeWidth: (style?.strokeWidth as number | undefined) ?? 1.25,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const commitLabel = useCallback(
    (raw: string) => {
      const edge = getEdge(id);
      if (!edge) return;
      const label = raw.trim();
      const nextData: CanvasEdgeData = { ...(edge.data ?? {}) };
      if (label) nextData.label = label;
      else delete nextData.label;

      onEdgesChange([
        {
          type: "replace",
          id,
          item: {
            ...edge,
            data: nextData,
          },
        },
      ]);
    },
    [getEdge, id, onEdgesChange],
  );

  const endEditing = useCallback(() => {
    setEditingEdgeId(null);
  }, [setEditingEdgeId]);

  const onLabelZonePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      event.stopPropagation();
    },
    [],
  );

  const onLabelZoneDoubleClick = useCallback(
    (event: { stopPropagation: () => void }) => {
      event.stopPropagation();
      setEditingEdgeId(id);
    },
    [id, setEditingEdgeId],
  );

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={mergedStyle}
        interactionWidth={36}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto absolute flex items-center justify-center"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
          onPointerEnter={() => {
            setLabelZoneHovered(true);
            setHoveredEdgeId(id);
          }}
          onPointerLeave={() => {
            setLabelZoneHovered(false);
            setHoveredEdgeId(null);
          }}
          onPointerDown={onLabelZonePointerDown}
          onPointerDownCapture={onLabelZonePointerDown}
          onDoubleClick={onLabelZoneDoubleClick}
        >
          {isEditing ? (
            <CanvasEdgeLabelInput
              key={id}
              initialValue={savedLabel}
              onCommit={commitLabel}
              onClose={endEditing}
            />
          ) : savedLabel ? (
            <span
              className={cn(
                "max-w-[min(240px,36vw)] truncate rounded-full border border-zinc-600/60 bg-zinc-800/90 px-2 py-0.5 text-center text-xs text-zinc-200",
                isBright && "border-zinc-500/80 bg-zinc-800 text-zinc-50",
              )}
            >
              {savedLabel}
            </span>
          ) : (selected || isHoveredPath || labelZoneHovered) ? (
            <span className="pointer-events-none select-none rounded-full px-2 py-0.5 text-center text-xs text-zinc-500/55">
              {EDGE_LABEL_HINT}
            </span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const WorkspaceCanvasEdge = memo(WorkspaceCanvasEdgeInner);
