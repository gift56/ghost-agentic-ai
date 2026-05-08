import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EditorDialogShellProps = {
  title: string;
  description?: string;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function EditorDialogShell({
  title,
  description,
  footer,
  children,
  className,
}: EditorDialogShellProps) {
  return (
    <section
      className={cn(
        "w-full max-w-md rounded-xl border border-border bg-(--bg-elevated) p-5 text-foreground shadow-xl",
        className,
      )}
    >
      <header className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>

      {children ? <div className="mt-4">{children}</div> : null}

      {footer ? (
        <footer className="mt-5 flex items-center justify-end gap-2">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
