"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { OnEdgesChange, OnNodesChange } from "@xyflow/react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

const CanvasFlowOnNodesChangeContext =
  createContext<OnNodesChange<CanvasNode> | null>(null);

const CanvasFlowOnEdgesChangeContext =
  createContext<OnEdgesChange<CanvasEdge> | null>(null);

export type CanvasEdgeUiContextValue = {
  editingEdgeId: string | null;
  setEditingEdgeId: (id: string | null) => void;
  hoveredEdgeId: string | null;
  setHoveredEdgeId: (id: string | null) => void;
};

const CanvasEdgeUiContext = createContext<CanvasEdgeUiContextValue | null>(null);

export function CanvasFlowOnNodesChangeProvider({
  children,
  onNodesChange,
}: {
  children: ReactNode;
  onNodesChange: OnNodesChange<CanvasNode>;
}) {
  return (
    <CanvasFlowOnNodesChangeContext.Provider value={onNodesChange}>
      {children}
    </CanvasFlowOnNodesChangeContext.Provider>
  );
}

export function CanvasFlowOnEdgesChangeProvider({
  children,
  onEdgesChange,
}: {
  children: ReactNode;
  onEdgesChange: OnEdgesChange<CanvasEdge>;
}) {
  return (
    <CanvasFlowOnEdgesChangeContext.Provider value={onEdgesChange}>
      {children}
    </CanvasFlowOnEdgesChangeContext.Provider>
  );
}

export function CanvasEdgeUiProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: CanvasEdgeUiContextValue;
}) {
  return (
    <CanvasEdgeUiContext.Provider value={value}>{children}</CanvasEdgeUiContext.Provider>
  );
}

export function useCanvasFlowOnNodesChange(): OnNodesChange<CanvasNode> {
  const ctx = useContext(CanvasFlowOnNodesChangeContext);
  if (!ctx) {
    throw new Error(
      "useCanvasFlowOnNodesChange must be used within CanvasFlowOnNodesChangeProvider",
    );
  }
  return ctx;
}

export function useCanvasFlowOnEdgesChange(): OnEdgesChange<CanvasEdge> {
  const ctx = useContext(CanvasFlowOnEdgesChangeContext);
  if (!ctx) {
    throw new Error(
      "useCanvasFlowOnEdgesChange must be used within CanvasFlowOnEdgesChangeProvider",
    );
  }
  return ctx;
}

export function useCanvasEdgeUi(): CanvasEdgeUiContextValue {
  const ctx = useContext(CanvasEdgeUiContext);
  if (!ctx) {
    throw new Error("useCanvasEdgeUi must be used within CanvasEdgeUiProvider");
  }
  return ctx;
}
