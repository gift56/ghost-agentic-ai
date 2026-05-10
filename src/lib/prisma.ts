import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * `pg` warns when `sslmode` is require/prefer/verify-ca because those map to
 * verify-full today but will follow libpq semantics in pg v9. Setting verify-full
 * explicitly keeps current behavior and removes the Next.js dev overlay warning.
 */
function normalizeDirectPostgresUrlForPg(connectionString: string): string {
  if (!/^postgres(ql)?:\/\//i.test(connectionString)) {
    return connectionString;
  }
  try {
    const parsed = new URL(connectionString);
    const sslmode = parsed.searchParams.get("sslmode");
    if (!sslmode) {
      return connectionString;
    }
    const mode = sslmode.toLowerCase();
    if (mode === "require" || mode === "prefer" || mode === "verify-ca") {
      parsed.searchParams.set("sslmode", "verify-full");
      return parsed.toString();
    }
    return connectionString;
  } catch {
    return connectionString;
  }
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  if (databaseUrl.startsWith("prisma+postgres://")) {
    return new PrismaClient({
      accelerateUrl: databaseUrl,
    });
  }

  const directUrl = normalizeDirectPostgresUrlForPg(databaseUrl);

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: directUrl }),
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
