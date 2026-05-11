import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Liveblocks } from "@liveblocks/node";
import { mutateFlow, type MutableFlow } from "@liveblocks/react-flow/node";
import { logger, task } from "@trigger.dev/sdk";
import { generateText, hasToolCall, stepCountIs, tool } from "ai";
import { z } from "zod";

import { CANVAS_SHAPE_DEFINITIONS } from "@/lib/canvas-shape-defs";
import {
  canvasEdge,
  canvasNode,
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas";
import {
  AI_STATUS_FEED_ID,
  aiStatusFeedPayloadSchema,
} from "@/types/tasks";

const SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const;

const COLUMN_WIDTH = 320;
const ROW_HEIGHT = 200;
const ORIGIN_X = 0;
const ORIGIN_Y = 0;

const MIN_NODE_WIDTH = 80;
const MIN_NODE_HEIGHT = 56;
const MAX_NODE_WIDTH = 420;
const MAX_NODE_HEIGHT = 320;

const MAX_ACTIONS = 64;
/** Model rounds (each round may include multiple tool calls). */
const MAX_AGENT_STEPS = 40;

function shapeSize(shape: (typeof SHAPES)[number]) {
  const def = CANVAS_SHAPE_DEFINITIONS.find((d) => d.id === shape);
  return {
    width: def?.width ?? 200,
    height: def?.height ?? 88,
  };
}

function colorPair(index: number) {
  const safe = Math.max(0, Math.min(NODE_COLORS.length - 1, Math.floor(index)));
  const pair = NODE_COLORS[safe]!;
  return { color: pair.fill, foreground: pair.text };
}

function gridPosition(column: number, row: number) {
  const safeCol = Math.max(0, Math.floor(column));
  const safeRow = Math.max(0, Math.floor(row));
  return {
    x: ORIGIN_X + safeCol * COLUMN_WIDTH,
    y: ORIGIN_Y + safeRow * ROW_HEIGHT,
  };
}

function clampDimension(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

const addNodeInputSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(60),
  shape: z.enum(SHAPES),
  colorIndex: z.number().int().min(0).max(NODE_COLORS.length - 1),
  column: z.number().int().min(0).max(20),
  row: z.number().int().min(0).max(20),
});

const moveNodeInputSchema = z.object({
  id: z.string().min(1),
  column: z.number().int().min(0).max(20),
  row: z.number().int().min(0).max(20),
});

const resizeNodeInputSchema = z.object({
  id: z.string().min(1),
  width: z.number().int().min(MIN_NODE_WIDTH).max(MAX_NODE_WIDTH),
  height: z.number().int().min(MIN_NODE_HEIGHT).max(MAX_NODE_HEIGHT),
});

const updateNodeDataInputSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(60).optional(),
  shape: z.enum(SHAPES).optional(),
  colorIndex: z.number().int().min(0).max(NODE_COLORS.length - 1).optional(),
});

const deleteNodeInputSchema = z.object({
  id: z.string().min(1),
});

const addEdgeInputSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().max(40).optional(),
});

const deleteEdgeInputSchema = z.object({
  id: z.string().min(1),
});

const finishDesignInputSchema = z.object({
  summary: z.string().min(1).max(280),
});

type DesignAction =
  | { type: "add_node"; id: string; label: string; shape: (typeof SHAPES)[number]; colorIndex: number; column: number; row: number }
  | { type: "move_node"; id: string; column: number; row: number }
  | { type: "resize_node"; id: string; width: number; height: number }
  | { type: "update_node_data"; id: string; label?: string; shape?: (typeof SHAPES)[number]; colorIndex?: number }
  | { type: "delete_node"; id: string }
  | { type: "add_edge"; id: string; source: string; target: string; label?: string }
  | { type: "delete_edge"; id: string };

type CanvasSnapshot = {
  nodes: { id: string; label: string; shape: string; colorIndex: number }[];
  edges: { id: string; source: string; target: string; label?: string }[];
};

function getLiveblocksClient(): Liveblocks {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
  }
  return new Liveblocks({ secret });
}

function getGoogleAi() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return createGoogleGenerativeAI({ apiKey });
}

function colorIndexFromFill(fill: string): number {
  const idx = NODE_COLORS.findIndex(
    (pair) => pair.fill.toLowerCase() === fill.toLowerCase(),
  );
  return idx < 0 ? 0 : idx;
}

async function readSnapshot(
  liveblocks: Liveblocks,
  roomId: string,
): Promise<CanvasSnapshot> {
  let snapshot: CanvasSnapshot = { nodes: [], edges: [] };
  await mutateFlow<CanvasNode, CanvasEdge>(
    { client: liveblocks, roomId },
    (flow) => {
      snapshot = {
        nodes: flow.nodes.map((n) => ({
          id: n.id,
          label: n.data.label,
          shape: n.data.shape,
          colorIndex: colorIndexFromFill(n.data.color),
        })),
        edges: flow.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.data?.label,
        })),
      };
    },
  );
  return snapshot;
}

function buildSystemPrompt(snapshot: CanvasSnapshot): string {
  return [
    "You are Ghost AI, an architecture diagram agent that edits a shared, real-time React Flow canvas.",
    "",
    "Use the provided tools to change the canvas. Call tools in a sensible order (add nodes before edges that reference them).",
    "When every intended edit is done, you MUST call finishDesign with a short human-readable summary (max ~280 chars).",
    "",
    "Hard constraints — never violate:",
    `- Allowed node shapes: ${SHAPES.join(", ")}.`,
    `- Allowed color indexes: 0..${NODE_COLORS.length - 1}.`,
    "  Color guidance:",
    NODE_COLORS.map(
      (pair, idx) => `    ${idx} = ${pair.fill} fill / ${pair.text} text`,
    ).join("\n"),
    "- All new nodes MUST be placed on a logical grid using integer `column` and `row` (0-indexed).",
    "  The renderer converts column/row to pixel positions; do NOT think in pixels.",
    "- Use distinct `column` values for logically distinct layers (e.g. client, edge, service, data).",
    "- Use distinct `row` values within a column to avoid overlap.",
    "- Labels must be short (<= 4 words).",
    "- Connect related components with addEdge. Source/target MUST reference existing node ids or ids you already added in this session.",
    "- When deleting a node, also delete incident edges (deleteEdge) in the same session.",
    `- At most ${MAX_ACTIONS} canvas mutations total; if you approach the limit, stop adding and call finishDesign.`,
    "- Prefer 4–12 nodes for new designs. Do not exceed 24 nodes.",
    "",
    "Tools: addNode, moveNode, resizeNode, updateNodeData, deleteNode, addEdge, deleteEdge, finishDesign.",
    "",
    "Current canvas snapshot (existing ids you may reference, move, resize, update, or delete):",
    JSON.stringify(snapshot, null, 2),
  ].join("\n");
}

type StatusPhase = "start" | "processing" | "complete" | "error";

async function ensureAiStatusFeed(liveblocks: Liveblocks, roomId: string) {
  try {
    const { data: feeds } = await liveblocks.getFeeds({ roomId });
    const hasFeed = feeds.some((f) => f.feedId === AI_STATUS_FEED_ID);
    if (!hasFeed) {
      await liveblocks.createFeed({ roomId, feedId: AI_STATUS_FEED_ID });
    }
  } catch (error) {
    logger.warn("design-agent: ensure ai-status-feed failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function pushAiStatusFeed(
  liveblocks: Liveblocks,
  roomId: string,
  payload: {
    runId: string;
    userId: string;
    phase: StatusPhase;
    message: string;
  },
) {
  const data = {
    kind: "design" as const,
    runId: payload.runId,
    userId: payload.userId,
    phase: payload.phase,
    text: payload.message.trim().length > 0 ? payload.message : undefined,
  };
  const parsed = aiStatusFeedPayloadSchema.safeParse(data);
  if (!parsed.success) {
    logger.warn("design-agent: ai-status-feed payload invalid", {
      issues: parsed.error.flatten(),
    });
    return;
  }
  try {
    await ensureAiStatusFeed(liveblocks, roomId);
    await liveblocks.createFeedMessage({
      roomId,
      feedId: AI_STATUS_FEED_ID,
      data: parsed.data,
    });
  } catch (error) {
    logger.warn("design-agent: createFeedMessage ai-status-feed failed", {
      error: error instanceof Error ? error.message : String(error),
      phase: payload.phase,
    });
  }
}

async function broadcastFocus(
  liveblocks: Liveblocks,
  roomId: string,
  payload: {
    runId: string;
    userId: string;
    position: { x: number; y: number } | null;
  },
) {
  try {
    await liveblocks.broadcastEvent(roomId, {
      type: "ai:focus",
      ...payload,
    });
  } catch (error) {
    logger.warn("design-agent: broadcastEvent ai:focus failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function applyDesignActions(
  flow: MutableFlow<CanvasNode, CanvasEdge>,
  actions: DesignAction[],
  emitFocus: (position: { x: number; y: number } | null) => void,
) {
  for (const action of actions) {
    switch (action.type) {
      case "add_node": {
        const { width, height } = shapeSize(action.shape);
        const { color, foreground } = colorPair(action.colorIndex);
        const position = gridPosition(action.column, action.row);
        flow.addNode({
          id: action.id,
          type: canvasNode,
          position,
          width,
          height,
          data: {
            label: action.label,
            shape: action.shape,
            color,
            foreground,
          },
          style: { width, height },
        });
        emitFocus({
          x: position.x + width / 2,
          y: position.y + height / 2,
        });
        break;
      }
      case "move_node": {
        const existing = flow.getNode(action.id);
        if (!existing) break;
        const position = gridPosition(action.column, action.row);
        flow.updateNode(action.id, (n) => ({ ...n, position }));
        const w =
          (typeof existing.width === "number" && existing.width) ||
          shapeSize(existing.data.shape).width;
        const h =
          (typeof existing.height === "number" && existing.height) ||
          shapeSize(existing.data.shape).height;
        emitFocus({ x: position.x + w / 2, y: position.y + h / 2 });
        break;
      }
      case "resize_node": {
        const width = clampDimension(action.width, MIN_NODE_WIDTH, MAX_NODE_WIDTH);
        const height = clampDimension(
          action.height,
          MIN_NODE_HEIGHT,
          MAX_NODE_HEIGHT,
        );
        flow.updateNode(action.id, (n) => ({
          ...n,
          width,
          height,
          style: { ...(n.style ?? {}), width, height },
        }));
        break;
      }
      case "update_node_data": {
        const partial: Partial<CanvasNode["data"]> = {};
        if (action.label !== undefined) partial.label = action.label;
        if (action.shape !== undefined) partial.shape = action.shape;
        if (action.colorIndex !== undefined) {
          const pair = colorPair(action.colorIndex);
          partial.color = pair.color;
          partial.foreground = pair.foreground;
        }
        if (Object.keys(partial).length > 0) {
          flow.updateNodeData(action.id, partial);
        }
        break;
      }
      case "delete_node": {
        flow.removeNode(action.id);
        break;
      }
      case "add_edge": {
        flow.addEdge({
          id: action.id,
          type: canvasEdge,
          source: action.source,
          target: action.target,
          data: action.label ? { label: action.label } : {},
        });
        break;
      }
      case "delete_edge": {
        flow.removeEdge(action.id);
        break;
      }
    }
  }
}

function appendCanvasAction(
  actions: DesignAction[],
  action: DesignAction,
): { ok: true } | { ok: false; message: string } {
  if (actions.length >= MAX_ACTIONS) {
    return {
      ok: false,
      message: `Canvas action limit (${MAX_ACTIONS}) reached. Call finishDesign with your summary.`,
    };
  }
  actions.push(action);
  return { ok: true };
}

function createDesignTools(state: {
  actions: DesignAction[];
  summary: { current: string };
}) {
  return {
    addNode: tool({
      description:
        "Add a new node on the grid. Use stable unique ids (e.g. ws-server, redis-pubsub).",
      inputSchema: addNodeInputSchema,
      execute: async (input) => {
        const r = appendCanvasAction(state.actions, { type: "add_node", ...input });
        return r.ok ? { recorded: state.actions.length } : { error: r.message };
      },
    }),
    moveNode: tool({
      description: "Move an existing node to a new grid column/row.",
      inputSchema: moveNodeInputSchema,
      execute: async (input) => {
        const r = appendCanvasAction(state.actions, { type: "move_node", ...input });
        return r.ok ? { recorded: state.actions.length } : { error: r.message };
      },
    }),
    resizeNode: tool({
      description: "Change width/height of a node in pixels (within allowed min/max).",
      inputSchema: resizeNodeInputSchema,
      execute: async (input) => {
        const r = appendCanvasAction(state.actions, { type: "resize_node", ...input });
        return r.ok ? { recorded: state.actions.length } : { error: r.message };
      },
    }),
    updateNodeData: tool({
      description: "Update label, shape, and/or color index of an existing node.",
      inputSchema: updateNodeDataInputSchema,
      execute: async (input) => {
        const r = appendCanvasAction(state.actions, { type: "update_node_data", ...input });
        return r.ok ? { recorded: state.actions.length } : { error: r.message };
      },
    }),
    deleteNode: tool({
      description: "Remove a node by id. Also delete incident edges with deleteEdge.",
      inputSchema: deleteNodeInputSchema,
      execute: async (input) => {
        const r = appendCanvasAction(state.actions, { type: "delete_node", ...input });
        return r.ok ? { recorded: state.actions.length } : { error: r.message };
      },
    }),
    addEdge: tool({
      description: "Connect two nodes (directed edge). source and target must be node ids.",
      inputSchema: addEdgeInputSchema,
      execute: async (input) => {
        const r = appendCanvasAction(state.actions, { type: "add_edge", ...input });
        return r.ok ? { recorded: state.actions.length } : { error: r.message };
      },
    }),
    deleteEdge: tool({
      description: "Remove an edge by id.",
      inputSchema: deleteEdgeInputSchema,
      execute: async (input) => {
        const r = appendCanvasAction(state.actions, { type: "delete_edge", ...input });
        return r.ok ? { recorded: state.actions.length } : { error: r.message };
      },
    }),
    finishDesign: tool({
      description:
        "Call exactly once when you are done editing the canvas. Supplies the summary shown to users.",
      inputSchema: finishDesignInputSchema,
      execute: async ({ summary }) => {
        state.summary.current = summary;
        return { ok: true as const, actionsRecorded: state.actions.length };
      },
    }),
  };
}

export type DesignAgentPayload = {
  prompt: string;
  roomId: string;
  userId: string;
};

export const designAgent = task({
  id: "design-agent",
  maxDuration: 180,
  run: async (payload: DesignAgentPayload, { ctx }) => {
    const { prompt, roomId, userId } = payload;
    const runId = ctx.run.id;

    logger.info("design-agent input", { runId, roomId, userId });

    const liveblocks = getLiveblocksClient();

    await pushAiStatusFeed(liveblocks, roomId, {
      runId,
      userId,
      phase: "start",
      message: "Reading the current canvas…",
    });

    let snapshot: CanvasSnapshot = { nodes: [], edges: [] };
    try {
      snapshot = await readSnapshot(liveblocks, roomId);
    } catch (error) {
      logger.warn("design-agent: snapshot read failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    await pushAiStatusFeed(liveblocks, roomId, {
      runId,
      userId,
      phase: "processing",
      message: "Designing the architecture with Gemini…",
    });

    const actions: DesignAction[] = [];
    const summaryState = { current: "" };

    try {
      const google = getGoogleAi();
      const tools = createDesignTools({ actions, summary: summaryState });
      const result = await generateText({
        model: google("gemini-2.5-flash"),
        system: buildSystemPrompt(snapshot),
        prompt,
        tools,
        toolChoice: "required",
        stopWhen: [hasToolCall("finishDesign"), stepCountIs(MAX_AGENT_STEPS)],
      });

      if (actions.length === 0) {
        throw new Error(
          result.finishReason === "length"
            ? "Model stopped before applying canvas edits (length)."
            : "Model produced no canvas tool calls.",
        );
      }
    } catch (error) {
      logger.error("design-agent: gemini generateText / tools failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      await pushAiStatusFeed(liveblocks, roomId, {
        runId,
        userId,
        phase: "error",
        message:
          "The AI could not generate a valid design plan. Try a more specific prompt.",
      });
      await broadcastFocus(liveblocks, roomId, {
        runId,
        userId,
        position: null,
      });
      throw error;
    }

    const summary =
      summaryState.current.trim() ||
      "Architecture updated.";

    logger.info("design-agent plan", {
      runId,
      summary,
      actionCount: actions.length,
    });

    await pushAiStatusFeed(liveblocks, roomId, {
      runId,
      userId,
      phase: "processing",
      message: `Applying ${actions.length} canvas change${actions.length === 1 ? "" : "s"}…`,
    });

    try {
      await mutateFlow<CanvasNode, CanvasEdge>(
        { client: liveblocks, roomId },
        async (flow) => {
          applyDesignActions(flow, actions, (position) => {
            void broadcastFocus(liveblocks, roomId, {
              runId,
              userId,
              position,
            });
          });
        },
      );
    } catch (error) {
      logger.error("design-agent: mutateFlow failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      await pushAiStatusFeed(liveblocks, roomId, {
        runId,
        userId,
        phase: "error",
        message: "Failed to apply changes to the canvas. Please try again.",
      });
      await broadcastFocus(liveblocks, roomId, {
        runId,
        userId,
        position: null,
      });
      throw error;
    }

    await broadcastFocus(liveblocks, roomId, {
      runId,
      userId,
      position: null,
    });

    await pushAiStatusFeed(liveblocks, roomId, {
      runId,
      userId,
      phase: "complete",
      message: summary,
    });

    return {
      runId,
      summary,
      actionsApplied: actions.length,
    };
  },
});
