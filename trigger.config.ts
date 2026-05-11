import { syncEnvVars } from "@trigger.dev/build/extensions/core";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";
import { defineConfig } from "@trigger.dev/sdk";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

const TASK_ENV_VAR_NAMES = [
  "DATABASE_URL",
  "GEMINI_API_KEY",
  "LIVEBLOCKS_SECRET_KEY",
  "BLOB_READ_WRITE_TOKEN",
] as const;

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF!,
  runtime: "node",
  dirs: ["./src/trigger"],
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  build: {
    extensions: [
      prismaExtension({ mode: "modern" }),
      syncEnvVars(() =>
        TASK_ENV_VAR_NAMES.flatMap((name) => {
          const value = process.env[name];
          return value ? [{ name, value }] : [];
        }),
      ),
    ],
  },
  maxDuration: 3600,
});
