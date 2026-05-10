import Link from "next/link";
import { Lock } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <section className="flex min-h-screen items-center justify-center px-6">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-full border border-border bg-(--bg-subtle)">
          <Lock className="text-muted-foreground" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-foreground">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have access to this project, or it no longer exists.
        </p>
        <Link href="/editor" className={`${buttonVariants()} mt-6`}>
          Back to editor
        </Link>
      </div>
    </section>
  );
}
