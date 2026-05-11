"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
} from "react";
import { useUpdateMyPresence } from "@liveblocks/react/suspense";
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
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
} from "@liveblocks/react/suspense";

import { EditorCanvasAiActivity } from "@/components/editor/editor-canvas-ai-activity";
import { EditorCanvasControlBar } from "@/components/editor/editor-canvas-control-bar";
import { EditorCanvasLiveCursors } from "@/components/editor/editor-canvas-live-cursors";
import { EditorCanvasPresenceAvatars } from "@/components/editor/editor-canvas-presence-avatars";
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
import {
  useCanvasAutosave,
  type CanvasAutosaveStatus,
} from "@/hooks/use-canvas-autosave";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { getCanvasSnapshotImportChanges } from "@/lib/canvas-snapshot-import";
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
  projectId: string;
  savedCanvasBlobUrl: string | null;
  onSaveStatusChange?: (status: CanvasAutosaveStatus) => void;
  onAutosaveFlushReady?: (flush: () => Promise<void>) => void;
};

function EditorWorkspaceCanvasFlowInner({
  starterTemplatesOpen,
  onStarterTemplatesOpenChange,
  projectId,
  savedCanvasBlobUrl,
  onSaveStatusChange,
  onAutosaveFlushReady,
}: EditorWorkspaceCanvasFlowProps) {
  const reactFlowRef = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(
    null,
  );
  const dropCounterRef = useRef(0);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [canvasHydrated, setCanvasHydrated] = useState(false);
  const nodeCountRef = useRef(0);
  const edgeCountRef = useRef(0);

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

  const onNodesChangeRef = useRef(onNodesChange);
  const onEdgesChangeRef = useRef(onEdgesChange);

  useLayoutEffect(() => {
    onNodesChangeRef.current = onNodesChange;
    onEdgesChangeRef.current = onEdgesChange;
    nodeCountRef.current = nodes.length;
    edgeCountRef.current = edges.length;
  });

  const { status: autosaveStatus, flush: flushAutosave } = useCanvasAutosave({
    projectId,
    nodes,
    edges,
    enabled: canvasHydrated,
  });

  useEffect(() => {
    onSaveStatusChange?.(autosaveStatus);
  }, [autosaveStatus, onSaveStatusChange]);

  useEffect(() => {
    onAutosaveFlushReady?.(flushAutosave);
  }, [flushAutosave, onAutosaveFlushReady]);

  useEffect(() => {
    let cancelled = false;

    const finishHydration = () => {
      if (!cancelled) {
        setCanvasHydrated(true);
      }
    };

    if (nodeCountRef.current > 0 || edgeCountRef.current > 0) {
      finishHydration();
      return () => {
        cancelled = true;
      };
    }

    const url = savedCanvasBlobUrl?.trim();
    if (!url) {
      finishHydration();
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`, {
          credentials: "same-origin",
        });
        if (cancelled) return;

        if (nodeCountRef.current > 0 || edgeCountRef.current > 0) {
          finishHydration();
          return;
        }

        if (!res.ok) {
          finishHydration();
          return;
        }

        const data = (await res.json()) as {
          canvas: { nodes: CanvasNode[]; edges: CanvasEdge[] } | null;
        };

        if (
          !data.canvas ||
          !Array.isArray(data.canvas.nodes) ||
          !Array.isArray(data.canvas.edges)
        ) {
          finishHydration();
          return;
        }

        if (nodeCountRef.current > 0 || edgeCountRef.current > 0) {
          finishHydration();
          return;
        }

        const {
          clearEdgeChanges,
          clearNodeChanges,
          snapshotNodeChanges,
          snapshotEdgeChanges,
        } = getCanvasSnapshotImportChanges(data.canvas, [], []);

        setEditingEdgeId(null);
        setHoveredEdgeId(null);

        if (clearEdgeChanges.length) {
          onEdgesChangeRef.current(clearEdgeChanges);
        }
        if (clearNodeChanges.length) {
          onNodesChangeRef.current(clearNodeChanges);
        }
        if (snapshotNodeChanges.length) {
          onNodesChangeRef.current(snapshotNodeChanges);
        }
        if (snapshotEdgeChanges.length) {
          onEdgesChangeRef.current(snapshotEdgeChanges);
        }

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            reactFlowRef.current?.fitView({
              padding: 0.2,
              duration: FIT_VIEW_ANIM_MS,
            });
          });
        });
      } catch {
        // Leave empty canvas; user can still edit.
      } finally {
        finishHydration();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, savedCanvasBlobUrl]);

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const updateMyPresence = useUpdateMyPresence();

  const onPaneMouseMove = useCallback(
    (event: MouseEvent) => {
      const rf = reactFlowRef.current;
      if (!rf) return;
      updateMyPresence({
        cursor: rf.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        }),
      });
    },
    [updateMyPresence],
  );

  const onPaneMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

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
              onPaneMouseMove={onPaneMouseMove}
              onPaneMouseLeave={onPaneMouseLeave}
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
              <EditorCanvasLiveCursors />
              <EditorCanvasAiActivity />
              <Panel
                position="top-right"
                className="z-10 m-0 mr-4! mt-4! p-0"
              >
                <EditorCanvasPresenceAvatars />
              </Panel>
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
