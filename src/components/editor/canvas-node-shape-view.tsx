"use client";

import type { ReactNode } from "react";

import type { CanvasShapeId } from "@/lib/canvas-shape-defs";
import { cn } from "@/lib/utils";

const SVG_STROKE_REST = "rgb(82 82 91 / 0.85)";
const SVG_STROKE_SELECTED = "rgb(212 212 216)";

type CanvasNodeShapeViewProps = {
  shape: CanvasShapeId;
  width: number;
  height: number;
  fill: string;
  selected?: boolean;
  /** Lighter stroke / opacity for palette drag ghost */
  ghost?: boolean;
  className?: string;
};

function SvgShapeFrame({
  children,
  ghost,
  className,
}: {
  children: ReactNode;
  ghost?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={cn("absolute inset-0 size-full", className)}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <g strokeWidth={ghost ? 1.25 : 1.5}>{children}</g>
    </svg>
  );
}

function DiamondSvg({
  selected,
  ghost,
  fillHex,
}: {
  selected?: boolean;
  ghost?: boolean;
  fillHex: string;
}) {
  const stroke = ghost
    ? "rgb(82 82 91 / 0.5)"
    : selected
      ? SVG_STROKE_SELECTED
      : SVG_STROKE_REST;
  return (
    <SvgShapeFrame ghost={ghost}>
      <polygon
        points="50,2 98,50 50,98 2,50"
        fill={fillHex}
        stroke={stroke}
        strokeLinejoin="round"
        vectorEffect="nonScalingStroke"
      />
    </SvgShapeFrame>
  );
}

function HexagonSvg({
  selected,
  ghost,
  fillHex,
}: {
  selected?: boolean;
  ghost?: boolean;
  fillHex: string;
}) {
  const stroke = ghost
    ? "rgb(82 82 91 / 0.5)"
    : selected
      ? SVG_STROKE_SELECTED
      : SVG_STROKE_REST;
  return (
    <SvgShapeFrame ghost={ghost}>
      <polygon
        points="25,2 75,2 100,50 75,98 25,98 0,50"
        fill={fillHex}
        stroke={stroke}
        strokeLinejoin="round"
        vectorEffect="nonScalingStroke"
      />
    </SvgShapeFrame>
  );
}

function CylinderSvg({
  selected,
  ghost,
  fillHex,
}: {
  selected?: boolean;
  ghost?: boolean;
  fillHex: string;
}) {
  const stroke = ghost
    ? "rgb(82 82 91 / 0.5)"
    : selected
      ? SVG_STROKE_SELECTED
      : SVG_STROKE_REST;
  return (
    <SvgShapeFrame ghost={ghost}>
      <path
        d="M 12 28 A 38 11 0 1 1 88 28 L 88 72 A 38 11 0 1 1 12 72 Z"
        fill={fillHex}
        stroke={stroke}
        strokeLinejoin="round"
        vectorEffect="nonScalingStroke"
      />
    </SvgShapeFrame>
  );
}

export function CanvasNodeShapeView({
  shape,
  width,
  height,
  fill,
  selected,
  ghost,
  className,
}: CanvasNodeShapeViewProps) {
  const borderRest = ghost
    ? "border-zinc-600/40"
    : "border-zinc-600/70";
  const borderSelected = ghost
    ? "border-zinc-400/50"
    : "border-zinc-200";

  if (shape === "diamond") {
    return (
      <div className={cn("relative", className)} style={{ width, height }}>
        <DiamondSvg
          selected={selected}
          ghost={ghost}
          fillHex={fill}
        />
      </div>
    );
  }

  if (shape === "hexagon") {
    return (
      <div className={cn("relative", className)} style={{ width, height }}>
        <HexagonSvg
          selected={selected}
          ghost={ghost}
          fillHex={fill}
        />
      </div>
    );
  }

  if (shape === "cylinder") {
    return (
      <div className={cn("relative", className)} style={{ width, height }}>
        <CylinderSvg
          selected={selected}
          ghost={ghost}
          fillHex={fill}
        />
      </div>
    );
  }

  const radiusClass =
    shape === "circle"
      ? "rounded-full"
      : shape === "pill"
        ? "rounded-full"
        : "rounded-none";

  return (
    <div
      className={cn(
        "box-border border bg-clip-padding",
        radiusClass,
        selected ? borderSelected : borderRest,
        className,
      )}
      style={{
        width,
        height,
        backgroundColor: fill,
      }}
    />
  );
}
