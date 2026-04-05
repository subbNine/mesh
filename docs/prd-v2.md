# Mesh — Extended PRD v2.0

**Version:** v2.0 · **Date:** April 2026 · **Author:** Prince · **Status:** Draft

---

## Features in this document

| # | Feature | Basecamp equivalent | Effort | Priority |
|---|---------|-------------------|--------|----------|
| F-01 | Due dates on tasks | Due dates on to-dos | Low | High |
| F-02 | My assignments view | My Assignments page | Low | High |
| F-03 | Workspace activity feed | Activity page | Medium | High |
| F-04 | Docs & files per project | Docs & Files tool | Medium | Medium |
| F-05 | Doors — external links | Doors feature | Low | Medium |

---

## 1. Overview

This document extends the Mesh PRD (v1.0) with five new features identified through a gap analysis against Basecamp. These are the features where Mesh needs to close ground to be a complete day-to-day work tool — not just a canvas editor.

The canvas-first model remains the core differentiator. These features wrap around it, giving teams the supporting infrastructure to manage deadlines, personal workloads, project-level communication, file storage, and external tool access without leaving the product.

> **Design constraint:** Every new feature must feel native to the canvas-first model. Nothing here should make Mesh feel like Jira or Basecamp with a canvas bolted on. When in doubt, favour simplicity over completeness.

### 1.1 What this document is not

This PRD does not re-document the core Mesh features already specified in v1.0 (canvas rendering, Yjs sync, comment pins, task grid, workspace/project membership). All v1.0 specs remain in effect. This document only specifies net-new features and the changes required to support them.

---

## 2. F-01 — Due dates on tasks

**Status:** New · **Priority:** High

### 2.1 Problem

Tasks in Mesh v1.0 have no temporal dimension. There is no way to know when a task is expected to be done. Teams working with deadlines — which is every startup — have to maintain this information outside the tool (Notion, spreadsheet, calendar). This creates the exact context fragmentation Mesh is meant to eliminate.

### 2.2 Behaviour

A due date is an optional date field on every task. It is set either from the task card before opening the canvas, or from the canvas top bar once inside the task.

#### Setting a due date

- Task card hover state: a calendar icon appears. Clicking it opens a date picker inline.
- Inside the canvas, the top bar shows a "Due date" field next to the assignee avatar. Click to open the date picker.
- Due date is optional — tasks without one show no date.
- Date picker: month/day/year selector. No time component (date precision is enough for MVP).
- Clearing a due date sets the field back to null.

#### Displaying due dates

- Task card: due date shown below the assignee avatar in small text.
- Colour coding on the task card due date label:
  - Overdue (past today): red text
  - Due today: amber text
  - Due within 7 days: standard muted text with a subtle amber dot indicator
  - Due further out: muted gray text
- Task canvas top bar: due date shown as a clickable field. Same colour coding applies.

#### Filtering and sorting

- The project task grid gains two new filter/sort controls:
  - Filter: "Overdue only" — shows tasks where `dueDate < today` across all statuses
  - Filter: "Due this week" — shows tasks where `dueDate` is within the next 7 days
  - Sort: "Due date (earliest first)" added as a sort option alongside the existing "Created date" sort
- "My assignments" view (F-02) uses due date as its primary sort.

#### Notifications

- 1 day before due date: in-app notification and push notification to the task assignee.
- On due date (at 09:00 workspace timezone): in-app and push notification if task is not yet "done".
- Notification copy: `"{task title} is due today"` with a link to the canvas.
- User can disable due date reminders in notification preferences (per-user setting, not workspace-wide).

### 2.3 Data model changes

> **Schema change:** Add `dueDate: timestamp (nullable)` to the tasks table. Add a scheduled job that runs daily at 08:50 workspace timezone to dispatch due-date notifications.

- `tasks` table: add `dueDate` column (timestamp, nullable, no default)
- `notifications` table: add new type values `due_soon` and `due_today` to the `NotificationType` enum
- New scheduled job: `DueDateNotificationJob`
  - Runs daily via NestJS `@Cron("50 8 * * *")` (UTC for MVP, workspace timezone in later iteration)
  - Queries tasks WHERE `dueDate = today` AND `status != done` AND `assigneeId IS NOT NULL`
  - Also queries tasks WHERE `dueDate = tomorrow` AND `status != done` AND `assigneeId IS NOT NULL`
  - Creates notifications for each assignee

### 2.4 API changes

- `PATCH /tasks/:taskId` — add `dueDate` to `UpdateTaskDto` (optional ISO date string)
- `GET /projects/:projectId/tasks` — add query params: `overdue` (boolean), `dueThisWeek` (boolean), `sortBy` (enum: `createdAt | dueDate`)
- `GET /users/me/assignments` (new, see F-02) — includes `dueDate` in response

### 2.5 Frontend changes

- `TaskCard`: add due date display below assignee, with colour coding logic
- `TaskCard` hover: add calendar icon button that opens an inline date picker
- `CanvasTopBar`: add due date field (same pattern as status badge — click to open picker)
- `ProjectDetailPage` filter bar: add "Overdue" filter toggle and "Due this week" toggle
- `ProjectDetailPage` sort control: add "Due date" sort option
- `task.store`: update `updateTask` action to accept `dueDate`, apply optimistically
- `packages/shared` types: add `dueDate?: string` to `ITask` interface

---

## 3. F-02 — My assignments view

**Status:** New · **Priority:** High

### 3.1 Problem

A team member who works across multiple projects has no way to answer "what do I need to work on today?" without manually opening each project, switching tabs, and mentally aggregating their task list. This becomes painful with even 3–4 active projects. Basecamp's "My Assignments" page is one of its most-used features for exactly this reason.

### 3.2 Behaviour

My assignments is a personal workspace-scoped view. It aggregates every task assigned to the current user across all projects in the current workspace, into a single flat list ordered by urgency.

#### Access

- A new "My work" link in the AppShell sidebar, above "Projects".
- Route: `/w/:workspaceId/my-work`
- This view is personal — each user sees only their own assignments. There is no way to view another user's assignments in MVP.

#### Layout

- Page title: "My work" with a subtitle showing the workspace name.
- Tasks grouped into four sections, in this fixed order:
  1. **Overdue** — tasks where `dueDate < today` and `status != done`
  2. **Due today** — tasks where `dueDate = today`
  3. **Due this week** — tasks where `dueDate` is within 7 days (excluding today)
  4. **Everything else** — all other assigned tasks with no due date or due date further out
- Each section is collapsible (open by default).
- Sections with zero tasks are hidden entirely.
- Within each section, tasks are sorted by due date ascending. Tasks with no due date are sorted by `createdAt` descending within "Everything else".

#### Task row

Each task is shown as a compact horizontal row (not a card):

- Project name chip (small, coloured by project, clickable → project page)
- Task title (clickable → task canvas)
- Status badge (same colour coding as the task grid)
- Due date (colour coded: overdue=red, today=amber, soon=muted amber, none=empty)
- Assignee avatar (self, shown for visual consistency)
- Quick status change: clicking the status badge opens a dropdown to change status without leaving the view

#### Filters

- Status filter: All | Todo | In progress | Review (Done tasks excluded by default)
- "Show completed" toggle: when on, Done tasks are included at the bottom of "Everything else"
- Project filter: multi-select dropdown to narrow to specific projects

#### Empty state

When no tasks are assigned: "Nothing assigned to you yet. Ask a teammate to assign you to a task." with a link to the projects page.

### 3.3 Data model changes

No schema changes required. Due dates (F-01) are a prerequisite for the grouping logic. The query is:

- `SELECT tasks.* FROM tasks WHERE tasks.assigneeId = :userId AND tasks.workspaceId (via project join) = :workspaceId`
- Join with projects to get project name and colour
- Application-level grouping into the four sections

### 3.4 API changes

- New endpoint: `GET /users/me/assignments?workspaceId=:id`
- Query params: `status` (optional, comma-separated), `includeCompleted` (boolean, default false), `projectId` (optional, comma-separated)
- Response: `{ overdue: ITask[], dueToday: ITask[], dueThisWeek: ITask[], other: ITask[] }`
- Each task in the response includes: `id, title, status, dueDate, projectId, projectName, snapshotUrl`

### 3.5 Frontend changes

- New page: `apps/web/src/pages/my-work/MyWorkPage.tsx`
- New sidebar link in AppShell: "My work" with an inbox/checklist icon
- New component: `MyWorkTaskRow.tsx` — compact horizontal task row
- Grouped list rendering with collapsible sections
- Status change dropdown on each row (`PATCH /tasks/:id` optimistic update)
- `assignments.store.ts` or extend `task.store` with `fetchMyAssignments` action

---

## 4. F-03 — Workspace activity feed

**Status:** New · **Priority:** High

### 4.1 Problem

Mesh v1.0 deferred activity feeds entirely (marked post-MVP). The consequence is that there is no way to answer "what happened across the team today?" — a fundamental need for any PM tool. Basecamp's activity page is one of the most referenced views by team leads and founders who want lightweight visibility without micromanagement.

We are building this in two scopes simultaneously, because the infra is shared:

- **Task-level feed:** visible inside a task (already planned in v1.0, now being specified)
- **Workspace-level feed:** visible across all projects in a workspace

### 4.2 Activity event types

| Event type | Trigger | Appears in |
|------------|---------|-----------|
| `task.created` | Task created | Workspace + Task |
| `task.status_changed` | Status updated | Workspace + Task |
| `task.assigned` | Assignee changed | Workspace + Task |
| `task.due_date_set` | Due date set or changed | Task only |
| `comment.created` | Comment pin dropped | Workspace + Task |
| `comment.resolved` | Comment thread resolved | Task only |
| `canvas.element_added` | Element added to canvas | Task only |
| `canvas.element_deleted` | Element removed | Task only |
| `project.created` | New project created | Workspace only |
| `member.added` | Member added to project | Workspace only |

### 4.3 Workspace-level feed

#### Access

- New "Activity" link in the AppShell sidebar, below "My work".
- Route: `/w/:workspaceId/activity`

#### Layout

- Chronological feed of events, newest first.
- Each event row: actor avatar, event description (human-readable), project chip, timestamp.
- Event descriptions are written naturally:
  - "Prince created canvas task *Design system tokens* in Project Alpha"
  - "Tolu moved *Onboarding flow* to In progress"
  - "Sade commented on *API rate limiting*"
- Clicking an event row navigates to the relevant task canvas or project.
- The feed loads the most recent 50 events by default. "Load more" at the bottom fetches the next 50.

#### Filters

- Project filter: multi-select, all projects by default
- Actor filter: multi-select of workspace members — "Show activity by..."
- Event type filter: Tasks | Comments | Project events (grouped checkboxes)
- Date range: Today | This week | This month | Custom range

### 4.4 Task-level feed

#### Access

- Inside the task canvas page, the right pane has two tabs: "Comments" (default) and "Activity".
- The activity tab is hidden by default (tab is visible but not the active tab).
- Clicking "Activity" loads the feed for that task only.

#### Layout

- Same event row format as the workspace feed, but without the project chip (redundant at task scope).
- Events included: all events marked "Task only" or "Workspace + Task" in the table above.
- Canvas element events (`element_added`, `element_deleted`) are shown in the task feed only — too granular for the workspace feed.

### 4.5 Data model changes

> **New table:** `activity_events` — this is the backing store for both the workspace feed and the task feed.

`activity_events` table:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | primary key |
| `workspaceId` | uuid | FK → workspaces.id |
| `projectId` | uuid | FK → projects.id, nullable |
| `taskId` | uuid | FK → tasks.id, nullable |
| `actorId` | uuid | FK → users.id |
| `eventType` | varchar | enum values from section 4.2 |
| `payload` | jsonb | event-specific data (old/new values, element type, etc.) |
| `createdAt` | timestamp | default now |

- Index on `(workspaceId, createdAt DESC)` for workspace feed queries
- Index on `(taskId, createdAt DESC)` for task feed queries
- Events are written by the relevant NestJS service at the point of mutation (not via DB triggers)
- An `ActivityService` handles event creation and is imported by Tasks, Comments, Projects, and Canvas services

### 4.6 API changes

- `GET /workspaces/:workspaceId/activity` — workspace feed
  - Query params: `projectId[]`, `actorId[]`, `eventType[]`, `from` (ISO date), `to` (ISO date), `page`, `limit` (default 50)
  - Response: `{ events: IActivityEvent[], total: number, hasMore: boolean }`
- `GET /tasks/:taskId/activity` — task feed
  - Query params: `page`, `limit`
- `IActivityEvent` type in `packages/shared`: `{ id, workspaceId, projectId, taskId, actorId, actor: IUser, eventType, payload, createdAt }`

### 4.7 Frontend changes

- New page: `apps/web/src/pages/activity/ActivityFeedPage.tsx`
- New sidebar link: "Activity" (clock/pulse icon)
- New component: `ActivityEventRow.tsx` — event row with avatar, description, project chip, timestamp
- `activityFeed.store.ts`: `fetchWorkspaceActivity`, `fetchTaskActivity`, filters state
- In `TaskCanvasPage`: add "Activity" tab to the right pane alongside "Comments"
- `ActivityTab.tsx` inside the right pane — lazy-loads task events when tab is clicked
- Human-readable event description renderer: a function that takes an `IActivityEvent` and returns a formatted string

---

## 5. F-04 — Docs & files per project

**Status:** New · **Priority:** Medium

### 5.1 Problem

In v1.0, files can only be attached to specific task canvases. There is no home for project-level assets: design briefs, technical specs, brand guidelines, contracts, API documentation, onboarding docs. Teams are forced to keep these in Google Drive, Notion, or scattered across task canvases where they are hard to find.

Basecamp solves this with a "Docs & Files" section per project that combines a simple rich-text document editor with a file library. We will build a pragmatic version of this — a file library with basic rich-text documents, not a full Notion replacement.

### 5.2 Concepts

- **Project library:** every project has a "Docs & files" section accessible from the project page.
- Two item types in the library:
  - **Document** — a rich-text document created and edited inside Mesh
  - **File** — an uploaded file (image, PDF, video, any type) stored in R2
- Items can be organised into folders (one level of nesting only, no infinite depth).
- Items are ordered by `updatedAt` desc by default. Manual pinning is not in MVP.

### 5.3 Documents

#### Creating a document

- From the project library, "+ New document" → opens a full-page document editor.
- Route: `/w/:workspaceId/p/:projectId/docs/:docId`
- The document editor is a simple rich-text editor. Use **BlockNote** or **TipTap** (both React-native, MIT licensed, good DX).
- Supported formatting: H1, H2, bold, italic, inline code, bullet list, numbered list, code block, divider.
- Auto-saves every 3 seconds after the last keystroke (debounced, same pattern as canvas snapshot).
- The document title is editable inline at the top of the page (click to edit).
- Documents are not real-time collaborative in MVP — last-write-wins. Show a warning banner if another user is viewing the same document: "Tolu is also editing this document. Changes may conflict."

#### Document list view

- Each document in the library shows: title, author avatar, last updated timestamp, word count (approximate).
- Clicking a document opens the editor.
- Document can be deleted by the project admin or the document author.

### 5.4 File library

#### Uploading files

- From the project library, "+ Upload file" → file picker (any file type, max 50MB per file).
- Files are uploaded to R2 under `project-files/{projectId}/{uuid}.{ext}`.
- Multiple files can be selected and uploaded at once.
- Upload progress shown inline (per-file progress bar).

#### File list view

- Each file shows: file icon (by type), name, uploader avatar, file size, upload date.
- Clicking a file:
  - Images → lightbox preview
  - PDFs → open in a new browser tab (direct R2 URL)
  - Other file types → trigger a download
- Files can be renamed (inline edit on the filename).
- Files can be deleted by the uploader or project admin.

#### Folders

- "+ New folder" creates a named folder in the library.
- Documents and files can be dragged into folders or moved via a context menu.
- Folders show item count. Clicking a folder drills into it. A breadcrumb shows the path.
- One level of nesting only. Folders cannot contain folders.

### 5.5 Data model changes

`project_documents` table:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | primary key |
| `projectId` | uuid | FK → projects.id, onDelete CASCADE |
| `folderId` | uuid | FK → project_folders.id, nullable |
| `title` | varchar | default "Untitled document" |
| `content` | jsonb | BlockNote/TipTap document JSON |
| `authorId` | uuid | FK → users.id |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

`project_files` table (separate from the task-scoped `files` table):

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | primary key |
| `projectId` | uuid | FK → projects.id, onDelete CASCADE |
| `folderId` | uuid | FK → project_folders.id, nullable |
| `name` | varchar | original filename |
| `url` | varchar | R2 public URL |
| `key` | varchar | R2 object key |
| `mimeType` | varchar | |
| `sizeBytes` | integer | |
| `uploaderId` | uuid | FK → users.id |
| `createdAt` | timestamp | |

`project_folders` table:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | primary key |
| `projectId` | uuid | FK → projects.id, onDelete CASCADE |
| `name` | varchar | |
| `createdBy` | uuid | FK → users.id |
| `createdAt` | timestamp | |

### 5.6 API changes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/projects/:id/library` | Returns folders, documents, and files at root level |
| `GET` | `/projects/:id/library/folders/:folderId` | Returns contents of a folder |
| `POST` | `/projects/:id/folders` | Create folder |
| `DELETE` | `/projects/:id/folders/:folderId` | Delete folder (moves contents to root) |
| `POST` | `/projects/:id/documents` | Create document, returns `{ id, title }` |
| `GET` | `/projects/:id/documents/:docId` | Get document content |
| `PATCH` | `/projects/:id/documents/:docId` | Update title + content (auto-save) |
| `DELETE` | `/projects/:id/documents/:docId` | Delete document |
| `POST` | `/projects/:id/files` | Upload file (multipart, any type, max 50MB) |
| `PATCH` | `/projects/:id/files/:fileId` | Rename file |
| `DELETE` | `/projects/:id/files/:fileId` | Delete file |
| `PATCH` | `/projects/:id/library/move` | Move item to folder — body: `{ itemId, itemType: document\|file, folderId \| null }` |

### 5.7 Frontend changes

- New tab on `ProjectDetailPage`: "Docs & files" alongside "All tasks", "Todo", etc.
- New page: `ProjectLibraryPage.tsx` — renders folder/file/document grid
- New page: `DocumentEditorPage.tsx` — full-page editor route
- Install: `npm install @blocknote/react @blocknote/core` (MIT licensed)
- Components: `LibraryItem.tsx`, `FolderView.tsx`, `FilePreviewLightbox.tsx`, `UploadProgress.tsx`
- Drag-and-drop for moving items into folders: use `@dnd-kit/core` (already installed)
- `library.store.ts`: `fetchLibrary`, `createDocument`, `updateDocument`, `uploadFile`, `deleteItem`, `createFolder`, `moveItem`

---

## 6. F-05 — Doors (external tool links per project)

**Status:** New · **Priority:** Medium

### 6.1 Problem

Startups use multiple tools simultaneously. A project in Mesh typically has related assets living in Figma (designs), GitHub (code), Notion (specs), Google Drive (shared docs), or a staging URL. Team members constantly switch between Mesh and these tools. There is currently no way to surface these links inside a project — teammates have to ask "where's the Figma file?" every time.

Basecamp's "Doors" feature solves this with the simplest possible mechanism: a curated list of links per project, displayed prominently on the project page. No deep integration, no OAuth, no webhooks. Just links.

### 6.2 Behaviour

#### Adding a door

- On the project page, a "Doors" section is visible above the task grid.
- "+ Add link" opens a small form: URL (required), label (required, max 40 chars), optional emoji.
- On save, the link is stored and displayed in the Doors section.
- Any project member can add a door. Project admin can delete any door. Members can only delete their own.
- Max 20 doors per project.

#### Displaying doors

- Doors are shown as a compact horizontal row of link chips on the project page.
- Each chip: emoji + label. Clicking opens the URL in a new tab.
- On hover: show the full URL as a tooltip.
- Doors appear above the task grid and tabs — always visible when on the project page.

#### Smart URL detection

When a user pastes a URL, Mesh auto-detects common tools and pre-fills the label and emoji:

| URL pattern | Emoji | Default label |
|-------------|-------|---------------|
| `figma.com` | 🎨 | Figma |
| `github.com` | 🐙 | GitHub |
| `notion.so` | 📝 | Notion |
| `docs.google.com` | 📄 | Google Doc |
| `drive.google.com` | 📁 | Google Drive |
| `linear.app` | 📐 | Linear |
| `vercel.app` / `netlify.app` | 🚀 | Staging |
| `loom.com` | 🎬 | Loom |
| Anything else | 🔗 | Link |

User can override the auto-detected label and emoji before saving.

#### Editing and reordering

- Doors can be reordered by drag-and-drop (using `@dnd-kit/sortable`, already installed).
- Clicking the label of an existing door (edit icon on hover) opens the edit form.
- Editing only changes label, emoji, and URL — not the order.

### 6.3 Data model changes

`project_doors` table:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | primary key |
| `projectId` | uuid | FK → projects.id, onDelete CASCADE |
| `label` | varchar | max 40 chars |
| `url` | varchar | validated as URL on save |
| `emoji` | varchar | single emoji character or empty |
| `position` | integer | for ordering, 0-indexed |
| `createdBy` | uuid | FK → users.id |
| `createdAt` | timestamp | |

### 6.4 API changes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/projects/:id/doors` | Returns all doors ordered by position |
| `POST` | `/projects/:id/doors` | Create door — body: `{ label, url, emoji?, position? }` |
| `PATCH` | `/projects/:id/doors/:doorId` | Update label, url, emoji |
| `DELETE` | `/projects/:id/doors/:doorId` | Delete door |
| `PATCH` | `/projects/:id/doors/reorder` | Body: `{ orderedIds: string[] }`, updates positions of all doors in one request |

### 6.5 Frontend changes

- New component: `DoorsRow.tsx` — horizontal pill row of door chips, sits above task grid in `ProjectDetailPage`
- New component: `DoorChip.tsx` — pill with emoji, label, external link icon on hover
- New component: `AddDoorModal.tsx` — URL + label + emoji form with smart URL detection
- Drag-and-drop reordering of chips using `@dnd-kit/sortable`
- `doors.store.ts` (or extend `project.store`): `fetchDoors`, `createDoor`, `updateDoor`, `deleteDoor`, `reorderDoors`
- Util: `detectDoorMetadata(url: string): { emoji, label }` — URL pattern matching

---

## 7. Cross-cutting changes

### 7.1 Updated data model summary

| Table | Change | Reason |
|-------|--------|--------|
| `tasks` | Add column | `dueDate` (timestamp, nullable) |
| `notifications` | Extend enum | Add `due_soon`, `due_today` types |
| `activity_events` | New table | Backing store for all activity feeds |
| `project_documents` | New table | Rich-text documents per project |
| `project_files` | New table | Uploaded files per project (separate from task files) |
| `project_folders` | New table | Folder organisation for project library |
| `project_doors` | New table | External link shortcuts per project |

### 7.2 Updated shared types

Add to `packages/shared/src/types.ts`:

- `ITask`: add `dueDate?: string` (ISO date string)
- `IActivityEvent`: `{ id, workspaceId, projectId?, taskId?, actorId, actor: IUser, eventType, payload: Record<string, any>, createdAt }`
- `IProjectDocument`: `{ id, projectId, folderId?, title, content, authorId, author: IUser, createdAt, updatedAt }`
- `IProjectFile`: `{ id, projectId, folderId?, name, url, mimeType, sizeBytes, uploaderId, uploader: IUser, createdAt }`
- `IProjectFolder`: `{ id, projectId, name, itemCount, createdAt }`
- `IProjectDoor`: `{ id, projectId, label, url, emoji, position, createdBy, createdAt }`
- Add to `NotificationType` enum: `DueSoon = "due_soon"`, `DueToday = "due_today"`
- Add `ActivityEventType` enum with all event type strings from section 4.2

### 7.3 New API endpoints summary

| Method | Endpoint | Feature |
|--------|----------|---------|
| `GET` | `/users/me/assignments` | F-02 My assignments |
| `GET` | `/workspaces/:id/activity` | F-03 Workspace feed |
| `GET` | `/tasks/:taskId/activity` | F-03 Task feed |
| `GET` | `/projects/:id/library` | F-04 Library root |
| `GET` | `/projects/:id/library/folders/:folderId` | F-04 Folder contents |
| `POST` | `/projects/:id/folders` | F-04 Create folder |
| `DELETE` | `/projects/:id/folders/:folderId` | F-04 Delete folder |
| `POST` | `/projects/:id/documents` | F-04 Create doc |
| `GET` | `/projects/:id/documents/:docId` | F-04 Get doc |
| `PATCH` | `/projects/:id/documents/:docId` | F-04 Update doc |
| `DELETE` | `/projects/:id/documents/:docId` | F-04 Delete doc |
| `POST` | `/projects/:id/files` | F-04 Upload file |
| `PATCH` | `/projects/:id/files/:fileId` | F-04 Rename file |
| `DELETE` | `/projects/:id/files/:fileId` | F-04 Delete file |
| `PATCH` | `/projects/:id/library/move` | F-04 Move item |
| `GET` | `/projects/:id/doors` | F-05 List doors |
| `POST` | `/projects/:id/doors` | F-05 Create door |
| `PATCH` | `/projects/:id/doors/:doorId` | F-05 Update door |
| `DELETE` | `/projects/:id/doors/:doorId` | F-05 Delete door |
| `PATCH` | `/projects/:id/doors/reorder` | F-05 Reorder doors |

### 7.4 New NestJS modules required

- `ActivityModule` — `ActivityService` + `ActivityController` (GET endpoints only)
- `DocsModule` — `DocsService` + `DocsController` (documents + folders)
- `ProjectFilesModule` — `ProjectFilesService` + `ProjectFilesController` (project-scoped files, separate from task-scoped `FilesModule`)
- `DoorsModule` — `DoorsService` + `DoorsController`
- Extend existing `TasksModule` — add due date fields, cron job for notifications
- Extend existing `NotificationsModule` — add `due_soon` / `due_today` notification types

---

## 8. Implementation order

| Step | Feature | Why this order | Blocker for |
|------|---------|---------------|-------------|
| 1 | F-01 Due dates | Single schema change, unlocks grouping logic in F-02 | F-02 My assignments |
| 2 | F-05 Doors | Smallest scope, independent, quick win for the team | Nothing |
| 3 | F-02 My assignments | Requires F-01 due dates to group correctly | Nothing |
| 4 | F-03 Activity feed | Requires ActivityService wired into all other modules | Nothing |
| 5 | F-04 Docs & files | Largest scope, independent, save for last | Nothing |

### 8.1 Effort estimate

| Feature | Backend | Frontend | Total | Risk |
|---------|---------|----------|-------|------|
| F-01 Due dates | 0.5 days | 1 day | 1.5 days | Low |
| F-02 My assignments | 1 day | 1.5 days | 2.5 days | Low |
| F-03 Activity feed | 2 days | 2 days | 4 days | Medium |
| F-04 Docs & files | 2.5 days | 3 days | 5.5 days | Medium |
| F-05 Doors | 0.5 days | 1 day | 1.5 days | Low |
| **Total** | **6.5 days** | **8.5 days** | **15 days** | — |

> **Note on estimates:** These assume one developer working sequentially. F-04 (Docs & files) carries medium risk because of the rich-text editor integration — BlockNote/TipTap have good DX but auto-save + conflict detection adds surface area. Budget a buffer day.

---

## 9. Explicitly not building

These were evaluated and rejected for the following reasons:

| Feature | Why not |
|---------|---------|
| Hill Charts | Basecamp-specific mental model. Doesn't map to our canvas-first approach. Status + activity feed gives equivalent visibility without the conceptual overhead. |
| Automatic check-ins | Async standup is a distinct product category. Not our core loop. Teams already have Slack/WhatsApp for this. |
| Campfire / project chat | We are not trying to replace Slack. Adding a real-time chat room increases scope significantly and dilutes focus. Comment pins + message board (future) is sufficient. |
| Message board | Valuable but deprioritised. Docs (F-04) partially fills this need for async project communication. Revisit in v3. |
| Email-in | Low demand from our target (small startups), high implementation complexity. Skip entirely. |
| Lineup (project timeline) | Gantt-adjacent. Explicitly outside our product scope as stated in v1.0 non-goals. |
| Public project links | Useful but a post-PMF feature. Requires access control rework and CDN caching considerations. Defer. |
| Client access / visibility control | Guest role already planned (v1.0 post-MVP). Content-level visibility control adds significant complexity. Defer to v3. |

---

*Mesh Extended PRD v2.0 · April 2026 · Confidential*
