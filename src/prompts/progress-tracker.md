# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase
- Feature 07 (Wire Editor Home) - completed

## Current Goal
- Feature 08 (TBD)

## Completed

- Feature 01: Design System - shadcn/ui installed and configured, dark-only theme tokens set in `globals.css`, `Button`/`Card`/`Dialog`/`Input`/`Tabs`/`Textarea`/`ScrollArea` added in `components/ui`, `lucide-react` installed, `src/lib/utils.ts` `cn()` helper added. TypeScript compiles clean.
- Feature 02: Editor Chrome - `EditorNavbar` (fixed top bar with `PanelLeftOpen`/`PanelLeftClose` toggle) and `ProjectSidebar` (fixed overlay, left slide-in, `Projects` title + close button, `My Projects`/`Shared` tabs with empty states, full-width `New Project` button) added in `components/editor/`. Dialog pattern prepared via `EditorDialogShell` using existing global tokens. TypeScript and ESLint clean.
- Feature 03: Auth - `@clerk/ui` installed; root layout now wrapped with `ClerkProvider` using Clerk `dark` base theme and appearance variables mapped to existing CSS tokens; public auth routes implemented at `src/app/sign-in/[[...sign-in]]/page.tsx` and `src/app/sign-up/[[...sign-up]]/page.tsx` with responsive two-panel desktop and form-only mobile layout; route protection added in root `proxy.ts` using sign-in/sign-up env var paths as public routes and protecting all other routes; `/` now redirects authenticated users to `/editor` and unauthenticated users to `/sign-in`; `UserButton` added to editor navbar right section.
- Feature 04: Project Dialogs - `/editor` home now renders minimal centered empty state with heading/description and `New Project` button; `useProjectDialogs` hook added to centralize dialog/form/loading state; create/rename/delete dialogs implemented using `EditorDialogShell` (create with live slug preview, rename prefilled with autofocus and Enter submit, delete destructive confirm only); `ProjectSidebar` now renders mock project lists for `My Projects` and `Shared`, with rename/delete actions visible only for owned projects and hidden for shared; sidebar `New Project` is wired to create dialog; mobile sidebar now includes tappable backdrop scrim to close outside.
- Feature 05: Prisma - `prisma/models/project.prisma` added with `ProjectStatus` enum, `Project` model (Clerk owner ID, name, optional description, `DRAFT`/`ARCHIVED` status, `canvasJsonPath`, timestamps, indexes on owner and creation date), and `ProjectCollaborator` model (project relation with cascade delete, collaborator email, timestamp, unique `projectId/email`, indexes on email and `projectId/createdAt`); cached Prisma singleton added at `lib/prisma.ts` with `DATABASE_URL` branching (`prisma+postgres://` uses Accelerate via `accelerateUrl`, otherwise direct `@prisma/adapter-pg`); first migration applied (`20260509234554_init_project`), client generated, and `npm run build` passing.
- Feature 06: Project APIs - backend routes implemented at `src/app/api/projects/route.ts` (`GET` list current user projects, `POST` create project) and `src/app/api/projects/[projectId]/route.ts` (`PATCH` rename project, `DELETE` delete project); Clerk auth enforced in all handlers (`401` for unauthenticated), mutations enforce strict ownership (`403` for non-owner), project creation defaults missing/blank names to `Untitled Project`, and Prisma `cuid()` ID strategy remains unchanged.
- Feature 07: Wire Editor Home - `/editor` is now a server component that fetches owned/shared project lists via `getEditorHomeProjects` (`src/lib/project-data.ts`) and passes both lists to the sidebar; new `useProjectActions` hook in `src/hooks/use-project-actions.ts` manages dialog state and project mutations (create with short suffix + slugified room ID, rename, delete), calls real APIs, navigates to workspace on create, refreshes on rename/delete, and redirects to `/editor` when deleting the active workspace; sidebar and dialogs are fully wired to real data/actions, including room ID preview in create, prefilled rename, and project name in delete; `POST /api/projects` now accepts optional `id` so project ID and room ID stay aligned.

## In Progress

- Feature 08 (TBD)

## Next Up

- Feature 08 (TBD)

## Open Questions

- None yet.

## Architecture Decisions

- shadcn/ui over Tailwind v4 (CSS-based token config via `@theme inline` in `globals.css`, no `tailwind.config.js`).
- Dark-only theme: all shadcn `:root` variables are mapped to dark workspace values directly.
- Do not modify generated `components/ui/*` files after shadcn installation.
- Use fixed overlay sidebar behavior for editor navigation so canvas layout is not pushed on open/close.
- Standardize future editor dialogs with `EditorDialogShell` and existing global design tokens.
- Route protection is centralized in root `proxy.ts` via Clerk middleware, with sign-in/sign-up URLs sourced from existing Clerk env vars.
- Prisma client initialization is centralized in `lib/prisma.ts` as a development-cached singleton and branches by `DATABASE_URL` (`prisma+postgres://` uses Accelerate; otherwise use direct `@prisma/adapter-pg`).
- Project API ownership policy: only project owners can rename/delete, and unauthorized/non-owner failures return `401`/`403` respectively.
- Editor home project data is fetched server-side via `getEditorHomeProjects` and passed into client UI as owned/shared lists to avoid client-side initial fetch.

## Session Notes

- Using Next.js `16.2.4` with React `19` and Tailwind CSS `v4`.
- `lucide-react` is installed for iconography.
- Editor chrome primitives now live in `src/components/editor/`: `editor-navbar.tsx`, `project-sidebar.tsx`, `editor-layout.tsx`, `editor-dialog-shell.tsx`.
- Clerk auth primitives now include `ClerkProvider` in root layout, public auth routes, and app-wide protection via `proxy.ts`.
- Feature 05 spec source: `src/prompts/features/05-prisma.md` (models, client singleton branching, migration/client generation, build verification).
- Feature 05 migration applied to DB and filesystem at `prisma/migrations/20260509234554_init_project/migration.sql`.
- Feature 06 spec source: `src/prompts/features/06-project-apis.md` (list/create/rename/delete routes, owner checks, and auth status handling).
- Feature 07 spec source: `src/prompts/features/07-wire-editor-home.md`.
