# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase
- Feature 03 (Auth) � complete

## Current Goal
- Feature 04 (TBD)

## Completed

- Feature 01: Design System � shadcn/ui installed and configured, dark-only theme tokens set in `globals.css`, `Button`/`Card`/`Dialog`/`Input`/`Tabs`/`Textarea`/`ScrollArea` added in `components/ui`, `lucide-react` installed, `src/lib/utils.ts` `cn()` helper added. TypeScript compiles clean.
- Feature 02: Editor Chrome � `EditorNavbar` (fixed top bar with `PanelLeftOpen`/`PanelLeftClose` toggle) and `ProjectSidebar` (fixed overlay, left slide-in, `Projects` title + close button, `My Projects`/`Shared` tabs with empty states, full-width `New Project` button) added in `components/editor/`. Dialog pattern prepared via `EditorDialogShell` using existing global tokens. TypeScript and ESLint clean.
- Feature 03: Auth � `@clerk/ui` installed; root layout now wrapped with `ClerkProvider` using Clerk `dark` base theme and appearance variables mapped to existing CSS tokens; public auth routes implemented at `src/app/sign-in/[[...sign-in]]/page.tsx` and `src/app/sign-up/[[...sign-up]]/page.tsx` with responsive two-panel desktop and form-only mobile layout; route protection added in root `proxy.ts` using sign-in/sign-up env var paths as public routes and protecting all other routes; `/` now redirects authenticated users to `/editor` and unauthenticated users to `/sign-in`; `UserButton` added to editor navbar right section.

## In Progress

- None.

## Next Up

- Feature 04 (TBD)

## Open Questions

- None yet.

## Architecture Decisions

- shadcn/ui over Tailwind v4 (CSS-based token config via `@theme inline` in `globals.css`, no `tailwind.config.js`).
- Dark-only theme: all shadcn `:root` variables are mapped to dark workspace values directly.
- Do not modify generated `components/ui/*` files after shadcn installation.
- Use fixed overlay sidebar behavior for editor navigation so canvas layout is not pushed on open/close.
- Standardize future editor dialogs with `EditorDialogShell` and existing global design tokens.
- Route protection is centralized in root `proxy.ts` via Clerk middleware, with sign-in/sign-up URLs sourced from existing Clerk env vars.

## Session Notes

- Using Next.js `16.2.4` with React `19` and Tailwind CSS `v4`.
****- `lucide-react` is installed for iconography.
- Editor chrome primitives now live in `src/components/editor/`: `editor-navbar.tsx`, `project-sidebar.tsx`, `editor-dialog-shell.tsx`.
- Clerk auth primitives now include `ClerkProvider` in root layout, public auth routes, and app-wide protection via `proxy.ts`.