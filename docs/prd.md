### PRD — Mesh (working title)

## 1. Overview

Mesh is a canvas-first project management tool where the primary unit of work is not a card with fields, but a freeform, collaborative canvas. Each task is a canvas slide. The project structure and status system wrap around the canvas, not the other way around. Built for small startups. Dogfooded by Storipod first.

**Core insight:** Tools like Jira and Linear optimize for process visibility. Mesh optimizes for *working on the thing* — the canvas is where all context, files, comments, and decisions live together.

---

## 2. Target users

Small startups (sub-50 people). Primarily technical and design teams that already use tools like Figma and value spatial, freeform work organization over form-filling.

---

## 3. Non-goals (explicitly out of scope forever)

- Gantt charts, timeline views, resource allocation
- Automations and workflow rules
- Enterprise SSO, audit logs, compliance tooling
- Third-party integrations (Slack, GitHub, etc.) in v1
- Mobile app

---

## 4. Information architecture

`Workspace
  └── Projects (many)
        └── Tasks (many) ← each task is a canvas
              └── Canvas elements (text blocks, images)
              └── Comments (pinned to canvas coordinates)
              └── Activity feed (per task, hidden by default)`

**Workspace:** Top-level container. A user can create and belong to multiple workspaces. Workspace has members with roles.

**Project:** Lives inside a workspace. Has its own member list — workspace members can be excluded from specific projects. Access is additive for workspace-level roles and explicit for project-level.

**Task:** The core entity. Has a canvas, a status, one assignee (MVP), a description, and timestamps. Represented as a card in the project view showing a static canvas thumbnail.

---

## 5. Membership & permissions

Two levels of access control:

| Role | Scope | Access |
| --- | --- | --- |
| Workspace owner | Workspace | Full access to all projects, settings, billing |
| Workspace member | Workspace | Access to all non-restricted projects |
| Project admin | Project | Manage project members, task assignment |
| Project member | Project | View and edit tasks within the project |
| Guest | Project | View only (future scope) |

Workspace members can be excluded from individual projects by a project admin. When excluded, the project does not appear in their workspace view.

---

## 6. Core features

### 6.1 Project task grid view

The main view when a user opens a project. A grid of task cards, similar to Google Slides' thumbnail grid.

**All tasks tab (default):**

- Tasks divided into 4 horizontal rows: Todo, In progress, Review, Done
- Row order is a per-user preference (drag to reorder rows)
- Each row shows a default of 10 tasks, configurable per user
- A "show more" control at the end of each row navigates to the respective status tab
- Task card shows: static canvas thumbnail, task title/description, assignee avatar, creation date, status badge

**Status tabs:** Todo | In progress | Review | Done

- Each tab shows all tasks of that status in a flat grid
- Filtering is the only mechanism for organizing by status — no Kanban columns
- Tasks can be filtered by assignee, date created, date updated

**Creating a task:**

- "New task" button in the project view opens a modal to set title, description (optional), assignee, and status
- Canvas starts empty after creation

---

### 6.2 The canvas

The heart of the product. Every task has one canvas.

**Canvas engine:** Konva.js. Yjs is the single source of truth for all canvas state. Konva renders what Yjs says — it does not own state.

**Canvas data model (Yjs):**

`Y.Doc
  └── elements: Y.Array<Y.Map>
        each element Y.Map has:
          id, type, x, y, width, height,
          content (text string or file URL),
          zIndex, createdBy, createdAt
  └── comments: Y.Array<Y.Map>
        each comment Y.Map has:
          id, x, y, authorId, body,
          resolvedAt, replies: Y.Array<Y.Map>`

**Canvas toolbar — MVP element types:**

- Text block — freeform text, editable inline
- Image — upload from device, placed on canvas

**Canvas interactions:**

- All elements are freely draggable and resizable
- Multi-select with shift-click or drag selection box
- Z-order control (bring forward, send back)
- Delete selected elements

**Snapshot generation:**

- On every canvas save (debounced, 3s after last edit), the client calls `canvas.toDataURL()` on the Konva stage and uploads the PNG to object storage (Cloudflare R2)
- The task record stores the snapshot URL
- This snapshot is what renders on the task card in the project grid

---

### 6.3 Comments (Figma-style)

**Placing a comment:**

- User selects the comment tool from the toolbar
- Clicks anywhere on the canvas to drop a comment pin at that exact (x, y) coordinate
- A compose popover opens at the pin location
- On submit, the pin is anchored to those canvas coordinates

**Comment pins on canvas:**

- Pins render as floating markers on top of canvas elements
- Each pin shows the author avatar and a reply count badge (e.g. "3") if replies exist
- Pins are visible to all users with canvas access
- Clicking a pin opens the thread in the right pane and highlights that thread

**Right comment pane:**

- Always accessible via a toggle (comment icon in the top-right chrome)
- Lists all comment threads for the current task, sorted by creation time (newest at top, or oldest — user preference)
- Each thread shows: pin author, timestamp, comment body, replies
- Reply input is inline within the thread
- "Resolve" action on a thread collapses it and marks it resolved; resolved threads are hidden by default with a "show resolved" toggle
- Clicking a thread in the pane pans and centers the canvas to that pin's coordinates

**Comment notifications:**

- Notifies mentioned users (`@username` in comment body) in-app and via push
- Notifies the task assignee when a new top-level comment is dropped on their task

---

### 6.4 Real-time multiplayer

**Sync layer:** y-websocket, self-hosted, running alongside the NestJS API. Not a separate managed service.

**What is synced in real-time via Yjs:**

- All canvas element mutations (position, size, content)
- New comment pins and replies
- Presence data (cursor position, active user)

**What is NOT synced via Yjs (goes through REST):**

- Task metadata (title, status, assignee, description)
- Project/workspace membership changes
- Notifications

**Presence:**

- Active users on a canvas are shown as colored avatar chips in the top canvas chrome (same pattern as Figma's top bar)
- Each user's cursor position is broadcast and rendered as a labeled cursor on the canvas for other users
- Presence state is stored in Redis with a TTL — no presence data hits the database

**Conflict resolution:**

- Yjs CRDT handles all canvas element conflicts automatically
- Last-write-wins is acceptable for task metadata fields (title, status) via REST + optimistic UI

---

### 6.5 Notifications

**In-app notifications:**

- Bell icon in the main nav
- Notification types: assigned to task, mentioned in comment, comment on your task, added to project
- Unread count badge on bell icon
- Clicking a notification navigates to the relevant task/canvas

**Push notifications:**

- Web Push API (PWA-compatible)
- Same triggers as in-app
- User can configure which notifications they receive in settings

---

### 6.6 Activity feed (post-MVP)

Per-task, hidden by default. Toggled via a tab in the right pane alongside comments. Logs: element added, element deleted, task status changed, assignee changed, user joined canvas.

Explicitly excluded from MVP. Placeholder tab can exist but shows "coming soon."

---

## 7. Data model (key entities)

`users
  id, email, password_hash, name, avatar_url, created_at

workspaces
  id, name, owner_id, created_at

workspace_members
  workspace_id, user_id, role (owner | member)

projects
  id, workspace_id, name, description, created_at

project_members
  project_id, user_id, role (admin | member)

project_exclusions
  project_id, user_id  ← workspace member explicitly excluded

tasks
  id, project_id, title, description, status (todo|inprogress|review|done),
  assignee_id, snapshot_url, created_by, created_at, updated_at

canvas_documents
  task_id, yjs_doc_binary  ← persisted Yjs document

canvas_elements
  id, task_id, type (text|image), x, y, width, height,
  content, z_index, created_by, created_at
  (also stored inside Yjs — this table is for querying/indexing only)

comments
  id, task_id, canvas_x, canvas_y, author_id, body,
  resolved_at, created_at

comment_replies
  id, comment_id, author_id, body, created_at

files
  id, task_id, uploader_id, url, mime_type, size, created_at

notifications
  id, recipient_id, type, resource_id, resource_type, read_at, created_at`

---

## 8. Tech stack

| Layer | Choice | Rationale |
| --- | --- | --- |
| Frontend | React | Your default, large ecosystem for canvas libs |
| Canvas rendering | Konva.js | Predictable render model, Yjs as source of truth |
| Real-time sync | Yjs + y-websocket | Self-hosted, fits NestJS infra |
| Backend | NestJS | Your expertise |
| Database | PostgreSQL | Relational, strong JSON support for canvas metadata |
| Cache / presence | Redis | TTL-based presence, session management |
| Yjs persistence | y-leveldb (dev), PostgreSQL JSONB (prod) | Persist Yjs docs between server restarts |
| File storage | Cloudflare R2 | S3-compatible, cheaper egress than AWS S3 |
| Auth | JWT + bcrypt | Email/password MVP, OAuth later |
| Push notifications | Web Push API + VAPID keys | No FCM dependency for web |
| Deployment | Fly.io or Railway | Simple, affordable for early stage |
| Monitoring | Sentry (errors) + Prometheus/Grafana (metrics) |  |

---

## 9. MVP scope

**In MVP:**

- Workspace and project creation
- Workspace and project membership with exclusions
- Task creation with status, title, description, single assignee
- Canvas with text and image elements (drag, resize, delete)
- Yjs multiplayer sync on canvas
- Figma-style comment pins + right comment pane + reply threads
- Real-time presence (cursors + avatar chips)
- Static snapshot generation on save
- Project grid view with 4-row status layout + per-user row order preference
- Status tabs (Todo, In progress, Review, Done)
- In-app notifications + Web Push
- Email/password auth

**Explicitly post-MVP:**

- Activity feed
- Google OAuth
- Video and PDF canvas elements (text + image only in MVP)
- File attachments in comments
- Guest/view-only access
- Mobile responsiveness

---

## 10. Key open engineering questions before you start

1. **Yjs document persistence strategy** — y-leveldb is fine for local dev but you need to decide how you're persisting Yjs binary docs in production. PostgreSQL JSONB with a `canvas_documents` table is the cleanest approach — store the `Y.encodeStateAsUpdate()` binary blob, rehydrate on connection.
2. **WebSocket authentication** — y-websocket needs to verify the user's JWT on connection. You'll need a custom `authenticate` handler in y-websocket's server config that validates the token before allowing the Yjs sync to proceed.
3. **Snapshot upload timing** — debounce the `toDataURL()` call client-side (3s idle), then upload to R2 and PATCH the task's `snapshot_url` via REST. Don't block the canvas on this.
4. **Presence scaling** — for MVP, Redis pub/sub handles broadcasting presence across multiple WebSocket server instances. If you're on a single instance initially, in-memory is fine — but design the interface so you can swap to Redis pub/sub without touching the rest of the code.