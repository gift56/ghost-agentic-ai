import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type AuthFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type AuthShellProps = {
  title: string;
  subtitle: string;
  panelTitle: ReactNode;
  panelDescription: string;
  features: AuthFeature[];
  children: ReactNode;
};

export function AuthShell({
  title,
  subtitle,
  panelTitle,
  panelDescription,
  features,
  children,
}: AuthShellProps) {
  return (
    <main className="flex h-screen overflow-hidden bg-(--bg-base)">
      <section className="hidden w-1/2 flex-col border-r border-(--border-default) bg-(--bg-surface) lg:flex">
        <div className="px-12 pt-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-(--accent-primary)">
              <span className="text-xs leading-none font-bold text-(--bg-base)">G</span>
            </div>
            <span className="text-sm font-semibold text-(--text-primary)">Ghost Agentic AI</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center px-12 py-16">
          <h1 className="mb-5 text-4xl leading-tight font-bold tracking-tight text-(--text-primary)">
            {panelTitle}
          </h1>
          <p className="mb-12 max-w-sm text-base leading-relaxed text-(--text-secondary)">
            {panelDescription}
          </p>

          <ul className="space-y-7">
            {features.map(({ icon: Icon, title: featureTitle, description }) => (
              <li key={featureTitle} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--accent-primary-dim)">
                  <Icon className="h-5 w-5 text-(--accent-primary)" />
                </div>
                <div>
                  <p className="text-sm leading-snug font-semibold text-(--text-primary)">{featureTitle}</p>
                  <p className="mt-1 text-sm leading-snug text-(--text-muted)">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-12 pb-10">
          <p className="text-xs text-(--text-faint)">© 2026 Ghost AI. All rights reserved.</p>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center bg-(--bg-base) p-6 sm:p-8 lg:w-1/2">
        <div className="w-full max-w-md rounded-xl border border-(--border-default) bg-(--bg-surface) p-4 sm:p-6">
          <div className="mb-4 space-y-1">
            <h2 className="text-2xl font-semibold text-(--text-primary)">{title}</h2>
            <p className="text-sm text-(--text-secondary)">{subtitle}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}