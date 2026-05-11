import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { AbortTaskRunError, logger, metadata, task } from "@trigger.dev/sdk";
import { generateText } from "ai";

import {
  generateSpecTaskPayloadSchema,
  type GenerateSpecTaskPayload,
} from "@/lib/ai-spec-schemas";
import { prisma } from "@/lib/prisma";

function getGoogleAi() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return createGoogleGenerativeAI({ apiKey });
}

function buildSpecPrompt(payload: GenerateSpecTaskPayload): string {
  const chatBlock = payload.chatHistory
    .map((m) => `### ${m.role}\n${m.content}`)
    .join("\n\n");

  return [
    "Use the following architecture canvas (nodes and edges) and conversation as the only source of truth.",
    "",
    "## Canvas JSON",
    "```json",
    JSON.stringify({ nodes: payload.nodes, edges: payload.edges }, null, 2),
    "```",
    "",
    "## Chat context",
    chatBlock.length > 0 ? chatBlock : "(no prior messages)",
  ].join("\n");
}

export type GenerateSpecOutput = {
  spec: string;
  projectId: string;
  roomId: string;
  /** Persisted spec row id (Vercel Blob metadata); use with the project download route. */
  specId: string;
};

export const generateSpec = task({
  id: "generate-spec",
  maxDuration: 300,
  run: async (payload: unknown, { ctx }) => {
    const parsed = generateSpecTaskPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      logger.error("generate-spec: invalid payload", {
        issues: parsed.error.flatten(),
      });
      throw new AbortTaskRunError("Invalid generate-spec payload");
    }

    const data = parsed.data;
    const runId = ctx.run.id;

    logger.info("generate-spec input", {
      runId,
      projectId: data.projectId,
      roomId: data.roomId,
      userId: data.userId,
      nodeCount: data.nodes.length,
      edgeCount: data.edges.length,
      chatTurns: data.chatHistory.length,
    });

    metadata.set("phase", "starting").set("status", "running");

    const system = [
      "You are a senior software architect writing a technical specification.",
      "Produce a single Markdown document that describes the system implied by the diagram and chat.",
      "",
      "Requirements:",
      "- Use standard Markdown headings (##, ###) and bullet lists where helpful.",
      "- Cover: overview, key components (mapped to nodes), relationships and data/control flow (mapped to edges),",
      "  integration points, assumptions, and open questions when the diagram is ambiguous.",
      "- Be precise and implementation-oriented, but do not invent major components that are not supported by the canvas or chat.",
      "- If the canvas is empty or nearly empty, state that explicitly and derive only what the chat clearly implies.",
      "- Do not wrap the document in a fenced code block.",
      "- Output nothing except the Markdown specification body.",
    ].join("\n");

    metadata.set("phase", "generating");

    let text: string;
    try {
      const google = getGoogleAi();
      const result = await generateText({
        model: google("gemini-2.5-flash"),
        system,
        prompt: buildSpecPrompt(data),
        maxOutputTokens: 8192,
      });
      text = result.text.trim();
    } catch (error) {
      logger.error("generate-spec: Gemini generateText failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      metadata.set("phase", "error").set("status", "failed");
      throw error;
    }

    if (!text) {
      metadata.set("phase", "error").set("status", "failed");
      throw new Error("Model returned an empty specification");
    }

    metadata.set("phase", "persisting");

    const specId = randomUUID();
    try {
      const blob = await put(`specs/${data.projectId}/${specId}.md`, text, {
        access: "private",
        addRandomSuffix: false,
        contentType: "text/markdown; charset=utf-8",
        allowOverwrite: true,
      });

      await prisma.projectSpec.create({
        data: {
          id: specId,
          projectId: data.projectId,
          filePath: blob.url,
        },
      });
    } catch (error) {
      logger.error("generate-spec: failed to persist spec to blob/Prisma", {
        error: error instanceof Error ? error.message : String(error),
      });
      metadata.set("phase", "error").set("status", "failed");
      throw error;
    }

    metadata.set("phase", "complete").set("status", "succeeded");

    logger.info("generate-spec complete", {
      runId,
      projectId: data.projectId,
      specId,
      specChars: text.length,
    });

    return {
      spec: text,
      projectId: data.projectId,
      roomId: data.roomId,
      specId,
    } satisfies GenerateSpecOutput;
  },
});
