"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Handle,
  NodeResizer,
  Position,
  useReactFlow,
  useUpdateNodeInternals,
  type NodeProps,
} from "@xyflow/react";

import {
  CanvasNodeColorToolbar,
  findActiveNodeColorIndex,
} from "@/components/editor/canvas-node-color-toolbar";
import { CanvasNodeShapeView } from "@/components/editor/canvas-node-shape-view";
import { useCanvasFlowOnNodesChange } from "@/components/editor/workspace-canvas-flow-context";
import {
  CANVAS_NODE_LABEL_PLACEHOLDER,
  CANVAS_NODE_MIN_HEIGHT,
  CANVAS_NODE_MIN_WIDTH,
} from "@/lib/canvas-node-bounds";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CANVAS_NODE_COLOR,
  resolveCanvasNodeForeground,
  type CanvasNode,
  type CanvasNodeColorPair,
} from "@/types/canvas";

const labelShellClass =
  "flex w-[85%] max-h-[72%] min-h-[28%] cursor-text items-center justify-center px-2";

export function WorkspaceCanvasNode({
  id,
  data,
  width,
  height,
  selected,
}: NodeProps<CanvasNode>) {
  const onNodesChange = useCanvasFlowOnNodesChange();
  const { getNode } = useReactFlow<CanvasNode>();
  const updateNodeInternals = useUpdateNodeInternals();
  const w = width ?? 160;
  const h = height ?? 88;
  const fill = data.color || DEFAULT_CANVAS_NODE_COLOR;
  const labelColor = resolveCanvasNodeForeground(data.color, data.foreground);
  const activeColorIndex = findActiveNodeColorIndex(
    data.color,
    data.foreground,
  );

  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals, w, h, data.shape, selected]);

  useEffect(() => {
    if (!isEditing) return;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [isEditing]);

  const commitLabel = useCallback(
    (label: string) => {
      const node = getNode(id);
      if (!node) return;
      onNodesChange([
        {
          type: "replace",
          id,
          item: {
            ...node,
            data: { ...node.data, label },
          },
        },
      ]);
    },
    [getNode, id, onNodesChange],
  );

  const endEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const onLabelDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      setIsEditing(true);
    },
    [],
  );

  const onTextareaChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      commitLabel(event.target.value);
    },
    [commitLabel],
  );

  const onTextareaBlur = useCallback(() => {
    endEditing();
  }, [endEditing]);

  const onTextareaKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        event.currentTarget.blur();
      }
    },
    [],
  );

  const onTextareaPointerDown = useCallback(
    (event: React.PointerEvent<HTMLTextAreaElement>) => {
      event.stopPropagation();
    },
    [],
  );

  const onPickColor = useCallback(
    (pair: CanvasNodeColorPair) => {
      const node = getNode(id);
      if (!node) return;
      onNodesChange([
        {
          type: "replace",
          id,
          item: {
            ...node,
            data: {
              ...node.data,
              color: pair.fill,
              foreground: pair.text,
            },
          },
        },
      ]);
    },
    [getNode, id, onNodesChange],
  );

  const handleDotClass =
    "!h-2 !w-2 !min-h-0 !min-w-0 !rounded-full !border !border-zinc-800 !bg-white opacity-0 transition-opacity duration-150 group-hover/canvas-node:opacity-100";

  return (
    <div
      className={cn(
        "group/canvas-node relative text-sm",
        selected && "[&_.canvas-node-handle]:opacity-100!",
      )}
      style={{ width: w, height: h }}
    >
      {selected ? (
        <div
          className="nodrag nopan pointer-events-none absolute left-1/2 z-40 flex -translate-x-1/2 justify-center"
          style={{ bottom: "100%", marginBottom: 8 }}
        >
          <CanvasNodeColorToolbar
            activeIndex={activeColorIndex}
            onPick={(pair) => onPickColor(pair)}
          />
        </div>
      ) : null}
      <NodeResizer
        isVisible={selected}
        minWidth={CANVAS_NODE_MIN_WIDTH}
        minHeight={CANVAS_NODE_MIN_HEIGHT}
        color="rgb(113 113 122)"
        handleClassName={cn(
          "!h-2 !w-2 !min-h-0 !min-w-0 !rounded-sm !border !border-zinc-500/70 !bg-zinc-900/95 !shadow-none",
        )}
        lineClassName="!border-zinc-600/35"
      />
      <CanvasNodeShapeView
        shape={data.shape}
        width={w}
        height={h}
        fill={fill}
        selected={selected}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-t"
        className={cn("canvas-node-handle z-30!", handleDotClass)}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-s"
        className={cn("canvas-node-handle z-30!", handleDotClass)}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-t"
        className={cn("canvas-node-handle z-30!", handleDotClass)}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-s"
        className={cn("canvas-node-handle z-30!", handleDotClass)}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-t"
        className={cn("canvas-node-handle z-30!", handleDotClass)}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-s"
        className={cn("canvas-node-handle z-30!", handleDotClass)}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-t"
        className={cn("canvas-node-handle z-30!", handleDotClass)}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-s"
        className={cn("canvas-node-handle z-30!", handleDotClass)}
      />
      <div className="pointer-events-none absolute inset-0 z-6 flex items-center justify-center">
        <div
          className={cn(labelShellClass, "pointer-events-auto")}
          onDoubleClick={onLabelDoubleClick}
        >
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={data.label}
              placeholder={CANVAS_NODE_LABEL_PLACEHOLDER}
              onChange={onTextareaChange}
              onBlur={onTextareaBlur}
              onKeyDown={onTextareaKeyDown}
              onPointerDown={onTextareaPointerDown}
              onPointerDownCapture={onTextareaPointerDown}
              rows={2}
              aria-label="Node label"
              className={cn(
                "nodrag nopan field-sizing-content max-h-full min-h-0 w-full resize-none border-0 bg-transparent p-0 text-center text-sm shadow-none outline-none focus-visible:ring-0 flex items-center justify-center placeholder:text-current placeholder:opacity-50",
              )}
              style={{ color: labelColor }}
            />
          ) : (
            <span
              className="text-center"
              style={{
                color: labelColor,
                opacity: data.label ? 1 : 0.55,
              }}
            >
              {data.label || CANVAS_NODE_LABEL_PLACEHOLDER}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
