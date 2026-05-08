# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase
- Feature 02 (Editor Chrome) — complete

## Current Goal
- Feature 03 (TBD)

## Completed

- Feature 01: Design System — shadcn/ui installed and configured, dark-only theme tokens set in `globals.css`, `Button`/`Card`/`Dialog`/`Input`/`Tabs`/`Textarea`/`ScrollArea` added in `components/ui`, `lucide-react` installed, `src/lib/utils.ts` `cn()` helper added. TypeScript compiles clean.
- Feature 02: Editor Chrome — `EditorNavbar` (fixed top bar with `PanelLeftOpen`/`PanelLeftClose` toggle) and `ProjectSidebar` (fixed overlay, left slide-in, `Projects` title + close button, `My Projects`/`Shared` tabs with empty states, full-width `New Project` button) added in `components/editor/`. Dialog pattern prepared via `EditorDialogShell` using existing global tokens. TypeScript and ESLint clean.

## In Progress

- None.

## Next Up

- TBD

## Open Questions

- None yet.

## Architecture Decisions

- shadcn/ui over Tailwind v4 (CSS-based token config via `@theme inline` in `globals.css`, no `tailwind.config.js`).
- Dark-only theme: all shadcn `:root` variables are mapped to dark workspace values directly.
- Do not modify generated `components/ui/*` files after shadcn installation.
- Use fixed overlay sidebar behavior for editor navigation so canvas layout is not pushed on open/close.
- Standardize future editor dialogs with `EditorDialogShell` and existing global design tokens.

## Session Notes

- Using Next.js `16.2.4` with React `19` and Tailwind CSS `v4`.
- `lucide-react` is installed for iconography.
- Editor chrome primitives now live in `src/components/editor/`: `editor-navbar.tsx`, `project-sidebar.tsx`, `editor-dialog-shell.tsx`.
