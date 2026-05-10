"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
} from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  MarkerType,
  Panel,
  ReactFlow,
  type ReactFlowInstance,
} from "@xyflow/react";
import { Cursors, useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
} from "@liveblocks/react/suspense";

import { EditorCanvasControlBar } from "@/components/editor/editor-canvas-control-bar";
import {
  CANVAS_TEMPLATES,
  getStarterTemplateImportChanges,
  type CanvasTemplate,
} from "@/components/editor/starter-templates";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import { WorkspaceCanvasEdge } from "@/components/editor/workspace-canvas-edge";
import {
  CanvasEdgeUiProvider,
  CanvasFlowOnEdgesChangeProvider,
  CanvasFlowOnNodesChangeProvider,
} from "@/components/editor/workspace-canvas-flow-context";
import { WorkspaceCanvasNode } from "@/components/editor/workspace-canvas-node";
import { EditorCanvasShapePanel } from "@/components/editor/editor-canvas-shape-panel";
import {
  CANVAS_SHAPE_DRAG_MIME,
  parseCanvasShapeDragPayload,
} from "@/lib/canvas-shape-defs";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import {
  canvasEdge,
  canvasNode,
  DEFAULT_CANVAS_NODE_COLOR,
  DEFAULT_CANVAS_NODE_FOREGROUND,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas";

const FIT_VIEW_ANIM_MS = 200;

type EditorWorkspaceCanvasFlowProps = {
  starterTemplatesOpen: boolean;
  onStarterTemplatesOpenChange: (open: boolean) => void;
};

function EditorWorkspaceCanvasFlowInner({
  starterTemplatesOpen,
  onStarterTemplatesOpenChange,
}: EditorWorkspaceCanvasFlowProps) {
  const reactFlowRef = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(
    null,
  );
  const dropCounterRef = useRef(0);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  const edgeUiValue = useMemo(
    () => ({
      editingEdgeId,
      setEditingEdgeId,
      hoveredEdgeId,
      setHoveredEdgeId,
    }),
    [editingEdgeId, hoveredEdgeId],
  );

  const nodeTypes = useMemo(
    () => ({
      [canvasNode]: WorkspaceCanvasNode,
    }),
    [],
  );

  const edgeTypes = useMemo(
    () => ({
      [canvasEdge]: WorkspaceCanvasEdge,
    }),
    [],
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: canvasEdge,
      style: {
        stroke: "#a1a1aa",
        strokeWidth: 1.25,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: "#a1a1aa",
      },
      pathOptions: { borderRadius: 0, offset: 16 },
    }),
    [],
  );

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  useKeyboardShortcuts<CanvasNode, CanvasEdge>({
    reactFlowRef,
    onUndo: undo,
    onRedo: redo,
  });

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    const types = Array.from(event.dataTransfer.types);
    if (!types.includes(CANVAS_SHAPE_DRAG_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
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
              foreground: DEFAULT_CANVAS_NODE_FOREGROUND,
              shape,
            },
            style: { width: nodeWidth, height: nodeHeight },
          },
        },
      ]);
    },
    [onNodesChange],
  );

  const onEdgeDoubleClick = useCallback(
    (_event: MouseEvent, edge: CanvasEdge) => {
      setEditingEdgeId(edge.id);
    },
    [],
  );

  const onEdgeMouseEnter = useCallback(
    (_event: MouseEvent, edge: CanvasEdge) => {
      setHoveredEdgeId(edge.id);
    },
    [],
  );

  const onEdgeMouseLeave = useCallback(
    (_event: MouseEvent, edge: CanvasEdge) => {
      setHoveredEdgeId((current) => (current === edge.id ? null : current));
    },
    [],
  );

  const importStarterTemplate = useCallback(
    (template: CanvasTemplate) => {
      setEditingEdgeId(null);
      setHoveredEdgeId(null);
      const {
        clearEdgeChanges,
        clearNodeChanges,
        templateNodeChanges,
        templateEdgeChanges,
      } = getStarterTemplateImportChanges(template, nodes, edges);

      if (clearEdgeChanges.length) onEdgesChange(clearEdgeChanges);
      if (clearNodeChanges.length) onNodesChange(clearNodeChanges);
      if (templateNodeChanges.length) onNodesChange(templateNodeChanges);
      if (templateEdgeChanges.length) onEdgesChange(templateEdgeChanges);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          reactFlowRef.current?.fitView({
            padding: 0.2,
            duration: FIT_VIEW_ANIM_MS,
          });
        });
      });
    },
    [edges, nodes, onEdgesChange, onNodesChange],
  );

  return (
    <div className="h-[calc(100dvh-3.5rem)] w-full bg-zinc-950">
      <CanvasEdgeUiProvider value={edgeUiValue}>
        <CanvasFlowOnNodesChangeProvider onNodesChange={onNodesChange}>
          <CanvasFlowOnEdgesChangeProvider onEdgesChange={onEdgesChange}>
            <ReactFlow<CanvasNode, CanvasEdge>
              colorMode="dark"
              className="h-full w-full"
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              connectionMode={ConnectionMode.Loose}
              connectionLineType={ConnectionLineType.SmoothStep}
              onInit={(instance) => {
                reactFlowRef.current = instance;
              }}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDelete={onDelete}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onEdgeDoubleClick={onEdgeDoubleClick}
              onEdgeMouseEnter={onEdgeMouseEnter}
              onEdgeMouseLeave={onEdgeMouseLeave}
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
              <Cursors />
              <Panel
                position="bottom-left"
                className="m-0 mb-4! ml-4! p-0"
              >
                <EditorCanvasControlBar
                  reactFlowRef={reactFlowRef}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  onUndo={undo}
                  onRedo={redo}
                />
              </Panel>
              <Panel
                position="bottom-center"
                className="m-0 mb-4! flex justify-center p-0"
              >
                <EditorCanvasShapePanel />
              </Panel>
            </ReactFlow>
          </CanvasFlowOnEdgesChangeProvider>
        </CanvasFlowOnNodesChangeProvider>
      </CanvasEdgeUiProvider>
      <StarterTemplatesModal
        open={starterTemplatesOpen}
        onOpenChange={onStarterTemplatesOpenChange}
        templates={CANVAS_TEMPLATES}
        onImport={importStarterTemplate}
      />
    </div>
  );
}

export function EditorWorkspaceCanvasFlow(props: EditorWorkspaceCanvasFlowProps) {
  return <EditorWorkspaceCanvasFlowInner {...props} />;
}
