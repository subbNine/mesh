# Mesh — PRD v3.0

**Version:** v3.0 · **Date:** April 2026 · **Author:** Prince · **Status:** Draft

> This document extends Mesh PRD v1.0 and v2.0 (due dates, my assignments, activity feed, docs & files). All prior specs remain in effect. This document specifies net-new features only.

---

## Features in this document

| # | Feature | Effort | Priority |
|---|---------|--------|----------|
| F-06 | Task dependencies | Medium | High |
| F-07 | Multiple assignees on a task | Low | Medium |
| F-08 | Task templates | Medium | Medium |
| F-09 | @mentions in canvas text elements | Low | High |
| F-10 | Subtasks (checklist) | Low | High |
| F-11 | Project progress indicator | Low | High |
| F-12 | Duplicate task | Low | Medium |
| F-13 | Global search | Medium | High |
| F-14 | Emoji reactions on comments | Low | Medium |
| F-15 | Workspace member directory | Low | Low |

---

## 1. Overview

This PRD covers ten features that collectively move Mesh from a task execution tool into a more complete work operating system for small startup teams. The features fall into three buckets:

**Structural work management** — dependencies, subtasks, templates, multiple assignees. These close the gap between Mesh and tools like Linear for teams doing product or engineering work.

**Visibility and navigation** — project progress, global search, member directory. These answer the "how are we doing?" and "where is that thing?" questions that grow more painful as the workspace scales.

**Communication quality** — @mentions in canvas, emoji reactions. These make the canvas itself and the comment system richer communication surfaces with minimal added complexity.

---

## 2. F-06 — Task dependencies

**Effort:** Medium · **Priority:** High

### 2.1 Problem

Tasks in Mesh exist in isolation. There is no way to express that one task cannot start until another is complete, or that completing a task unblocks downstream work. Startup engineering and product teams hit this constantly — "we can't build the frontend until the API design is approved", "the launch task is blocked until QA is done." Without dependency awareness, teams track this in their heads or in Slack, which means it gets lost.

### 2.2 Concepts

A dependency relationship between two tasks is **bidirectional** and consists of two roles:

- **Blocks** — this task must be completed before the other task can proceed
- **Depends on** — this task cannot proceed until the other task is completed

These are two sides of the same relationship. If Task A blocks Task B, then Task B depends on Task A. Storing one record captures both directions.

A task can have multiple dependencies (blocks many, depends on many).

A **blocked task** is any task that has at least one unresolved "depends on" relationship where the upstream task is not yet `done`.

### 2.3 Behaviour

#### Creating a dependency

- From the task card (hover state): a link/chain icon appears alongside the calendar icon. Clicking opens a dependency modal.
- From the canvas top bar: a "Dependencies" field is shown (see section 2.4). Clicking it opens the same modal.
- The dependency modal has two sections:
  - **This task blocks:** search and select tasks that this task blocks
  - **This task depends on:** search and select tasks that this task depends on
- Task search is scoped to the current project (cross-project dependencies are out of scope for MVP).
- Circular dependencies are prevented — if Task A depends on Task B, you cannot make Task B depend on Task A. Show a validation error: "This would create a circular dependency."
- A dependency is created immediately on selection (no separate save button).

#### Task card — blocked state

- A task that is currently blocked (has unresolved upstream dependencies) shows a **lock icon** in the top-left corner of the task card.
- The lock icon is amber if the blocking task is in progress, red if it is still todo.
- Clicking the lock icon opens a **dependency popup** anchored to the card:
  - Title: "This task is blocked"
  - Lists each blocking task: thumbnail, title, status badge, assignee avatar
  - Lists each task this task blocks (if any): same format, under a "This task blocks" heading
  - Each task row is clickable — clicking navigates to that task's canvas
  - A "Manage dependencies" link at the bottom opens the full dependency modal
- Non-blocked tasks with dependencies (e.g. this task blocks something else) show a **chain icon** (not a lock) on the card in a muted style, indicating there is a dependency relationship without implying blockage.

#### Canvas top bar — dependency indicator

- In the canvas top bar, a "Dependencies" field sits alongside the status badge and due date.
- If no dependencies: field is hidden (not shown to keep the top bar clean).
- If dependencies exist: show a label like "Blocks 2" or "Blocked by 1" or both, with the chain/lock icon.
- Clicking the Dependencies field opens a **dependency dropdown** (not a modal — inline dropdown panel below the top bar):
  - Two sections: "Blocked by" and "Blocks"
  - Each dependency listed as a row: status badge + task title + assignee avatar + "→ Open task" link
  - "→ Open task" navigates directly to that task's canvas (same tab)
  - At the bottom: "+ Add dependency" opens the full dependency modal
  - The dropdown is dismissible by clicking outside or pressing Escape

#### Unblocking behaviour

- When a blocking task is moved to `done`, all tasks that depended on it are re-evaluated.
- If a previously blocked task now has no unresolved upstream dependencies, its lock icon is removed.
- The previously blocked task's assignee receives an in-app notification: "'{blocking task title}' is done. '{your task title}' is now unblocked."

### 2.4 Data model changes

`task_dependencies` table:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | primary key |
| `blockingTaskId` | uuid | FK → tasks.id, onDelete CASCADE — the task that must be done first |
| `blockedTaskId` | uuid | FK → tasks.id, onDelete CASCADE — the task that cannot proceed |
| `createdBy` | uuid | FK → users.id |
| `createdAt` | timestamp | default now |
| UNIQUE | | on `(blockingTaskId, blockedTaskId)` |

- Index on `blockingTaskId` for "what does this task block?" queries
- Index on `blockedTaskId` for "what is this task blocked by?" queries
- `ITask` in shared types gains two computed fields: `blockedBy: ITaskDependency[]`, `blocks: ITaskDependency[]`

New shared type `ITaskDependency`:
```
{
  id: string
  blockingTaskId: string
  blockingTask: { id, title, status, snapshotUrl, assignee: IUser | null }
  blockedTaskId: string
  blockedTask: { id, title, status, snapshotUrl, assignee: IUser | null }
  createdBy: string
  createdAt: string
}
```

### 2.5 API changes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/tasks/:taskId/dependencies` | Returns `{ blockedBy: ITaskDependency[], blocks: ITaskDependency[] }` |
| `POST` | `/tasks/:taskId/dependencies` | Body: `{ blocksTaskId?: string, dependsOnTaskId?: string }` — creates one dependency record |
| `DELETE` | `/dependencies/:dependencyId` | Removes a dependency relationship |

- `GET /projects/:projectId/tasks` response: include `isBlocked: boolean`, `dependencyCount: number` per task (for card rendering without a separate round-trip)
- `GET /tasks/:taskId` response: include full `blockedBy` and `blocks` arrays

### 2.6 Frontend changes

- `TaskCard`: add lock icon (blocked) or chain icon (has dependencies, not blocked) to top-left
- `DependencyPopup.tsx` — anchored popup on card lock/chain icon click
- `DependencyModal.tsx` — full modal for creating/removing dependencies, with task search
- `CanvasTopBar`: add Dependencies field, hidden when no dependencies
- `DependencyDropdown.tsx` — inline dropdown panel in canvas top bar
- `task.store`: add `fetchDependencies(taskId)`, `createDependency`, `deleteDependency`
- Notification handling: new notification type `task_unblocked`

---

## 3. F-07 — Multiple assignees on a task

**Effort:** Low · **Priority:** Medium

### 3.1 Problem

The MVP enforces a single assignee per task. In small startup teams where roles overlap, two or three people frequently share ownership of a canvas task — a designer and an engineer co-owning a feature task, or two engineers pairing on an integration. The current model forces teams to either pick one person (losing visibility for the other) or duplicate tasks (creating noise).

### 3.2 Behaviour

- A task can have between 0 and 5 assignees (cap of 5 keeps the UI clean and reflects the small-team target).
- The assignee selector in the task canvas top bar becomes a multi-select: clicking it shows a checklist of project members, each with a checkbox. Currently selected assignees have a checked state.
- Selecting or deselecting a member updates the assignment immediately (optimistic update).
- The task card shows up to 3 assignee avatars stacked/overlapping. If more than 3, show "+N" badge.
- In the "My work" view (F-02), a task appears in the list for every user who is assigned to it.
- Notifications for assignment: each newly added assignee receives an `assigned` notification. Removed assignees receive no notification (no noise for removals).
- Filtering by assignee in the project task grid: show tasks where the selected user is any one of the assignees (not all assignees).

### 3.3 Data model changes

- Replace `tasks.assigneeId` (single FK) with a new join table `task_assignees`:

`task_assignees` table:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | primary key |
| `taskId` | uuid | FK → tasks.id, onDelete CASCADE |
| `userId` | uuid | FK → users.id, onDelete CASCADE |
| `assignedBy` | uuid | FK → users.id |
| `assignedAt` | timestamp | default now |
| UNIQUE | | on `(taskId, userId)` |

- `tasks.assigneeId` column is dropped via migration
- `ITask` in shared types: replace `assigneeId: string | null` and `assignee: IUser | null` with `assignees: IUser[]`

> **Migration note:** Write a migration that reads the existing `assigneeId` on each task and creates a `task_assignees` row for it before dropping the column. Do not lose existing assignment data.

### 3.4 API changes

- `GET /tasks/:taskId` — response includes `assignees: IUser[]` instead of `assignee`
- `GET /projects/:projectId/tasks` — same, `assignees` array per task
- `POST /tasks/:taskId/assignees` — body: `{ userId: string }` — add one assignee
- `DELETE /tasks/:taskId/assignees/:userId` — remove one assignee
- `PATCH /tasks/:taskId` — remove `assigneeId` field, assignment now managed via the dedicated endpoints above
- `GET /users/me/assignments` (F-02) — query now joins `task_assignees` instead of `tasks.assigneeId`
- Filter `GET /projects/:projectId/tasks?assigneeId=` — queries `task_assignees` join

### 3.5 Frontend changes

- `AssigneeSelector.tsx` — refactor from single-select to multi-select checklist popover
- `TaskCard`: replace single avatar with stacked avatars (up to 3, then +N)
- `CanvasTopBar`: update assignee field to show stacked avatars, multi-select on click
- `task.store`: add `addAssignee(taskId, userId)`, `removeAssignee(taskId, userId)` actions
- `MyWorkPage` (F-02): query already works if the API returns correctly — no UI changes needed
- `packages/shared` types: update `ITask`

---

## 4. F-08 — Task templates

**Effort:** Medium · **Priority:** Medium

### 4.1 Problem

Many startup teams run the same types of work repeatedly — a feature build always needs a design task, an API task, and a QA task with the same canvas structure. A bug investigation always starts with the same canvas layout: reproduction steps, root cause, fix. Currently, every new task starts from a blank canvas, and teams manually recreate the same structure each time. This is friction that compounds at scale.

### 4.2 Concepts

A **template** is a named, reusable canvas configuration. It is stored at the **workspace level** and is available across all projects in that workspace.

When a user creates a task from a template, the canvas content (all element positions, sizes, text blocks) is copied as-is into the new task's canvas. The task metadata (title, status, assignee, due date) is not part of the template — the user sets those when creating the task.

### 4.3 Behaviour

#### Creating a template

Two ways to create a template:

**From an existing task (save as template):**
- In the canvas top bar, a "..." overflow menu contains "Save as template".
- Clicking it opens a modal: enter a template name and optional description.
- On save, a snapshot of the current Yjs canvas state is stored as the template's canvas content.
- The original task is unchanged.

**From scratch:**
- In workspace settings, a "Templates" section lists all workspace templates.
- "+ New template" opens a blank canvas editor (same Konva/Yjs canvas, but scoped to template editing, not a real task).
- The template canvas editor has the same toolbar as a task canvas (text, image) but no comments, no presence, no snapshot upload.
- Template is saved manually with a "Save template" button.

#### Using a template

- When creating a new task (from the "+ New task" button on any project page), the `NewTaskModal` gains a "Start from template" option.
- Clicking it shows a template picker: a grid of template cards showing template name, description, and a thumbnail of the template canvas.
- Selecting a template and clicking "Create task" creates the task and copies the template's Yjs canvas state into the new task's `canvas_documents` record.
- The user can still edit the task title, status, assignee, and due date in the modal before creating.
- Templates are optional — the default is still a blank canvas.

#### Managing templates

- Workspace settings → Templates page: lists all templates with name, description, thumbnail, creator, and created date.
- Each template has an "Edit" action (opens the template canvas editor) and a "Delete" action.
- Only workspace owners and workspace admins can delete templates. Any member can create them.
- Templates are not versioned in MVP — editing a template does not affect tasks already created from it.

### 4.4 Data model changes

`workspace_templates` table:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | primary key |
| `workspaceId` | uuid | FK → workspaces.id, onDelete CASCADE |
| `name` | varchar | max 100 chars |
| `description` | text | nullable |
| `canvasDoc` | bytea | Yjs binary state — same format as canvas_documents.doc |
| `thumbnailUrl` | varchar | R2 URL of a snapshot of the template canvas, nullable |
| `createdBy` | uuid | FK → users.id |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

### 4.5 API changes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/workspaces/:workspaceId/templates` | List all templates (name, description, thumbnailUrl, createdBy, createdAt) |
| `POST` | `/workspaces/:workspaceId/templates` | Create template — body: `{ name, description?, canvasDoc (binary) }` |
| `GET` | `/workspaces/:workspaceId/templates/:templateId` | Get template including canvasDoc binary |
| `PATCH` | `/workspaces/:workspaceId/templates/:templateId` | Update name, description, canvasDoc |
| `DELETE` | `/workspaces/:workspaceId/templates/:templateId` | Delete template |
| `POST` | `/workspaces/:workspaceId/templates/:templateId/thumbnail` | Upload thumbnail — body: `{ dataUrl }` |
| `POST` | `/projects/:projectId/tasks` | Extend existing endpoint — add optional `templateId` to body. If present, copy canvasDoc from template into the new task's canvas_documents record |

### 4.6 Frontend changes

- Workspace settings: new "Templates" page at `/w/:workspaceId/settings/templates`
- `TemplateCard.tsx` — displays template thumbnail, name, description
- `TemplateCanvasEditor.tsx` — stripped-down canvas editor for creating/editing templates (no comments, no presence, no snapshot auto-upload, manual save button)
- `TemplatePicker.tsx` — grid modal shown from `NewTaskModal` when "Start from template" is clicked
- `NewTaskModal`: add "Start from template" section
- `CanvasTopBar`: add "Save as template" to the "..." overflow menu
- `templates.store.ts`: `fetchTemplates`, `createTemplate`, `updateTemplate`, `deleteTemplate`

---

## 5. F-09 — @mentions in canvas text elements

**Effort:** Low · **Priority:** High

### 5.1 Problem

@mentions currently only work in comment bodies. But canvas text elements are active communication surfaces — team members drop text blocks saying "@Tolu please review this section" or "@Prince this needs your input before we proceed." Nothing happens. No notification is sent, no one is alerted. The canvas becomes a communication dead zone for direct callouts.

### 5.2 Behaviour

#### Detection

- When a user finishes editing a text element on the canvas (on blur / exit edit mode), the text content is scanned for @mention patterns: `/@(\w+)/g`
- Matched names are resolved against workspace members by `name` (case-insensitive).
- For each resolved user, a `mentioned` notification is created (same type as comment @mentions).
- Mentions are only processed on edit completion — not on every keystroke.
- Duplicate notifications are suppressed: if the same user is @mentioned in the same text element multiple times across edits, only send one notification per element per session (track last-notified state in the canvas service).

#### Visual treatment in the text element

- Detected @mentions in a text element are highlighted in blue (matching the brand blue) when the element is not in edit mode.
- This is a client-side rendering concern — scan the text content for `@word` patterns matching known workspace member names and wrap them in a styled span.
- In edit mode (textarea overlay), no special treatment — plain text editing.

#### Notification

- Notification type: `mentioned` (reuses existing type from v1.0)
- Notification copy: "{actor name} mentioned you in a canvas element on '{task title}'"
- Clicking the notification navigates to the task canvas. The specific element is not auto-focused (too complex for MVP) — the user lands on the canvas and can find it.

### 5.3 Data model changes

No new tables. The existing `notifications` table handles this with the existing `mentioned` type.

One new field on the notification payload (jsonb or expand the existing notification structure):
- `sourceType`: `'comment' | 'canvas_element'` — so the notification copy can be rendered correctly
- `elementId`: the canvas element id (stored in Yjs, passed through to the notification)

### 5.4 API changes

- New endpoint: `POST /canvas/:taskId/mentions`
  - Called from the frontend after a text element edit is completed
  - Body: `{ elementId: string, text: string }` — the full text content of the element
  - Server parses @mentions, resolves users, creates notifications
  - Returns `{ notified: string[] }` — array of userIds notified
- This keeps mention processing server-side (consistent with how comment @mentions work).

### 5.5 Frontend changes

- In `CanvasStage`, after exiting text element edit mode (on blur): call `POST /canvas/:taskId/mentions` with the element id and updated text
- Text element renderer: scan content for `@word` patterns matching workspace member names, render matched mentions in brand blue
- `canvas.store` or a new `mentions.ts` util: `resolveWorkspaceMentions(text: string, members: IUser[]): string[]`
- `workspace.store`: ensure workspace members are loaded and available for mention resolution on the canvas page (already needed for presence — likely already in store)

---

## 6. F-10 — Subtasks (checklist)

**Effort:** Low · **Priority:** High

### 6.1 Problem

Many canvas tasks are too big to be a single atomic unit of work but not big enough to split into separate canvas tasks. Without subtasks, teams either over-split (many tiny tasks cluttering the grid) or under-split (one massive task that is hard to track progress on). A simple checklist attached to a task solves this cleanly.

### 6.2 Behaviour

#### Accessing subtasks

- On the task card: a progress indicator shows below the assignee avatars — "3 / 5" with a small progress bar. Shown only if the task has at least one subtask.
- In the canvas top bar: a "Subtasks" field shows the same "3 / 5" indicator. Clicking it opens the subtask panel.
- The subtask panel slides in from the right side of the canvas top bar as a dropdown (not a full pane — it sits below the top bar, max 300px wide, max 400px tall, scrollable).

#### Subtask panel

- Lists all subtasks for the task, each as a row: checkbox + text label + delete icon (on hover).
- Checking a subtask marks it complete (strikethrough text, checkbox filled).
- Unchecking reverts it.
- At the bottom of the panel: a text input "Add a subtask..." that creates a new subtask on Enter.
- Subtasks can be reordered by drag-and-drop within the panel (using `@dnd-kit/sortable`).
- No assignee, no due date per subtask — title and done/not-done only.

#### Progress on task card

- Task card progress bar: filled portion = `completedSubtasks / totalSubtasks`.
- Color: gray when < 50% complete, amber when 50–99%, green when 100%.
- When all subtasks are checked, the task does not automatically move to `done` — that is a deliberate manual action. But an in-app toast suggests it: "All subtasks complete. Mark task as done?"

### 6.3 Data model changes

`subtasks` table:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | primary key |
| `taskId` | uuid | FK → tasks.id, onDelete CASCADE |
| `title` | varchar | max 200 chars |
| `isCompleted` | boolean | default false |
| `position` | integer | for ordering |
| `createdBy` | uuid | FK → users.id |
| `createdAt` | timestamp | |
| `completedAt` | timestamp | nullable |

- `ITask` in shared types gains: `subtaskCount: number`, `completedSubtaskCount: number` (for card rendering)
- Full subtask list returned separately via a dedicated endpoint (not bundled into every task response — keeps the task list query lean)

### 6.4 API changes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/tasks/:taskId/subtasks` | Returns all subtasks ordered by position |
| `POST` | `/tasks/:taskId/subtasks` | Body: `{ title: string }` — creates subtask at end of list |
| `PATCH` | `/subtasks/:subtaskId` | Body: `{ title?, isCompleted?, position? }` |
| `DELETE` | `/subtasks/:subtaskId` | Deletes subtask |
| `PATCH` | `/tasks/:taskId/subtasks/reorder` | Body: `{ orderedIds: string[] }` |

- `GET /projects/:projectId/tasks` — include `subtaskCount` and `completedSubtaskCount` per task (for the card progress bar, no extra round-trip)

### 6.5 Frontend changes

- `SubtaskPanel.tsx` — dropdown panel accessible from canvas top bar
- `SubtaskRow.tsx` — checkbox + title + delete, drag handle
- `TaskCard`: add progress bar below assignee avatars (only when `subtaskCount > 0`)
- `CanvasTopBar`: add "Subtasks" field showing count indicator
- `subtasks.store.ts` or extend `task.store`: `fetchSubtasks`, `createSubtask`, `updateSubtask`, `deleteSubtask`, `reorderSubtasks`
- `packages/shared` types: add `subtaskCount` and `completedSubtaskCount` to `ITask`, add `ISubtask` interface

---

## 7. F-11 — Project progress indicator

**Effort:** Low · **Priority:** High

### 7.1 Problem

There is no way to tell at a glance how a project is progressing without opening it and manually counting tasks. Founders and team leads with 4–6 active projects need a lightweight signal — "Project Alpha is 70% done, Project Beta is 20% done" — without a Gantt chart or complex reporting.

### 7.2 Behaviour

#### Project card (workspace projects page)

- Each project card gains a progress bar below the project name.
- Progress = `doneTasks / totalTasks` (tasks with status `done` divided by all tasks in the project).
- Shown as a thin horizontal bar (4px height) + text label: "12 / 30 tasks done".
- Color: gray when 0%, amber when 1–99%, green when 100%.
- If a project has no tasks, show "No tasks yet" instead of a 0% bar.

#### Project detail page header

- At the top of the project detail page, below the project name and description, a progress summary row:
  - "X tasks done · Y in progress · Z todo · W in review"
  - A full-width progress bar showing the breakdown as a segmented bar: done=green, in progress=blue, review=amber, todo=gray.
- This replaces needing to count cards manually when on the project page.

#### My work page (F-02)

- On the "My work" page, each project chip next to a task row shows a tiny progress dot: green if ≥ 75% done, amber if 25–74%, gray if < 25%.

### 7.3 Data model changes

No new tables. Progress is computed at query time from the existing `tasks` table.

Add a `GET /projects/:projectId/stats` endpoint rather than computing in the frontend:
- Response: `{ total: number, done: number, inProgress: number, review: number, todo: number, progressPercent: number }`

For the project card (workspace projects list), include these stats in the `GET /workspaces/:workspaceId/projects` response to avoid N+1 round-trips per project card.

### 7.4 API changes

- `GET /workspaces/:workspaceId/projects` — extend response to include `stats: { total, done, inProgress, review, todo, progressPercent }` per project
- `GET /projects/:projectId` — include the same `stats` object
- New: `GET /projects/:projectId/stats` — dedicated endpoint for refreshing stats without re-fetching the full project

### 7.5 Frontend changes

- `ProjectCard.tsx`: add progress bar and "X / Y tasks done" label
- `ProjectDetailPage`: add progress summary row below project header
- `MyWorkPage`: add progress dot to project chips
- `ProgressBar.tsx` — shared component: props `{ value: number (0–100), segmented?: boolean, segments?: { done, inProgress, review, todo } }`
- `project.store`: extend project objects with stats, update after task status changes (optimistic)

---

## 8. F-12 — Duplicate task

**Effort:** Low · **Priority:** Medium

### 8.1 Problem

Teams frequently need to create a new task that is structurally similar to an existing one — same canvas layout, same status, similar description. Without duplication, they recreate the structure manually every time. Duplicate task is also the primitive that makes templates worthwhile before the templates feature is polished, and it enables a simple form of sprint repetition.

### 8.2 Behaviour

- On the task card (hover state): a duplicate icon appears in the card actions row alongside the existing calendar and dependency icons.
- Clicking "Duplicate" immediately creates a copy of the task in the same project with:
  - Title: "{original title} (copy)"
  - Status: same as the original
  - Assignees: same as the original (if using F-07 multiple assignees)
  - Due date: **not copied** — left null on the duplicate (the original's deadline rarely applies to the copy)
  - Canvas content: full copy of the Yjs canvas state (same as template stamping in F-08)
  - Subtasks: copied with `isCompleted = false` for all (fresh checklist)
  - Dependencies: **not copied** — dependency relationships are task-specific, not structural
  - Comments: **not copied** — comments are contextual to the original task
- The duplicate task is inserted at the top of the same status column (position 0).
- A toast confirms: "Task duplicated. [Open task →]" — the link navigates to the new task's canvas.
- Duplication is also accessible from the canvas top bar "..." overflow menu: "Duplicate this task".

### 8.3 Data model changes

No new tables. Duplication is a server-side copy operation.

### 8.4 API changes

- `POST /tasks/:taskId/duplicate`
  - No request body required
  - Server copies task record, canvas_documents record (Yjs binary), subtasks (with isCompleted reset to false)
  - Returns the new `ITask` object
  - Response includes the new task's id so the frontend can navigate to it or show the toast link

### 8.5 Frontend changes

- `TaskCard`: add duplicate icon to hover actions row
- `CanvasTopBar`: add "Duplicate this task" to "..." overflow menu
- `task.store`: add `duplicateTask(taskId)` action — calls API, prepends result to `tasks` array, shows toast
- `Toast`: add "Open task →" action link support (toasts with a CTA)

---

## 9. F-13 — Global search

**Effort:** Medium · **Priority:** High

### 9.1 Problem

As a workspace grows — more projects, more tasks, more subtasks — there is no way to find anything except by navigating manually through projects. "Where's that task about the payment integration?" requires the user to remember which project it's in and scroll through the task grid. This becomes painful above ~50 tasks and is one of the first things teams complain about as a product matures.

### 9.2 Scope

Search covers the following content, scoped to the current workspace:

| Content type | Searchable fields |
|-------------|-------------------|
| Tasks | title, description |
| Subtasks | title |

Documents (F-04), comment bodies, and canvas text element content are explicitly out of scope for MVP search. Add them in a future iteration.

### 9.3 Behaviour

#### Triggering search

- A search icon in the AppShell top bar (right side). Clicking it opens the search command palette.
- Keyboard shortcut: `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux) — opens from anywhere in the app.
- The palette opens as a centered modal overlay with a text input auto-focused.

#### Search results

- Results appear as the user types, debounced 300ms.
- Results are grouped by type: Tasks first, then Subtasks.
- Each result row:
  - **Task:** task title (with matching term highlighted), project name chip, status badge, assignee avatar
  - **Subtask:** subtask title (highlighted), parent task title in muted text, project name chip
- Maximum 10 results per type shown. A "See all results" link at the bottom of each group navigates to a full results page.
- Clicking a task result navigates to that task's canvas.
- Clicking a subtask result navigates to the parent task's canvas and opens the subtask panel.
- Empty state: "No results for '{query}'" with a muted icon.
- Recent searches: when the palette is open with no query typed, show the last 5 navigated-to items (stored in localStorage).

#### Full results page

- Route: `/w/:workspaceId/search?q=:query`
- Same grouping as the palette but paginated (20 per group, load more).
- Filter sidebar: filter by project, content type (tasks / subtasks), status, assignee.

### 9.4 Implementation — PostgreSQL full-text search

Use PostgreSQL's built-in full-text search (`tsvector` / `tsquery`) rather than adding Elasticsearch or a third-party service. This keeps the infra simple.

- Add a generated `search_vector` column to `tasks`:
  ```sql
  ALTER TABLE tasks ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
    ) STORED;
  CREATE INDEX tasks_search_idx ON tasks USING GIN(search_vector);
  ```
- Add a generated `search_vector` column to `subtasks`:
  ```sql
  ALTER TABLE subtasks ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, ''))) STORED;
  CREATE INDEX subtasks_search_idx ON subtasks USING GIN(search_vector);
  ```
- Query with `websearch_to_tsquery('english', :query)` for natural language query parsing (handles quoted phrases, minus exclusions, etc.).
- Rank results with `ts_rank(search_vector, query)` for relevance ordering.
- Filter results by workspace access (join through projects → workspace_members / project access logic from v1.0).

### 9.5 API changes

- `GET /workspaces/:workspaceId/search?q=:query&type=task|subtask&projectId=&status=&assigneeId=&page=&limit=`
  - Response: `{ tasks: ISearchResult[], subtasks: ISearchResult[], total: number }`
  - `ISearchResult` in shared types: `{ id, type: 'task'|'subtask', title, highlight: string, projectId, projectName, status?, parentTaskId?, parentTaskTitle? }`
  - `highlight` is a snippet of the matched text with `<mark>` tags wrapping the matched terms (generated by PostgreSQL `ts_headline`)

### 9.6 Frontend changes

- `SearchPalette.tsx` — command palette modal, Cmd+K trigger, debounced input, grouped results
- `SearchResultRow.tsx` — single result row for both tasks and subtasks
- `SearchPage.tsx` — full results page at `/w/:workspaceId/search`
- AppShell: add search icon button + Cmd+K global keydown listener
- `search.store.ts`: `query`, `results`, `isLoading`, `recentItems` (localStorage), `search(q)` action
- Highlight rendering: a utility that takes a `highlight` string with `<mark>` tags and renders it safely as JSX

---

## 10. F-14 — Emoji reactions on comments

**Effort:** Low · **Priority:** Medium

### 10.1 Problem

Async comment threads generate noise when team members reply with acknowledgments like "👍", "agreed", "LGTM", or "makes sense." These replies add nothing to the conversation but do bump the reply count and send notifications. Emoji reactions replace acknowledgment replies with a lightweight, no-notification signal. Every async communication tool has converged on this pattern for good reason.

### 10.2 Behaviour

- Reactions are available on **comment threads** (top-level comments, not replies) in the comment pane.
- On hover of a comment thread, a "+" emoji button appears to the right of the comment body.
- Clicking it opens a small emoji picker showing a curated set of 12 reactions (not a full emoji keyboard):
  - 👍 ❤️ 😂 🎉 🙏 👀 ✅ 🔥 💯 😮 😢 🚀
- Clicking an emoji adds the reaction. If the current user has already reacted with that emoji, clicking it again removes their reaction (toggle).
- Reactions are displayed below the comment body as a row of emoji chips: `👍 3  ❤️ 1  ✅ 2`
- Each chip shows the emoji and a count. Hovering the chip shows a tooltip listing the names of users who reacted: "Prince, Tolu, Sade".
- If the current user has reacted with that emoji, the chip has a highlighted background (subtle blue fill).
- Reactions do **not** trigger notifications — this is a core design decision. They are silent acknowledgments.
- Maximum 1 reaction type per user per comment (a user cannot react with both 👍 and ❤️ on the same comment — they can only have one active reaction per comment). This keeps the model simple.

> **Rationale for 1-reaction-per-user limit:** Reduces the data model complexity significantly. In practice, one reaction per comment is the most common usage pattern. This can be relaxed in a future iteration.

### 10.3 Data model changes

`comment_reactions` table:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | primary key |
| `commentId` | uuid | FK → comments.id, onDelete CASCADE |
| `userId` | uuid | FK → users.id, onDelete CASCADE |
| `emoji` | varchar | single emoji character, max 8 bytes |
| `createdAt` | timestamp | default now |
| UNIQUE | | on `(commentId, userId)` — enforces 1 reaction per user per comment |

- `IComment` in shared types gains: `reactions: ICommentReaction[]`
- `ICommentReaction`: `{ emoji: string, count: number, users: { id: string, name: string }[], reactedByMe: boolean }`

### 10.4 API changes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/comments/:commentId/reactions` | Body: `{ emoji: string }` — add or update reaction. If user already has a reaction on this comment, replaces it. |
| `DELETE` | `/comments/:commentId/reactions` | Removes current user's reaction from this comment |

- `GET /tasks/:taskId/comments` — include `reactions` array per comment

### 10.5 Frontend changes

- `CommentThread.tsx`: add reaction chips row below comment body, add "+" hover button
- `EmojiPicker.tsx` — small popover with the 12 curated emojis
- `ReactionChip.tsx` — emoji + count chip with hover tooltip and active state
- `comments.store.ts`: add `addReaction(commentId, emoji)`, `removeReaction(commentId)` actions with optimistic updates
- `packages/shared` types: update `IComment`, add `ICommentReaction`

---

## 11. F-15 — Workspace member directory

**Effort:** Low · **Priority:** Low

### 11.1 Problem

As a workspace grows beyond 10 people, it becomes hard to know who is on the team, what projects they're on, and how much work is assigned to them. There is no central place to browse workspace members. Team leads onboarding a new member have no way to show them who's who.

### 11.2 Behaviour

#### Access

- New "Team" link in the AppShell sidebar, below "Activity".
- Route: `/w/:workspaceId/team`

#### Layout

- A grid of member cards, one per workspace member.
- Each member card shows:
  - Avatar (large, with initials fallback)
  - Name
  - Role badge (Owner / Member)
  - Number of active tasks assigned (tasks where status != done)
  - Project chips: up to 3 projects the member is on, then "+N more"
  - "View assignments" link — navigates to a filtered version of the workspace activity feed showing only that member's activity (links to `/w/:workspaceId/activity?actorId=:userId`)
- Cards are sorted: workspace owner first, then alphabetical by name.
- A search input at the top of the page filters cards by name in real-time (client-side, no API call).

#### Member profile (hover or click expansion)

- Clicking a member card expands it (or opens a side panel) showing:
  - Full name, email, avatar
  - Member since date (joinedAt from workspace_members)
  - All projects they have access to (names + links)
  - Recent activity: last 5 activity events by this member across the workspace (from the activity_events table — F-03)

### 11.3 Data model changes

No new tables. All data is available from existing tables: `users`, `workspace_members`, `project_members`, `tasks` (for active task count), `activity_events` (for recent activity).

### 11.4 API changes

- `GET /workspaces/:workspaceId/members` — extend existing endpoint response to include per-member:
  - `activeTaskCount: number` (tasks assigned and not done)
  - `projects: { id, name }[]` (projects the member has access to)
- `GET /workspaces/:workspaceId/members/:userId` — detailed profile
  - Returns user, role, joinedAt, projects, activeTaskCount, recentActivity (last 5 IActivityEvent records for this user in this workspace)

### 11.5 Frontend changes

- New page: `TeamPage.tsx` at `/w/:workspaceId/team`
- `MemberCard.tsx` — grid card with avatar, name, role, task count, project chips
- `MemberProfile.tsx` — expanded view (side panel or expanded card)
- New sidebar link: "Team" with a people/group icon
- Client-side name filter input at top of page

---

## 12. Cross-cutting changes

### 12.1 Updated data model summary

| Table | Change | Feature |
|-------|--------|---------|
| `task_dependencies` | New table | F-06 Task dependencies |
| `tasks.assigneeId` | Drop column → replaced by join table | F-07 Multiple assignees |
| `task_assignees` | New table | F-07 Multiple assignees |
| `workspace_templates` | New table | F-08 Task templates |
| `subtasks` | New table | F-10 Subtasks |
| `tasks.search_vector` | New generated column | F-13 Search |
| `subtasks.search_vector` | New generated column | F-13 Search |
| `comment_reactions` | New table | F-14 Emoji reactions |

### 12.2 Updated shared types summary

Add to `packages/shared/src/types.ts`:

- `ITask`: add `blockedBy: ITaskDependency[]`, `blocks: ITaskDependency[]`, `isBlocked: boolean`, `dependencyCount: number`, `assignees: IUser[]` (replaces `assignee`), `subtaskCount: number`, `completedSubtaskCount: number`
- `ITaskDependency`: new interface (see F-06 section 2.4)
- `ISubtask`: `{ id, taskId, title, isCompleted, position, createdBy, createdAt, completedAt }`
- `ICommentReaction`: `{ emoji, count, users: { id, name }[], reactedByMe }`
- `IComment`: add `reactions: ICommentReaction[]`
- `ITemplate`: `{ id, workspaceId, name, description, thumbnailUrl, createdBy, createdAt, updatedAt }`
- `ISearchResult`: `{ id, type, title, highlight, projectId, projectName, status?, parentTaskId?, parentTaskTitle? }`

Add to `NotificationType` enum:
- `TaskUnblocked = "task_unblocked"`

### 12.3 New NestJS modules required

- `DependenciesModule` — `DependenciesService` + `DependenciesController`
- `TemplatesModule` — `TemplatesService` + `TemplatesController`
- `SubtasksModule` — `SubtasksService` + `SubtasksController`
- `SearchModule` — `SearchService` + `SearchController`
- `ReactionsModule` — `ReactionsService` + `ReactionsController`
- Extend `TasksModule` — multiple assignees, duplicate endpoint, stats
- Extend `CanvasModule` — @mention processing endpoint
- Extend `NotificationsModule` — task_unblocked type

### 12.4 New API endpoints summary

| Method | Endpoint | Feature |
|--------|----------|---------|
| `GET` | `/tasks/:taskId/dependencies` | F-06 |
| `POST` | `/tasks/:taskId/dependencies` | F-06 |
| `DELETE` | `/dependencies/:dependencyId` | F-06 |
| `POST` | `/tasks/:taskId/assignees` | F-07 |
| `DELETE` | `/tasks/:taskId/assignees/:userId` | F-07 |
| `GET` | `/workspaces/:id/templates` | F-08 |
| `POST` | `/workspaces/:id/templates` | F-08 |
| `GET` | `/workspaces/:id/templates/:templateId` | F-08 |
| `PATCH` | `/workspaces/:id/templates/:templateId` | F-08 |
| `DELETE` | `/workspaces/:id/templates/:templateId` | F-08 |
| `POST` | `/workspaces/:id/templates/:templateId/thumbnail` | F-08 |
| `POST` | `/canvas/:taskId/mentions` | F-09 |
| `GET` | `/tasks/:taskId/subtasks` | F-10 |
| `POST` | `/tasks/:taskId/subtasks` | F-10 |
| `PATCH` | `/subtasks/:subtaskId` | F-10 |
| `DELETE` | `/subtasks/:subtaskId` | F-10 |
| `PATCH` | `/tasks/:taskId/subtasks/reorder` | F-10 |
| `GET` | `/projects/:projectId/stats` | F-11 |
| `POST` | `/tasks/:taskId/duplicate` | F-12 |
| `GET` | `/workspaces/:id/search` | F-13 |
| `POST` | `/comments/:commentId/reactions` | F-14 |
| `DELETE` | `/comments/:commentId/reactions` | F-14 |
| `GET` | `/workspaces/:id/members/:userId` | F-15 |

---

## 13. Implementation order

| Step | Feature | Rationale | Effort |
|------|---------|-----------|--------|
| 1 | F-10 Subtasks | Standalone, low risk, high daily-use value | 1.5 days |
| 2 | F-11 Project progress | Pure read, no schema changes, immediate visibility | 0.5 days |
| 3 | F-12 Duplicate task | Unblocks informal templating before F-08 is built | 1 day |
| 4 | F-07 Multiple assignees | Requires migration; do before F-08 templates copy assignee state | 1.5 days |
| 5 | F-09 @mentions in canvas | Low scope, high communication value | 1 day |
| 6 | F-14 Emoji reactions | Standalone, no dependencies | 1 day |
| 7 | F-06 Task dependencies | More complex, do after simpler features are stable | 3 days |
| 8 | F-08 Task templates | Requires canvas editor work, do after F-07 (assignees) and F-12 (duplicate) | 3 days |
| 9 | F-13 Global search | Requires PostgreSQL index migration, do near the end | 2.5 days |
| 10 | F-15 Member directory | Lowest priority, purely additive | 1 day |

### 13.1 Effort estimate

| Feature | Backend | Frontend | Total | Risk |
|---------|---------|----------|-------|------|
| F-06 Task dependencies | 1.5 days | 1.5 days | 3 days | Medium |
| F-07 Multiple assignees | 0.5 days | 1 day | 1.5 days | Low (migration risk) |
| F-08 Task templates | 1.5 days | 1.5 days | 3 days | Medium |
| F-09 @mentions in canvas | 0.5 days | 0.5 days | 1 day | Low |
| F-10 Subtasks | 0.5 days | 1 day | 1.5 days | Low |
| F-11 Project progress | 0.25 days | 0.25 days | 0.5 days | Low |
| F-12 Duplicate task | 0.5 days | 0.5 days | 1 day | Low |
| F-13 Global search | 1 day | 1.5 days | 2.5 days | Low |
| F-14 Emoji reactions | 0.5 days | 0.5 days | 1 day | Low |
| F-15 Member directory | 0.5 days | 0.5 days | 1 day | Low |
| **Total** | **7.25 days** | **8.75 days** | **16 days** | — |

> **Note on F-07 migration risk:** Dropping `tasks.assigneeId` and replacing it with `task_assignees` requires a careful data migration. Write and test the migration against a copy of production data before running it. Everything downstream that reads `assignee` from a task (task store, my-work view, canvas top bar, notifications) needs to be updated simultaneously.

---

*Mesh PRD v4.0 · April 2026 · Confidential*
