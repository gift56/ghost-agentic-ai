import type { EdgeChange, NodeChange } from "@xyflow/react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

/**
 * Replaces the current diagram with a persisted snapshot (clear edges → clear nodes → add).
 * Invoke `onEdgesChange` / `onNodesChange` in that order, matching starter template import.
 */
export function getCanvasSnapshotImportChanges(
  snapshot: { nodes: CanvasNode[]; edges: CanvasEdge[] },
  currentNodes: readonly CanvasNode[],
  currentEdges: readonly CanvasEdge[],
): {
  clearEdgeChanges: EdgeChange<CanvasEdge>[];
  clearNodeChanges: NodeChange<CanvasNode>[];
  snapshotNodeChanges: NodeChange<CanvasNode>[];
  snapshotEdgeChanges: EdgeChange<CanvasEdge>[];
} {
  const clearEdgeChanges: EdgeChange<CanvasEdge>[] = currentEdges.map((e) => ({
    type: "remove",
    id: e.id,
  }));
  const clearNodeChanges: NodeChange<CanvasNode>[] = currentNodes.map((n) => ({
    type: "remove",
    id: n.id,
  }));
  const snapshotNodeChanges: NodeChange<CanvasNode>[] = snapshot.nodes.map(
    (node) => ({
      type: "add",
      item: node,
    }),
  );
  const snapshotEdgeChanges: EdgeChange<CanvasEdge>[] = snapshot.edges.map(
    (edge) => ({
      type: "add",
      item: edge,
    }),
  );
  return {
    clearEdgeChanges,
    clearNodeChanges,
    snapshotNodeChanges,
    snapshotEdgeChanges,
  };
}
