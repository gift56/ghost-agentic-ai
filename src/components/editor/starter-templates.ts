import type { EdgeChange, NodeChange } from "@xyflow/react";

import { CANVAS_SHAPE_DEFINITIONS } from "@/lib/canvas-shape-defs";
import {
  canvasEdge,
  canvasNode,
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeData,
} from "@/types/canvas";

export type CanvasTemplate = {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};

function shapeSize(shape: CanvasNodeData["shape"]) {
  const def = CANVAS_SHAPE_DEFINITIONS.find((d) => d.id === shape);
  return {
    width: def?.width ?? 200,
    height: def?.height ?? 88,
  };
}

function colorPair(index: number) {
  const p = NODE_COLORS[index % NODE_COLORS.length];
  return { color: p.fill, foreground: p.text };
}

/** Builds a `canvasNode` with default dimensions for the given shape. */
function templateNode(
  id: string,
  position: { x: number; y: number },
  label: string,
  shape: CanvasNodeData["shape"],
  colorIndex: number,
): CanvasNode {
  const { width, height } = shapeSize(shape);
  const { color, foreground } = colorPair(colorIndex);
  return {
    id,
    type: canvasNode,
    position: { ...position },
    width,
    height,
    data: {
      label,
      shape,
      color,
      foreground,
    },
    style: { width, height },
  };
}

/** Minimal `canvasEdge` for templates (smooth-step + markers come from React Flow defaults). */
function templateEdge(
  id: string,
  source: string,
  target: string,
  sourceHandle: string,
  targetHandle: string,
  label?: string,
): CanvasEdge {
  return {
    id,
    type: canvasEdge,
    source,
    target,
    sourceHandle,
    targetHandle,
    data: label ? { label } : {},
  };
}

/**
 * Applies a starter template by clearing the current diagram and loading the template.
 * Callers should invoke `onEdgesChange` / `onNodesChange` in this order.
 */
export function getStarterTemplateImportChanges(
  template: CanvasTemplate,
  currentNodes: readonly CanvasNode[],
  currentEdges: readonly CanvasEdge[],
): {
  clearEdgeChanges: EdgeChange<CanvasEdge>[];
  clearNodeChanges: NodeChange<CanvasNode>[];
  templateNodeChanges: NodeChange<CanvasNode>[];
  templateEdgeChanges: EdgeChange<CanvasEdge>[];
} {
  const clearEdgeChanges: EdgeChange<CanvasEdge>[] = currentEdges.map((e) => ({
    type: "remove",
    id: e.id,
  }));
  const clearNodeChanges: NodeChange<CanvasNode>[] = currentNodes.map((n) => ({
    type: "remove",
    id: n.id,
  }));
  const templateNodeChanges: NodeChange<CanvasNode>[] = template.nodes.map(
    (node) => ({
      type: "add",
      item: node,
    }),
  );
  const templateEdgeChanges: EdgeChange<CanvasEdge>[] = template.edges.map(
    (edge) => ({
      type: "add",
      item: edge,
    }),
  );
  return {
    clearEdgeChanges,
    clearNodeChanges,
    templateNodeChanges,
    templateEdgeChanges,
  };
}

const CANVAS_TEMPLATES_LIST: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices map",
    description:
      "API gateway routing to domain services with an async message queue for cross-service work.",
    nodes: [
      templateNode("ms-gateway", { x: 320, y: 24 }, "API Gateway", "rectangle", 1),
      templateNode("ms-auth", { x: 40, y: 200 }, "Auth service", "pill", 2),
      templateNode("ms-users", { x: 340, y: 200 }, "Users", "rectangle", 3),
      templateNode("ms-orders", { x: 640, y: 188 }, "Orders", "hexagon", 4),
      templateNode("ms-queue", { x: 352, y: 380 }, "Message queue", "cylinder", 5),
    ],
    edges: [
      templateEdge("ms-e1", "ms-gateway", "ms-auth", "bottom-s", "top-t", "JWT"),
      templateEdge("ms-e2", "ms-gateway", "ms-users", "bottom-s", "top-t"),
      templateEdge("ms-e3", "ms-gateway", "ms-orders", "bottom-s", "top-t"),
      templateEdge("ms-e4", "ms-users", "ms-queue", "bottom-s", "top-t", "events"),
      templateEdge("ms-e5", "ms-orders", "ms-queue", "bottom-s", "top-t", "events"),
    ],
  },
  {
    id: "cicd",
    name: "CI/CD pipeline",
    description:
      "Linear delivery path from source control through build, test, deploy, and observability.",
    nodes: [
      templateNode("cd-source", { x: 40, y: 140 }, "Source", "rectangle", 0),
      templateNode("cd-build", { x: 280, y: 148 }, "Build", "pill", 1),
      templateNode("cd-test", { x: 520, y: 124 }, "Test", "diamond", 6),
      templateNode("cd-deploy", { x: 720, y: 140 }, "Deploy", "rectangle", 7),
      templateNode("cd-monitor", { x: 960, y: 132 }, "Monitor", "circle", 2),
    ],
    edges: [
      templateEdge("cd-e1", "cd-source", "cd-build", "right-s", "left-t"),
      templateEdge("cd-e2", "cd-build", "cd-test", "right-s", "left-t"),
      templateEdge("cd-e3", "cd-test", "cd-deploy", "right-s", "left-t"),
      templateEdge("cd-e4", "cd-deploy", "cd-monitor", "right-s", "left-t"),
    ],
  },
  {
    id: "event-driven",
    name: "Event-driven system",
    description:
      "Producer publishes to a shared bus; consumers react in parallel and persist to a data store.",
    nodes: [
      templateNode("ev-producer", { x: 48, y: 200 }, "Producer", "rectangle", 3),
      templateNode("ev-bus", { x: 320, y: 176 }, "Event bus", "cylinder", 1),
      templateNode("ev-worker-a", { x: 600, y: 96 }, "Consumer A", "pill", 4),
      templateNode("ev-worker-b", { x: 600, y: 304 }, "Consumer B", "pill", 5),
      templateNode("ev-store", { x: 880, y: 188 }, "Data store", "hexagon", 6),
    ],
    edges: [
      templateEdge("ev-e1", "ev-producer", "ev-bus", "right-s", "left-t"),
      templateEdge("ev-e2", "ev-bus", "ev-worker-a", "right-s", "left-t"),
      templateEdge("ev-e3", "ev-bus", "ev-worker-b", "right-s", "left-t"),
      templateEdge("ev-e4", "ev-worker-a", "ev-store", "right-s", "left-t"),
      templateEdge("ev-e5", "ev-worker-b", "ev-store", "right-s", "left-t"),
    ],
  },
];

export const CANVAS_TEMPLATES: readonly CanvasTemplate[] = CANVAS_TEMPLATES_LIST;
