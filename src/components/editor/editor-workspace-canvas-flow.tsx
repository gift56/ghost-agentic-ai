"use client";

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  BezierEdge,
  Handle,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  useUpdateNodeInternals,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react";
import { Cursors, useLiveblocksFlow } from "@liveblocks/react-flow";

import { CanvasNodeShapeView } from "@/components/editor/canvas-node-shape-view";
import { EditorCanvasShapePanel } from "@/components/editor/editor-canvas-shape-panel";
import {
  CANVAS_SHAPE_DRAG_MIME,
  parseCanvasShapeDragPayload,
} from "@/lib/canvas-shape-defs";
import {
  canvasEdge,
  canvasNode,
  DEFAULT_CANVAS_NODE_COLOR,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas";

function WorkspaceCanvasNode({
  id,
  data,
  width,
  height,
  selected,
}: NodeProps<CanvasNode>) {
  const updateNodeInternals = useUpdateNodeInternals();
  const w = width ?? 160;
  const h = height ?? 88;
  const fill = data.color || DEFAULT_CANVAS_NODE_COLOR;

  useLayoutEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals, w, h, data.shape, selected]);

  return (
    <div
      className="relative text-sm text-card-foreground"
      style={{ width: w, height: h }}
    >
      <CanvasNodeShapeView
        shape={data.shape}
        width={w}
        height={h}
        fill={fill}
        selected={selected}
      />
      <Handle type="target" position={Position.Top} />
      <div className="pointer-events-none absolute inset-0 z-1 flex items-center justify-center px-2">
        <span className="text-center">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function EditorWorkspaceCanvasFlowInner() {
  const reactFlowRef = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(
    null,
  );
  const dropCounterRef = useRef(0);

  const nodeTypes = useMemo(
    () => ({
      [canvasNode]: WorkspaceCanvasNode,
    }),
    [],
  );

  const edgeTypes = useMemo(
    () => ({
      [canvasEdge]: BezierEdge,
    }),
    [],
  );

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    const types = Array.from(event.dataTransfer.types);
    if (!types.includes(CANVAS_SHAPE_DRAG_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const rf = reactFlowRef.current;
      if (!rf) return;

      const raw =
        event.dataTransfer.getData(CANVAS_SHAPE_DRAG_MIME) ||
        event.dataTransfer.getData("text/plain");
      const payload = parseCanvasShapeDragPayload(raw);
      if (!payload) return;

      const { shape, width: nodeWidth, height: nodeHeight } = payload;
      const flowPoint = rf.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const id = `${shape}-${Date.now()}-${++dropCounterRef.current}`;

      onNodesChange([
        {
          type: "add",
            item: {
            id,
            type: canvasNode,
            position: {
              x: flowPoint.x - nodeWidth / 2,
              y: flowPoint.y - nodeHeight / 2,
            },
            width: nodeWidth,
            height: nodeHeight,
            data: {
              label: "",
              color: DEFAULT_CANVAS_NODE_COLOR,
              shape,
            },
            style: { width: nodeWidth, height: nodeHeight },
          },
        },
      ]);
    },
    [onNodesChange],
  );

  return (
    <div className="h-[calc(100dvh-3.5rem)] w-full bg-zinc-950">
      <ReactFlow<CanvasNode, CanvasEdge>
        className="h-full w-full"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: canvasEdge }}
        onInit={(instance) => {
          reactFlowRef.current = instance;
        }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.25}
        maxZoom={2}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="rgb(63 63 70 / 0.45)"
        />
        <MiniMap
          className="m-3! rounded-md! border! border-border! bg-zinc-900/90!"
          maskColor="rgb(24 24 27 / 0.65)"
          nodeStrokeWidth={2}
        />
        <Cursors />
        <Panel
          position="bottom-center"
          className="m-0 mb-4! flex justify-center p-0"
        >
          <EditorCanvasShapePanel />
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function EditorWorkspaceCanvasFlow() {
  return <EditorWorkspaceCanvasFlowInner />;
}
