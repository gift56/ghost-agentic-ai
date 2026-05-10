import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { userIdToCursorColor } from "@/lib/cursor-color";

type ClerkUserResource = Awaited<
  ReturnType<
    Awaited<ReturnType<typeof clerkClient>>["users"]["getUser"]
  >
>;

function resolveDisplayName(user: ClerkUserResource): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (fullName) {
    return fullName;
  }
  if (user.username) {
    return user.username;
  }
  if (user.primaryEmailAddress?.emailAddress) {
    return user.primaryEmailAddress.emailAddress;
  }
  return "Anonymous";
}

export async function POST(request: Request) {
  const { userId: callerId } = await auth();

  if (!callerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    userIds?: unknown;
  } | null;

  const raw = body?.userIds;
  if (!Array.isArray(raw)) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  const userIds = raw.filter((id): id is string => typeof id === "string");

  const client = await clerkClient();

  const users = await Promise.all(
    userIds.map(async (id) => {
      const color = userIdToCursorColor(id);
      try {
        const user = await client.users.getUser(id);
        return {
          name: resolveDisplayName(user),
          avatar: user.imageUrl ?? "",
          color,
        };
      } catch {
        return {
          name: "Unknown",
          avatar: "",
          color,
        };
      }
    }),
  );

  return NextResponse.json({ users });
}
