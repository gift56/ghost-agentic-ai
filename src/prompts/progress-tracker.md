# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase
- Feature 13 (Node shape) - completed

## Current Goal
- Feature 14 (Node editing)

## Completed

- Feature 01: Design System - shadcn/ui installed and configured, dark-only theme tokens set in `globals.css`, `Button`/`Card`/`Dialog`/`Input`/`Tabs`/`Textarea`/`ScrollArea` added in `components/ui`, `lucide-react` installed, `src/lib/utils.ts` `cn()` helper added. TypeScript compiles clean.
- Feature 02: Editor Chrome - `EditorNavbar` (fixed top bar with `PanelLeftOpen`/`PanelLeftClose` toggle) and `ProjectSidebar` (fixed overlay, left slide-in, `Projects` title + close button, `My Projects`/`Shared` tabs with empty states, full-width `New Project` button) added in `components/editor/`. Dialog pattern prepared via `EditorDialogShell` using existing global tokens. TypeScript and ESLint clean.
- Feature 03: Auth - `@clerk/ui` installed; root layout now wrapped with `ClerkProvider` using Clerk `dark` base theme and appearance variables mapped to existing CSS tokens; public auth routes implemented at `src/app/sign-in/[[...sign-in]]/page.tsx` and `src/app/sign-up/[[...sign-up]]/page.tsx` with responsive two-panel desktop and form-only mobile layout; route protection added in root `proxy.ts` using sign-in/sign-up env var paths as public routes and protecting all other routes; `/` now redirects authenticated users to `/editor` and unauthenticated users to `/sign-in`; `UserButton` added to editor navbar right section.
- Feature 04: Project Dialogs - `/editor` home now renders minimal centered empty state with heading/description and `New Project` button; `useProjectDialogs` hook added to centralize dialog/form/loading state; create/rename/delete dialogs implemented using `EditorDialogShell` (create with live slug preview, rename prefilled with autofocus and Enter submit, delete destructive confirm only); `ProjectSidebar` now renders mock project lists for `My Projects` and `Shared`, with rename/delete actions visible only for owned projects and hidden for shared; sidebar `New Project` is wired to create dialog; mobile sidebar now includes tappable backdrop scrim to close outside.
- Feature 05: Prisma - `prisma/models/project.prisma` added with `ProjectStatus` enum, `Project` model (Clerk owner ID, name, optional description, `DRAFT`/`ARCHIVED` status, `canvasJsonPath`, timestamps, indexes on owner and creation date), and `ProjectCollaborator` model (project relation with cascade delete, collaborator email, timestamp, unique `projectId/email`, indexes on email and `projectId/createdAt`); cached Prisma singleton added at `lib/prisma.ts` with `DATABASE_URL` branching (`prisma+postgres://` uses Accelerate via `accelerateUrl`, otherwise direct `@prisma/adapter-pg`); first migration applied (`20260509234554_init_project`), client generated, and `npm run build` passing.
- Feature 06: Project APIs - backend routes implemented at `src/app/api/projects/route.ts` (`GET` list current user projects, `POST` create project) and `src/app/api/projects/[projectId]/route.ts` (`PATCH` rename project, `DELETE` delete project); Clerk auth enforced in all handlers (`401` for unauthenticated), mutations enforce strict ownership (`403` for non-owner), project creation defaults missing/blank names to `Untitled Project`, and Prisma `cuid()` ID strategy remains unchanged.
- Feature 07: Wire Editor Home - `/editor` is now a server component that fetches owned/shared project lists via `getEditorHomeProjects` (`src/lib/project-data.ts`) and passes both lists to the sidebar; new `useProjectActions` hook in `src/hooks/use-project-actions.ts` manages dialog state and project mutations (create with short suffix + slugified room ID, rename, delete), calls real APIs, navigates to workspace on create, refreshes on rename/delete, and redirects to `/editor` when deleting the active workspace; sidebar and dialogs are fully wired to real data/actions, including room ID preview in create, prefilled rename, and project name in delete; `POST /api/projects` now accepts optional `id` so project ID and room ID stay aligned.
- Feature 08: Editor Workspace Shell - server route added at `src/app/editor/[roomId]/page.tsx` with pre-render access checks (unauthenticated users redirect to `/sign-in`; missing or unauthorized projects render `AccessDenied`), shared access helpers added in `src/lib/project-access.ts` (current Clerk identity with `userId` + primary email and owner/collaborator project access lookup), new `AccessDenied` state added in `src/components/editor/access-denied.tsx`, and workspace shell UI implemented via `EditorWorkspaceClient` with project title in navbar, share button + AI sidebar toggle placeholders, active room highlighting in sidebar, central dark canvas placeholder, and right AI sidebar placeholder.
- Feature 09: Share Dialog - share workflow implemented for workspace navbar with `Share` opening `ShareDialog`; owners can invite collaborators by email, remove collaborators, view collaborator list, and copy project link with temporary `Copied!` feedback; collaborators can view collaborator list in read-only mode; new API route `src/app/api/projects/[projectId]/collaborators/route.ts` added for list/invite/remove with auth checks and strict owner enforcement on invite/remove; collaborator emails are enriched via Clerk Backend API (`displayName` + `avatarUrl`) with email fallback when Clerk user data is unavailable; workspace access model now includes `isOwner` in `src/lib/project-access.ts` and is passed through `src/app/editor/[roomId]/page.tsx` to client UI.
- Feature 10: Liveblocks setup - root `liveblocks.config.ts` defines `Presence` (cursor + `isThinking`) and `UserMeta` (id, name, avatar, cursor color); cached Liveblocks Node client and `userIdToCursorColor` helper in `src/lib/liveblocks.ts`; `POST /api/liveblocks-auth` requires Clerk auth, verifies project access via `getAccessibleProjectByRoomId`, ensures the Liveblocks room with `getOrCreateRoom` using the project ID as the room ID, returns an access session with user name, avatar, and deterministic cursor color (`403` when project access is denied); `@liveblocks/node` added for server auth; `npm run build` passing.
- Feature 11: Base canvas - workspace page remains server-side; `EditorWorkspaceCanvas` client wrapper adds `LiveblocksProvider` (`/api/liveblocks-auth`), `RoomProvider` with room ID, `initialPresence` (`cursor: null`, `isThinking: false`), typed `initialStorage` with empty `flow` (`LiveObject` + `LiveMap` nodes/edges), `ClientSideSuspense` loading UI, and `react-error-boundary` error fallback; `EditorWorkspaceCanvasFlow` wires `useLiveblocksFlow` (`suspense: true`, empty initial nodes/edges) into `ReactFlow` with `ConnectionMode.Loose`, `fitView`, `MiniMap`, dot `Background`, and `Cursors`; shared types in `src/types/canvas.ts` (`CanvasNodeData` label/color/shape, `canvasNode` / `canvasEdge`); minimal `canvasNode` / `canvasEdge` wiring (default-like node shell + `BezierEdge`) without controls, persistence, or AI behavior; `liveblocks.config.ts` `Storage` now types `flow` as `LiveblocksFlow<CanvasNode, CanvasEdge>`; `react-error-boundary` dependency added; `npm run build` passing.
- Feature 12: Shape panel - bottom-center pill `Panel` with draggable Lucide shape buttons (`EditorCanvasShapePanel`); drag payload via `application/x-ghost-canvas-shape` + `text/plain` JSON (`CanvasShapeDragPayload`: shape + default width/height from `src/lib/canvas-shape-defs.ts`); `ReactFlow` `onDragOver`/`onDrop` with `onInit` ref to `screenToFlowPosition`, `onNodesChange` add nodes with ids `${shape}-${timestamp}-${counter}`, empty label, `DEFAULT_CANVAS_NODE_COLOR`, `canvasNode` type and `style` dimensions; `WorkspaceCanvasNode` renders all shapes as bordered rectangles with centered label; `npm run build` passing.
- Feature 13: Node shape - `CanvasNodeShapeView` (`canvas-node-shape-view.tsx`) renders rectangle/pill/circle with CSS (`rounded-none` / `rounded-full`) and diamond/hexagon/cylinder with scaled SVG (`viewBox` + `preserveAspectRatio="none"`, `vectorEffect="nonScalingStroke"`); borders use subtle zinc at rest and brighter zinc when `selected`; `WorkspaceCanvasNode` composes shape view with centered label overlay and unchanged handles; shape panel uses empty `canvas` drag image plus `createPortal` ghost (`CanvasNodeShapeView` with `ghost`, default fill, cursor-centered position on `drag`/`dragStart`, cleared on `dragEnd`) without changing drop/create logic; `npm run build` passing.

## In Progress

- None.

## Next Up

- Feature 14 (Node editing)

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
- Workspace route access is enforced server-side via `lib/project-access.ts` and unauthorized/missing projects resolve to a shared `AccessDenied` UI.
- Share access policy: collaborator listing is available to users with project access (owner or collaborator), while invite/remove actions are enforced as owner-only on the server.
- Liveblocks: project ID is the Liveblocks room ID; auth uses access tokens (`prepareSession` + `session.allow` for the room) after Clerk + `project-access` checks; rooms are provisioned with `getOrCreateRoom` and `defaultAccesses: ["room:write"]` for the access-token model; `LIVEBLOCKS_SECRET_KEY` is required at runtime.
- Collaborative canvas: `@liveblocks/react-flow` stores the diagram under Storage key `flow` (typed in `liveblocks.config.ts`); the workspace canvas is mounted only on the client with `LiveblocksProvider` + `RoomProvider`, `ClientSideSuspense` for loading, and an error boundary for connection failures; React Flow state uses `useLiveblocksFlow` with shared `CanvasNode` / `CanvasEdge` types from `src/types/canvas.ts`.
- Shape palette: new nodes are added through Liveblocks-aware `onNodesChange` add mutations (not `addNodes`) so storage stays authoritative; palette drag payload is versioned JSON with explicit default sizes per shape.
- Node visuals: per-shape rendering is shared via `CanvasNodeShapeView`; palette drag uses a portal ghost only (native drag preview suppressed) so drop behavior and `onNodesChange` adds stay unchanged.

## Session Notes

- Using Next.js `16.2.4` with React `19` and Tailwind CSS `v4`.
- `lucide-react` is installed for iconography.
- Editor chrome primitives now live in `src/components/editor/`: `editor-navbar.tsx`, `project-sidebar.tsx`, `editor-layout.tsx`, `editor-dialog-shell.tsx`.
- Clerk auth primitives now include `ClerkProvider` in root layout, public auth routes, and app-wide protection via `proxy.ts`.
- Feature 05 spec source: `src/prompts/features/05-prisma.md` (models, client singleton branching, migration/client generation, build verification).
- Feature 05 migration applied to DB and filesystem at `prisma/migrations/20260509234554_init_project/migration.sql`.
- Feature 06 spec source: `src/prompts/features/06-project-apis.md` (list/create/rename/delete routes, owner checks, and auth status handling).
- Feature 07 spec source: `src/prompts/features/07-wire-editor-home.md`.
- Feature 08 spec source: `src/prompts/features/08-editor-workspace-shell.md`.
- Feature 09 spec source: `src/prompts/features/09-share-dialog.md`.
- Feature 10 spec source: `src/prompts/features/10-liveblocks-setup.md`.
- Feature 11 spec source: `src/prompts/features/11-base-canvas.md`.
- Feature 12 spec source: `src/prompts/features/12-shape-panel.md`.
- Feature 13 spec source: `src/prompts/features/13-node-shape.md`.
