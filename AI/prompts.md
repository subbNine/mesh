# Mesh — Vibe-Coding Prompts

> These prompts are written to be fed sequentially to an AI coding agent (Claude Code, Cursor, etc).
> Each prompt is self-contained. Feed them in order — later prompts depend on earlier ones.
> Wait for each prompt to fully complete before moving to the next.

---

## HOW TO USE THESE PROMPTS

- Copy each prompt block and paste it into your AI agent
- Wait for the agent to finish and verify the output before moving to the next
- Each prompt references prior work — keep all generated files in context
- When a prompt says "refer to the data model", it means the schema defined in Prompt 03

---

# PHASE 1 — PROJECT SETUP & INFRASTRUCTURE

---

## PROMPT 01 — Monorepo scaffold

```
Set up a monorepo for this project using npm workspaces.

Directory structure:
canvas-pm/
  apps/
    api/          ← NestJS backend
    web/          ← React frontend (Vite)
  packages/
    shared/       ← shared TypeScript types used by both api and web

Root package.json:
- name: "canvas-pm"
- private: true
- workspaces: ["apps/*", "packages/*"]
- scripts:
    "dev": run apps/api and apps/web concurrently (use the concurrently package)
    "build": build both apps

--- apps/api ---
Initialize NestJS with TypeScript. Install:
@nestjs/common @nestjs/core @nestjs/platform-express @nestjs/config
@nestjs/typeorm typeorm pg
@nestjs/jwt @nestjs/passport passport passport-jwt passport-local
class-validator class-transformer
bcryptjs
@types/bcryptjs @types/passport-jwt (devDependencies)

--- apps/web ---
Initialize with Vite + React + TypeScript. Install:
react react-dom react-router-dom
zustand axios
konva react-konva
yjs y-websocket
tailwindcss (with postcss and autoprefixer, configured)
@types/react @types/react-dom (devDependencies)

--- packages/shared ---
TypeScript only. No framework.
Create packages/shared/src/index.ts as the entry point.
This package will export shared types and enums — leave it empty for now.
Add a tsconfig.json and package.json with name "@canvas-pm/shared".

--- Docker ---
Create docker-compose.yml at the root:
  postgres:
    image: postgres:16
    ports: 5432:5432
    environment: POSTGRES_DB=canvaspm, POSTGRES_USER=canvaspm, POSTGRES_PASSWORD=canvaspm
  redis:
    image: redis:7-alpine
    ports: 6379:6379

--- Env ---
Create apps/api/.env.example:
DATABASE_URL=postgresql://postgres:fqsonfLkieLLghsNXIJTQVxqBLTvZdFp@caboose.proxy.rlwy.net:21993/railway
REDIS_URL=redis://default:LVHNNDVvQVdRjWwJugGDKCkYqssbqkNF@junction.proxy.rlwy.net:43330
JWT_SECRET=changeme
JWT_EXPIRES_IN=7d
PORT=3000
WS_PORT=1234
R2_BUCKET=
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
CLIENT_URL=http://localhost:5173

Create apps/web/.env.example:
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:1234

Add a root .gitignore covering: node_modules, dist, .env, *.local
```

---

## PROMPT 02 — NestJS app skeleton

```
Inside apps/api, build the full NestJS application structure.
Do not implement feature logic yet — skeleton and wiring only.

--- Module structure ---
Create these folders under apps/api/src/modules/, each with placeholder files:
  auth/         → auth.module.ts, auth.controller.ts, auth.service.ts
  workspaces/   → workspaces.module.ts, workspaces.controller.ts, workspaces.service.ts
  projects/     → projects.module.ts, projects.controller.ts, projects.service.ts
  tasks/        → tasks.module.ts, tasks.controller.ts, tasks.service.ts
  canvas/       → canvas.module.ts, canvas.service.ts (no controller — WebSocket only)
  comments/     → comments.module.ts, comments.controller.ts, comments.service.ts
  files/        → files.module.ts, files.controller.ts, files.service.ts
  notifications/ → notifications.module.ts, notifications.controller.ts, notifications.service.ts
  presence/     → presence.module.ts, presence.service.ts (no controller)
  users/        → users.module.ts, users.controller.ts, users.service.ts

Create apps/api/src/common/:
  guards/jwt-auth.guard.ts         → placeholder JwtAuthGuard extending AuthGuard('jwt')
  decorators/current-user.decorator.ts → placeholder CurrentUser param decorator
  filters/http-exception.filter.ts → placeholder HttpExceptionFilter implementing ExceptionFilter

--- AppModule ---
Wire all modules into apps/api/src/app.module.ts:
- ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })
- TypeOrmModule.forRootAsync: use ConfigService to read DATABASE_URL, set type: 'postgres', synchronize: false, autoLoadEntities: true
- Import all feature modules

--- main.ts ---
- enableCors({ origin: process.env.CLIENT_URL, credentials: true })
- useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
- useGlobalFilters(new HttpExceptionFilter())
- Listen on process.env.PORT ?? 3000
- Log "API running on port X" on start

--- React app skeleton ---
In apps/web/src/:
  Create these folders with an empty index.tsx placeholder in each:
    pages/
      auth/         → LoginPage, RegisterPage
      workspaces/   → WorkspaceSelectorPage
      projects/     → ProjectsPage, ProjectDetailPage
      tasks/        → TaskCanvasPage
      settings/     → ProfilePage, WorkspaceSettingsPage, ProjectSettingsPage
      errors/       → ForbiddenPage, NotFoundPage
    components/
      layout/       → AppShell, Sidebar, Topbar
      canvas/       → CanvasStage, CanvasToolbar, CanvasTopBar
      comments/     → CommentPin, CommentPane, CommentThread, CommentCompose
      tasks/        → TaskCard, TaskGrid, NewTaskModal, TaskCardSkeleton
      ui/           → Button, Input, Modal, Avatar, Badge, Skeleton, Toast, NotificationBell
    store/          → auth.store.ts, workspace.store.ts, project.store.ts, task.store.ts, canvas.store.ts, notifications.store.ts
    lib/
      api.ts        → axios instance with base URL from env and JWT interceptor
      ws.ts         → y-websocket connection helper
      user-color.ts → consistent color from userId
      use-query.ts  → custom data fetching hook

Set up react-router-dom in apps/web/src/main.tsx with placeholder routes for all pages.
```

---

## PROMPT 03 — Database schema & migrations

```
In apps/api, set up TypeORM entities and the initial database migration.

Create apps/api/src/database/:
  migrations/   ← migration files go here

Create a TypeORM CLI config file at apps/api/data-source.ts that reads DATABASE_URL from .env.
Add a "migration:generate" and "migration:run" script to apps/api/package.json.

--- Entities ---
Create one entity file per table under apps/api/src/modules/<module>/entities/:

users.entity.ts
  - id: uuid (primary, generated)
  - email: varchar, unique, not null
  - passwordHash: varchar, not null
  - firstName: varchar, not null
  - lastName: varchar, not null
  - userName: varchar, unique, not null
  - avatarUrl: varchar, nullable
  - createdAt: timestamp, default now

workspaces.entity.ts
  - id: uuid (primary, generated)
  - name: varchar, not null
  - ownerId: uuid, not null (FK → users.id)
  - createdAt: timestamp, default now

workspace_members.entity.ts
  - id: uuid (primary, generated)
  - workspaceId: uuid (FK → workspaces.id, onDelete CASCADE)
  - userId: uuid (FK → users.id, onDelete CASCADE)
  - role: enum('owner','member'), default 'member'
  - joinedAt: timestamp, default now
  - UNIQUE constraint on (workspaceId, userId)

projects.entity.ts
  - id: uuid (primary, generated)
  - workspaceId: uuid (FK → workspaces.id, onDelete CASCADE)
  - name: varchar, not null
  - description: text, nullable
  - createdBy: uuid (FK → users.id)
  - createdAt: timestamp, default now

project_members.entity.ts
  - id: uuid (primary, generated)
  - projectId: uuid (FK → projects.id, onDelete CASCADE)
  - userId: uuid (FK → users.id, onDelete CASCADE)
  - role: enum('admin','member'), default 'member'
  - UNIQUE constraint on (projectId, userId)

project_exclusions.entity.ts
  - id: uuid (primary, generated)
  - projectId: uuid (FK → projects.id, onDelete CASCADE)
  - userId: uuid (FK → users.id, onDelete CASCADE)
  - UNIQUE constraint on (projectId, userId)

tasks.entity.ts
  - id: uuid (primary, generated)
  - projectId: uuid (FK → projects.id, onDelete CASCADE)
  - title: varchar, not null
  - description: text, nullable
  - status: enum('todo','inprogress','review','done'), default 'todo'
  - assigneeId: uuid (FK → users.id, nullable)
  - snapshotUrl: varchar, nullable
  - createdBy: uuid (FK → users.id)
  - createdAt: timestamp, default now
  - updatedAt: timestamp, updated automatically

canvas_documents.entity.ts
  - id: uuid (primary, generated)
  - taskId: uuid (FK → tasks.id, onDelete CASCADE), UNIQUE
  - doc: bytea (binary Yjs state — store as Buffer)
  - updatedAt: timestamp, updated automatically

comments.entity.ts
  - id: uuid (primary, generated)
  - taskId: uuid (FK → tasks.id, onDelete CASCADE)
  - authorId: uuid (FK → users.id)
  - body: text, not null
  - canvasX: float, not null
  - canvasY: float, not null
  - resolvedAt: timestamp, nullable
  - createdAt: timestamp, default now

comment_replies.entity.ts
  - id: uuid (primary, generated)
  - commentId: uuid (FK → comments.id, onDelete CASCADE)
  - authorId: uuid (FK → users.id)
  - body: text, not null
  - createdAt: timestamp, default now

files.entity.ts
  - id: uuid (primary, generated)
  - taskId: uuid (FK → tasks.id, onDelete CASCADE)
  - uploaderId: uuid (FK → users.id)
  - url: varchar, not null
  - key: varchar, not null (R2 object key)
  - mimeType: varchar, not null
  - sizeBytes: integer, not null
  - createdAt: timestamp, default now

notifications.entity.ts
  - id: uuid (primary, generated)
  - recipientId: uuid (FK → users.id, onDelete CASCADE)
  - type: enum('assigned','mentioned','commented','added_to_project')
  - resourceId: uuid
  - resourceType: enum('task','project')
  - readAt: timestamp, nullable
  - createdAt: timestamp, default now

After creating all entities, generate and run the initial migration.
Verify all tables are created correctly in the database.
```

---

## PROMPT 04 — Shared types package

```
In packages/shared/src/, define all shared TypeScript types and enums used by both apps.

Create the following files:

enums.ts:
  export enum TaskStatus { Todo = 'todo', InProgress = 'inprogress', Review = 'review', Done = 'done' }
  export enum WorkspaceMemberRole { Owner = 'owner', Member = 'member' }
  export enum ProjectMemberRole { Admin = 'admin', Member = 'member' }
  export enum NotificationType { Assigned = 'assigned', Mentioned = 'mentioned', Commented = 'commented', AddedToProject = 'added_to_project' }
  export enum CanvasElementType { Text = 'text', Image = 'image' }

types.ts — export these interfaces:
  IUser { id, email, name, avatarUrl, createdAt }
  IWorkspace { id, name, ownerId, createdAt }
  IWorkspaceMember { id, workspaceId, userId, role, user: IUser }
  IProject { id, workspaceId, name, description, createdBy, createdAt }
  IProjectMember { id, projectId, userId, role, user: IUser }
  ITask { id, projectId, title, description, status: TaskStatus, assigneeId, assignee: IUser | null, snapshotUrl, createdBy, createdAt, updatedAt }
  IComment { id, taskId, authorId, author: IUser, body, canvasX, canvasY, resolvedAt, createdAt, replies: ICommentReply[] }
  ICommentReply { id, commentId, authorId, author: IUser, body, createdAt }
  INotification { id, recipientId, type: NotificationType, resourceId, resourceType, readAt, createdAt }
  IFile { id, taskId, uploaderId, url, mimeType, sizeBytes, createdAt }

canvas-types.ts:
  interface CanvasElement {
    id: string
    type: CanvasElementType
    x: number
    y: number
    width: number
    height: number
    content: string        // text string or image URL
    zIndex: number
    createdBy: string
    createdAt: string
  }

  interface CanvasComment {
    id: string
    x: number
    y: number
    authorId: string
    body: string
    resolvedAt: string | null
    createdAt: string
    replies: Array<{ id: string, authorId: string, body: string, createdAt: string }>
  }

Export everything from packages/shared/src/index.ts.

In both apps/api/tsconfig.json and apps/web/tsconfig.json, add a path alias:
  "@canvas-pm/shared" → "../../packages/shared/src/index.ts"
```

---

# PHASE 2 — AUTHENTICATION

---

## PROMPT 05 — Auth module (register & login)

```
Implement full authentication in apps/api/src/modules/auth/.

--- DTOs ---
Create apps/api/src/modules/auth/dto/:
  register.dto.ts: { email: string (IsEmail), password: string (MinLength 8), name: string (IsString, MinLength 2) }
  login.dto.ts: { email: string (IsEmail), password: string (IsString) }

--- Service ---
In auth.service.ts implement:

  register(dto: RegisterDto): Promise<{ user: IUser, accessToken: string }>
    - Check if email already exists, throw ConflictException if so
    - Hash password with bcryptjs (salt rounds: 12)
    - Save user to DB
    - Return user (without passwordHash) + signed JWT

  login(dto: LoginDto): Promise<{ user: IUser, accessToken: string }>
    - Find user by email, throw UnauthorizedException if not found
    - Compare password with bcryptjs.compare
    - Return user + signed JWT

  validateUser(userId: string): Promise<IUser>
    - Used by JWT strategy to validate token payload

  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>
    - Find user, verify currentPassword, hash and save newPassword

--- JWT Strategy ---
Create apps/api/src/modules/auth/strategies/jwt.strategy.ts
  - Extends PassportStrategy(Strategy)
  - Extract JWT from Authorization: Bearer header
  - Validate payload { sub: userId } by calling authService.validateUser(userId)

--- JWT Setup ---
In auth.module.ts:
  - Import JwtModule.registerAsync with secret from ConfigService
  - Import PassportModule
  - Register JwtStrategy as a provider
  - Export JwtModule

--- Controller ---
POST /auth/register → authService.register()
POST /auth/login    → authService.login()
GET  /auth/me       → @UseGuards(JwtAuthGuard), return req.user
POST /auth/change-password → @UseGuards(JwtAuthGuard), authService.changePassword()

--- Guard ---
Implement JwtAuthGuard in apps/api/src/common/guards/jwt-auth.guard.ts (extend AuthGuard('jwt')).
Implement CurrentUser decorator to extract req.user.

--- Frontend auth store ---
In apps/web/src/store/auth.store.ts (Zustand):
  state: { user: IUser | null, token: string | null, isLoading: boolean }
  actions:
    login(email, password) → POST /auth/login, store token in localStorage, set user
    register(email, password, name) → POST /auth/register, same as login
    logout() → clear user and token from state and localStorage
    loadFromStorage() → rehydrate from localStorage, call GET /auth/me to verify token

In apps/web/src/lib/api.ts:
  - Axios instance with baseURL from env
  - Request interceptor: set Authorization: Bearer <token> from localStorage
  - Response interceptor: on 401, call auth.store.logout()

--- Frontend pages ---
LoginPage (route: /login):
  - Email + password form
  - On success, redirect to /workspaces
  - Show error on failure

RegisterPage (route: /register):
  - Name + email + password form
  - On success, redirect to /workspaces

ProtectedRoute component: checks auth.store.user. If null, redirect to /login.

On app boot in main.tsx: call auth.store.loadFromStorage(). Show full-screen spinner during check.
```

---

# PHASE 3 — WORKSPACES

---

## PROMPT 06 — Workspaces API

```
Implement the workspaces module in apps/api/src/modules/workspaces/.

--- DTOs ---
  create-workspace.dto.ts: { name: string (MinLength 2, MaxLength 100) }
  invite-member.dto.ts: { email: string (IsEmail), role?: WorkspaceMemberRole }

--- Service ---
  create(userId, dto): Create workspace, add creator as 'owner' member. Return workspace.

  findAllForUser(userId): Return all workspaces where user is a member, with memberCount.

  findOne(workspaceId, userId): Return workspace if user is member, else ForbiddenException.

  inviteMember(workspaceId, inviterId, dto):
    - Only owner can invite
    - Find user by email (NotFoundException if not found)
    - ConflictException if already a member
    - Create workspace_member, return with user info

  removeMember(workspaceId, removerId, targetUserId):
    - Only owner can remove. Cannot remove owner.

  getMembers(workspaceId, userId): Return all members with user info.

  update(workspaceId, userId, dto: { name?: string }):
    - Only owner can update. Return updated workspace.

  delete(workspaceId, userId):
    - Only owner can delete. Cascade handled by DB.

--- Controller (all protected with JwtAuthGuard) ---
POST   /workspaces
GET    /workspaces
GET    /workspaces/:workspaceId
PATCH  /workspaces/:workspaceId
DELETE /workspaces/:workspaceId
GET    /workspaces/:workspaceId/members
POST   /workspaces/:workspaceId/members/invite
DELETE /workspaces/:workspaceId/members/:userId
```

---

## PROMPT 07 — Workspaces frontend

```
Build the workspace UI in apps/web.

--- Store (workspace.store.ts) ---
  state: { workspaces: IWorkspace[], currentWorkspace: IWorkspace | null, members: IWorkspaceMember[], isLoading: boolean }
  actions: fetchWorkspaces, createWorkspace, setCurrentWorkspace, fetchMembers, inviteMember, removeMember, updateWorkspace, deleteWorkspace

--- WorkspaceSelectorPage (route: /workspaces) ---
  - On mount, call fetchWorkspaces()
  - Grid of workspace cards (name, member count)
  - Clicking a card: setCurrentWorkspace + navigate to /w/:workspaceId/projects
  - "Create workspace" button → modal with name field

--- AppShell layout ---
Build apps/web/src/components/layout/AppShell.tsx:
  Left sidebar (240px, collapsible to icon-only rail at < 1200px):
    - Workspace name at top (clickable → /workspaces)
    - Nav links: Projects (/w/:id/projects), Settings (/w/:id/settings)
    - User avatar + name at bottom with logout option
  Main content area (flex: 1)

Wrap all /w/:workspaceId/* routes with AppShell and a WorkspaceRoute guard that:
  - Verifies workspace exists in store, fetches if not
  - Redirects to /workspaces with toast if not found or forbidden

--- WorkspaceSettingsPage (route: /w/:workspaceId/settings) ---
  - Workspace name inline edit (blur to save)
  - Members table: avatar, name, email, role badge, Remove button (owner only)
  - "Invite member" button → modal (email + role fields)
  - Danger zone: "Delete workspace" with confirmation modal (type workspace name to confirm)
```

---

# PHASE 4 — PROJECTS

---

## PROMPT 08 — Projects API

```
Implement the projects module in apps/api/src/modules/projects/.

--- DTOs ---
  create-project.dto.ts: { name: string, description?: string }
  update-project.dto.ts: { name?: string, description?: string }
  add-project-member.dto.ts: { userId: string, role?: ProjectMemberRole }
  exclude-workspace-member.dto.ts: { userId: string }

--- Access control logic (reuse across methods) ---
A user can access a project if:
  They are in project_members for that project
  OR they are a workspace_member AND NOT in project_exclusions for that project

--- Service ---
  create(workspaceId, userId, dto):
    - User must be workspace member
    - Create project, add creator as project_member 'admin'

  findAll(workspaceId, userId):
    - Return accessible projects (apply access logic above)
    - Include taskCount and memberCount per project

  findOne(projectId, userId):
    - Apply access logic, throw ForbiddenException if denied

  update(projectId, userId, dto):
    - Only project admin can update

  delete(projectId, userId):
    - Only project admin can delete (DB cascades tasks and canvas data)

  addMember(projectId, requesterId, dto):
    - Only admin can add. ConflictException if already member.

  removeMember(projectId, requesterId, targetUserId):
    - Only admin can remove.

  excludeWorkspaceMember(projectId, requesterId, dto):
    - Only admin can exclude.
    - Create project_exclusions record.
    - Also remove from project_members if present.

  removeExclusion(projectId, requesterId, userId):
    - Delete from project_exclusions.

  getMembers(projectId, userId): Return project members with user info.

--- Controller (all protected with JwtAuthGuard) ---
POST   /workspaces/:workspaceId/projects
GET    /workspaces/:workspaceId/projects
GET    /projects/:projectId
PATCH  /projects/:projectId
DELETE /projects/:projectId
GET    /projects/:projectId/members
POST   /projects/:projectId/members
DELETE /projects/:projectId/members/:userId
POST   /projects/:projectId/exclusions
DELETE /projects/:projectId/exclusions/:userId
```

---

## PROMPT 09 — Projects frontend

```
Build the project UI in apps/web.

--- Store (project.store.ts) ---
  state: { projects: IProject[], currentProject: IProject | null, isLoading: boolean }
  actions: fetchProjects, createProject, setCurrentProject, updateProject, deleteProject

--- ProjectsPage (route: /w/:workspaceId/projects) ---
  - Fetch projects on mount
  - Grid of project cards: name, description (truncated), task count, member avatars (up to 5, then +N)
  - "New project" button → modal (name + description)
  - Clicking a card → /w/:workspaceId/p/:projectId

--- ProjectDetailPage (route: /w/:workspaceId/p/:projectId) ---
  Layout:
    Top bar: project name, "+ New task" button, status filter dropdown, assignee filter
    Tabs: "All tasks" | "Todo" | "In progress" | "Review" | "Done"
    Main area: TaskGrid component (built in Prompt 11)

  Wrap with ProjectRoute guard:
    - Fetch project on mount
    - Show ForbiddenPage on 403, NotFoundPage on 404

--- NewTaskModal ---
Build apps/web/src/components/tasks/NewTaskModal.tsx:
  Props: { projectId: string, onClose: () => void, onCreated: (task: ITask) => void }
  Fields: title (required), description (optional textarea), status (select, default todo), assignee (user select from project members)
  On submit: POST /projects/:projectId/tasks
  Show loading state, close on success and call onCreated

--- ProjectSettingsPage (route: /w/:workspaceId/p/:projectId/settings) ---
  - Project name + description inline edit
  - Members table with roles (same pattern as workspace settings)
  - Excluded members section: list workspace members who are excluded, with "Remove exclusion" button
  - Danger zone: Delete project with confirmation
```

---

# PHASE 5 — TASKS

---

## PROMPT 10 — Tasks API

```
Implement the tasks module in apps/api/src/modules/tasks/.

--- DTOs ---
  create-task.dto.ts: { title: string, description?: string, status?: TaskStatus, assigneeId?: string }
  update-task.dto.ts: { title?: string, description?: string, status?: TaskStatus, assigneeId?: string }

--- Service ---
  create(projectId, userId, dto):
    - Verify user has project access
    - Create task record
    - Create empty canvas_documents record for this task (call CanvasService.createEmpty)
    - Return task with assignee info

  findAll(projectId, userId, filters?: { status?, assigneeId? }):
    - Verify access
    - Return filtered tasks with assignee info, ordered by createdAt desc

  findOne(taskId, userId):
    - Return task with assignee info, verify access

  update(taskId, userId, dto):
    - Verify access
    - If assigneeId changed, create 'assigned' notification via NotificationsService
    - Return updated task

  updateSnapshot(taskId, snapshotUrl):
    - Internal method, no auth check
    - Update task.snapshotUrl

  delete(taskId, userId):
    - Only project admin can delete

--- Controller (all protected with JwtAuthGuard) ---
POST   /projects/:projectId/tasks              → create
GET    /projects/:projectId/tasks              → findAll (query: status, assigneeId)
GET    /tasks/:taskId                          → findOne
PATCH  /tasks/:taskId                          → update
DELETE /tasks/:taskId                          → delete
PATCH  /tasks/:taskId/snapshot                 → updateSnapshot (body: { snapshotUrl })
```

---

## PROMPT 11 — Task grid view (frontend)

```
Build the task grid and task card components.

--- Store (task.store.ts) ---
  state: {
    tasks: ITask[],
    currentTask: ITask | null,
    isLoading: boolean,
    rowOrder: TaskStatus[]    ← per-user preference, persisted in localStorage
    rowLimit: number          ← per-user preference, default 10
  }
  actions:
    fetchTasks(projectId, filters?)
    createTask(projectId, dto)
    updateTask(taskId, dto)  ← optimistic update (apply locally, revert on error)
    deleteTask(taskId)
    setCurrentTask(task)
    setRowOrder(order)       ← persist to localStorage
    setRowLimit(n)           ← persist to localStorage
    loadPreferences()        ← rehydrate from localStorage on boot

--- TaskCard component ---
Build apps/web/src/components/tasks/TaskCard.tsx:
  Props: { task: ITask, onClick: () => void }
  Display:
    - Canvas thumbnail (task.snapshotUrl) — gray placeholder if null
    - Task title (bold, max 2 lines, text-overflow ellipsis)
    - Description (muted, max 2 lines, ellipsis)
    - Assignee avatar bottom-right (initials if no avatarUrl)
    - Status badge: todo=gray, inprogress=blue, review=amber, done=green
    - Created date (relative: "2 days ago")
  Style: rounded card, subtle border, hover shadow, cursor pointer

--- TaskCardSkeleton component ---
Shimmer placeholder matching TaskCard dimensions (for loading state).

--- TaskGrid component ---
Build apps/web/src/components/tasks/TaskGrid.tsx:
  Props: { projectId: string, activeTab: 'all' | TaskStatus, filters: { assigneeId?: string } }

  "All tasks" tab:
    - 4 horizontal sections, order from task.store.rowOrder (user configurable)
    - Each section: status label + count badge + "Show more →" link + horizontal scroll row of TaskCards (up to rowLimit)
    - "Show more →" switches the active tab to that status
    - Reorder button (top right) → drag-and-drop list of the 4 statuses (use @dnd-kit/core)

  Status tabs:
    - Flat grid (4 columns desktop, 2 columns tablet) of all tasks for that status
    - No limit, show all
    - Empty state: "No tasks here yet"

  Loading state: show 8 TaskCardSkeleton components while fetching

  On TaskCard click: navigate to /tasks/:taskId/canvas

Wire up in ProjectDetailPage with filters from the filter dropdowns.
```

---

# PHASE 6 — CANVAS

---

## PROMPT 12 — Canvas backend (Yjs persistence & snapshots)

```
Implement the canvas module in apps/api/src/modules/canvas/.

--- Yjs persistence ---
Install 'yjs' in apps/api.

CanvasService methods:

  getDoc(taskId): Promise<Buffer | null>
    - Find canvas_document by taskId, return doc Buffer or null

  saveDoc(taskId, update: Buffer): Promise<void>
    - Find existing canvas_document
    - If exists: apply incoming update to the stored doc using Y.applyUpdate, then re-encode with Y.encodeStateAsUpdate
    - If not exists: store the update directly
    - Upsert canvas_document

  createEmpty(taskId): Promise<void>
    - Create canvas_documents row with empty Y.Doc binary (Y.encodeStateAsUpdate(new Y.Doc()))

  generateAndSaveSnapshot(taskId, dataUrl: string): Promise<string>
    - Strip "data:image/png;base64," prefix from dataUrl
    - Convert to Buffer
    - Upload to R2 using @aws-sdk/client-s3 (install it)
    - Key: snapshots/{taskId}/{Date.now()}.png
    - Construct URL: {R2_ENDPOINT}/{R2_BUCKET}/{key}
    - Call TasksService.updateSnapshot(taskId, url)
    - Return the URL

--- Controller (protected with JwtAuthGuard) ---
GET  /canvas/:taskId         → getDoc, returns raw binary (Content-Type: application/octet-stream)
POST /canvas/:taskId         → saveDoc, accepts raw binary body
POST /canvas/:taskId/snapshot → generateAndSaveSnapshot, body: { dataUrl: string }

For the raw binary POST body, configure NestJS to pass the raw Buffer.
Use @nestjs/platform-express with express.raw() middleware for this specific route.
```

---

## PROMPT 13 — y-websocket server

```
Set up the Yjs WebSocket sync server as a separate process in apps/api.

Create apps/api/src/ws-server.ts:

Install: ws, y-websocket (use the server utilities from y-websocket/bin/utils)

Setup:
  - HTTP server on WS_PORT (default 1234)
  - Attach the Yjs WebSocket server to it
  - Each room name = taskId

--- Authentication ---
  - On WebSocket upgrade, extract ?token= from the URL query string
  - Verify JWT using jsonwebtoken.verify(token, JWT_SECRET)
  - If invalid, close connection with code 4001
  - If valid, attach userId to the socket connection

--- Persistence ---
  On document load (when first client joins a room):
    GET http://localhost:{PORT}/canvas/{taskId}
    If response has binary data, apply it to the in-memory Y.Doc

  On document update (debounced 2000ms after last update):
    POST http://localhost:{PORT}/canvas/{taskId} with the current Y.encodeStateAsUpdate binary

--- Presence ---
  Relay Yjs Awareness updates to all other clients in the same room.
  On disconnect, Yjs automatically clears the awareness state for that client.

--- Start script ---
Add to apps/api/package.json:
  "ws": "ts-node src/ws-server.ts"

Add "dev:ws" to root package.json concurrently command alongside api and web.

--- Frontend connection helper ---
In apps/web/src/lib/ws.ts:

  export function connectToCanvas(taskId: string, token: string) {
    const ydoc = new Y.Doc()
    const wsUrl = `${import.meta.env.VITE_WS_URL}/${taskId}?token=${token}`
    const provider = new WebsocketProvider(wsUrl, taskId, ydoc)
    return { ydoc, provider, awareness: provider.awareness }
  }

  export function disconnectFromCanvas(provider: WebsocketProvider) {
    provider.destroy()
  }
```

---

## PROMPT 14 — Canvas stage (frontend)

```
Build the main canvas rendering component using Konva.js and Yjs.

--- Yjs data structure ---
The Y.Doc has:
  ydoc.getArray('elements')  ← Y.Array of Y.Maps (canvas elements)
  ydoc.getArray('comments')  ← Y.Array of Y.Maps (comment pins)

Each element Y.Map keys: id, type, x, y, width, height, content, zIndex, createdBy, createdAt

--- CanvasStage component ---
Build apps/web/src/components/canvas/CanvasStage.tsx
Props: { taskId: string, ydoc: Y.Doc, awareness: Awareness, currentUser: IUser, activeTool: string, onPinClick: (commentId: string) => void }

On mount:
  - Observe ydoc.getArray('elements') for changes → re-render
  - Observe ydoc.getArray('comments') for changes → re-render pins
  - Observe awareness → re-render remote cursors

Stage setup:
  - Full viewport minus toolbar and right pane
  - Wheel → zoom (scale stage, clamp 0.2x–3x)
  - Space+drag or middle-mouse → pan
  - Subtle dot-grid background (fixed, does not pan)

Rendering elements:
  - Text: Konva.Text, editable on double-click (Konva.Transformer + textarea overlay)
  - Image: Konva.Image (load from content URL), gray placeholder while loading
  - Selected element: Konva.Transformer (resize handles) + delete button (X in top-right)

Interactions:
  - Click element → select (show transformer)
  - Double-click text → enter edit mode
  - Drag element → on dragend, update Y.Map in ydoc
  - Resize → on transformend, update Y.Map in ydoc
  - Click empty canvas → deselect
  - Delete/Backspace → delete selected element from ydoc array
  - Escape → deselect or exit edit mode

All ydoc mutations inside ydoc.transact(() => { ... })
Konva only renders — never owns state.

Comment pins:
  - Render each comment Y.Map as a Konva.Group at (canvasX, canvasY)
  - Circle with author color (from getUserColor), initials text
  - Reply count badge if replies.length > 0
  - Clicking a pin calls onPinClick(commentId)

Remote cursors:
  - Render other users' cursors as labeled pointer shapes (use Konva.Arrow or a custom shape)
  - Smooth position updates with requestAnimationFrame lerp

Snapshot trigger:
  - After any element mutation, debounce 3000ms
  - stage.toDataURL({ pixelRatio: 1 }) → POST to /canvas/:taskId/snapshot
  - Handle upload silently (no UI feedback needed)

--- Yjs UndoManager ---
After creating the ydoc:
  const undoManager = new Y.UndoManager(ydoc.getArray('elements'))
Export undoManager from this component so keyboard shortcuts can call undo/redo.

--- CanvasToolbar component ---
Build apps/web/src/components/canvas/CanvasToolbar.tsx
Props: { ydoc: Y.Doc, taskId: string, currentUser: IUser, activeTool: string, onToolChange: (tool: string) => void, onToggleComments: () => void }

Tool buttons (icon buttons, keyboard shortcuts shown in tooltip):
  Select (V), Text (T), Image (I), Comment (C)

Tool behaviors:
  Select: default — click/drag on stage
  Text: on stage click → add element Y.Map { type:'text', x, y, width:200, height:40, content:'Text', zIndex, createdBy, createdAt } → enter edit mode
  Image: open file picker → POST /files → on success add element Y.Map { type:'image', content:fileUrl, x, y, width:300, height:200 }
  Comment: on stage click → open CommentCompose popover at click coords

Right side: zoom level (click to reset to 100%), comments toggle button
```

---

## PROMPT 15 — Task canvas page (frontend)

```
Build the full TaskCanvasPage that assembles canvas, toolbar, comment pane, and presence bar.

Route: /tasks/:taskId/canvas

--- Layout ---
┌──────────────────────────────────────────────┐
│  CanvasTopBar                                │
├──────────────────────────────────────────────┤
│  CanvasToolbar                               │
├─────────────────────────────┬────────────────┤
│                             │                │
│  CanvasStage (flex: 1)      │  CommentPane   │
│                             │  (300px)       │
│                             │  collapsible   │
└─────────────────────────────┴────────────────┘

Comment pane slides in/out. CanvasStage takes full width when pane is hidden.

--- Page logic ---
On mount:
  1. GET /tasks/:taskId → populate TopBar
  2. connectToCanvas(taskId, token) from lib/ws.ts
  3. Store ydoc, provider, awareness in useRef
  4. Load comments: GET /tasks/:taskId/comments → populate ydoc.getArray('comments')

On unmount: disconnectFromCanvas(provider)

--- canvas.store.ts ---
  state: {
    activeTool: 'select' | 'text' | 'image' | 'comment'
    selectedElementId: string | null
    isCommentPaneOpen: boolean
    activeCommentId: string | null
    zoom: number
  }
  actions: setActiveTool, setSelectedElement, toggleCommentPane, setActiveComment, setZoom

--- CanvasTopBar component ---
Build apps/web/src/components/canvas/CanvasTopBar.tsx:
  Left: "← Back" link to project page
  Center: editable task title (click → input, blur → PATCH /tasks/:taskId with { title })
  Right:
    - Status badge → dropdown to change status (PATCH /tasks/:taskId with { status })
    - Assignee avatar → user selector popover (PATCH /tasks/:taskId with { assigneeId })
    - Presence avatars: from awareness, colored rings, up to 5 + "+N more", hover tooltip with name
    - Comments toggle button

--- Keyboard shortcuts ---
On the canvas page:
  V → setActiveTool('select')
  T → setActiveTool('text')
  I → setActiveTool('image')
  C → setActiveTool('comment')
  Ctrl+Z → undoManager.undo()
  Ctrl+Shift+Z / Ctrl+Y → undoManager.redo()
  Delete / Backspace → delete selected element
  Escape → deselect / exit edit mode

Wire up these shortcuts with a useEffect on keydown on the document, only when the canvas page is mounted.

--- Presence in TopBar ---
Subscribe to awareness changes.
For each user (excluding self), show a circular avatar with a colored ring.
Derive color from getUserColor(userId).
Tooltip on hover: user's full name.
```

---

# PHASE 7 — COMMENTS

---

## PROMPT 16 — Comments API

```
Implement the comments module in apps/api/src/modules/comments/.

--- DTOs ---
  create-comment.dto.ts: { taskId: string, body: string, canvasX: number, canvasY: number }
  create-reply.dto.ts: { body: string }

--- Service ---
  create(userId, dto):
    - Verify user has project access (via task's projectId)
    - Create comment record
    - Parse body for @mentions (regex /@(\w+)/g) → find users by name → create 'mentioned' notifications
    - Create 'commented' notification for task assignee (skip if assignee is commenter)
    - Return comment with author info and empty replies array

  findAll(taskId, userId):
    - Verify access
    - Return all comments (resolved and unresolved) with author info and replies with author info
    - Order by createdAt asc

  createReply(commentId, userId, dto):
    - Verify access
    - Create comment_reply
    - Parse @mentions, create notifications
    - Notify original comment author (if not the replier)
    - Return reply with author info

  resolve(commentId, userId):
    - Set resolvedAt = now, return comment

  unresolve(commentId, userId):
    - Set resolvedAt = null, return comment

  delete(commentId, userId):
    - Only comment author or project admin can delete

--- Controller (all protected with JwtAuthGuard) ---
GET    /tasks/:taskId/comments
POST   /comments
POST   /comments/:commentId/replies
PATCH  /comments/:commentId/resolve
PATCH  /comments/:commentId/unresolve
DELETE /comments/:commentId

--- Dual storage strategy ---
Comments are stored in BOTH Yjs (for live canvas rendering) AND Postgres (persistent source).
On canvas page load, the frontend:
  1. GET /tasks/:taskId/comments from Postgres
  2. Populate ydoc.getArray('comments') with the fetched data
This ensures pins are visible immediately on load and persist across sessions.
When a new comment is created:
  1. POST /comments to Postgres (gets the real ID back)
  2. Add to ydoc.getArray('comments') with the real ID
```

---

## PROMPT 17 — Comment pane & pins (frontend)

```
Build the comment pane and comment pin components.

--- CommentPane component ---
Build apps/web/src/components/comments/CommentPane.tsx
Props: { taskId: string, ydoc: Y.Doc, currentUser: IUser, activeCommentId: string | null, onCommentClick: (id: string) => void }

On mount:
  - GET /tasks/:taskId/comments
  - Store in local state (separate from ydoc — pane renders from API data, canvas renders from ydoc)

Layout:
  Header: "Comments" title, X close button, "Show resolved" toggle
  Body: scrollable thread list (newest first)

Each thread:
  - Author avatar + name + relative timestamp
  - Comment body (render @mentions as highlighted inline spans)
  - Small pin indicator "📍 {canvasX}, {canvasY}" (muted text)
  - Replies (indented)
  - Reply textarea (shown on hover or when thread is active)
  - Resolve button (checkmark) / Unresolve if already resolved
  - Resolved threads: greyed out, collapsed, shown only with "Show resolved" toggle

Active thread behavior:
  - When activeCommentId matches, highlight with subtle background
  - Auto-scroll into view
  - Clicking a thread calls onCommentClick(id) which pans the canvas to that pin

Reply submit:
  - POST /comments/:id/replies
  - Optimistic append to local state, revert on error

--- CommentCompose popover ---
Build apps/web/src/components/comments/CommentCompose.tsx
Props: { screenX: number, screenY: number, canvasX: number, canvasY: number, onSubmit: (body: string) => void, onCancel: () => void }

  - Absolute-positioned popover at (screenX, screenY)
  - Textarea (auto-focus), Submit and Cancel buttons
  - Enter (without shift) submits
  - Escape cancels

On submit: parent (CanvasStage) calls POST /comments, gets real ID back, then adds to ydoc.

--- CommentPin (Konva element in CanvasStage) ---
Already handled in CanvasStage (Prompt 14). Ensure:
  - Pin color: getUserColor(comment.authorId)
  - Author initials centered in pin circle
  - Reply count badge (top-right, visible if replies.length > 0)
  - Resolved pins: 50% opacity, gray fill
  - Active pin (activeCommentId match): slightly larger, pulsing ring animation

When a pin is clicked:
  - canvas.store.setActiveComment(commentId)
  - canvas.store opens comment pane if not open
  - Comment pane auto-scrolls to that thread
```

---

# PHASE 8 — FILES

---

## PROMPT 18 — File upload

```
Implement file uploads for canvas images.

--- Backend ---
Install: @aws-sdk/client-s3, multer, @types/multer

FilesService:

  upload(taskId, uploaderId, file: Express.Multer.File): Promise<IFile>
    - Validate: only image/* mimeTypes, max 10MB (throw BadRequestException otherwise)
    - Generate key: files/{taskId}/{uuid}.{ext}
    - PutObjectCommand to R2 using S3Client (config from env: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET)
    - Construct URL: {R2_ENDPOINT}/{R2_BUCKET}/{key}
    - Save file record to DB
    - Return IFile

  delete(fileId, userId): Promise<void>
    - Only uploader or project admin can delete
    - DeleteObjectCommand to remove from R2
    - Delete DB record

FilesController (protected with JwtAuthGuard):
  POST /files
    - FileInterceptor('file') from @nestjs/platform-express
    - Body field: taskId (string)
    - Returns IFile

  DELETE /files/:fileId

Configure MulterModule in FilesModule with memoryStorage() — no disk writes.

--- Frontend ---
In CanvasToolbar, for the Image tool:
  - On tool click + canvas click: open hidden <input type="file" accept="image/*">
  - On file select:
      1. Show loading placeholder on canvas at click position
      2. POST to /files with FormData { taskId, file }
      3. On success: add element Y.Map { type:'image', content:fileUrl, x, y, width:300, height:200, ... }
      4. Remove loading placeholder
  - On error: show toast "Image upload failed"

--- Toast system ---
Build apps/web/src/components/ui/Toast.tsx:
  - A toast container fixed at bottom-right
  - Toasts auto-dismiss after 4 seconds
  - Types: success (green), error (red), info (blue)
  - Manage via notifications.store.ts or a separate toast.store.ts with addToast / removeToast actions
  - Export a useToast() hook for easy use anywhere
```

---

# PHASE 9 — NOTIFICATIONS

---

## PROMPT 19 — Notifications API & real-time delivery

```
Implement the notifications module.

--- Backend ---
Install: @nestjs/websockets @nestjs/platform-socket.io socket.io

NotificationsService:

  create(dto: { recipientId, type, resourceId, resourceType }): Promise<void>
    - Skip if recipientId === actor (no self-notifications)
    - Save notification to DB
    - Call notificationsGateway.pushToUser(recipientId, notification)

  findAll(userId): Return all notifications for user, newest first, limit 50.
  markRead(notificationId, userId): Set readAt = now.
  markAllRead(userId): Set readAt = now for all unread of this user.
  getUnreadCount(userId): Count where readAt IS NULL and recipientId = userId.

NotificationsGateway (@WebSocketGateway, namespace: '/notifications'):
  On connection:
    - Extract token from handshake.auth.token
    - Verify JWT → get userId
    - socket.join(userId)  ← join a room named after the userId

  pushToUser(userId, notification):
    - this.server.to(userId).emit('notification', notification)

NotificationsController (all protected with JwtAuthGuard):
  GET    /notifications
  GET    /notifications/unread-count
  PATCH  /notifications/read-all
  PATCH  /notifications/:id/read

--- Frontend ---
In apps/web/src/lib/notifications-socket.ts:
  - Connect to socket.io /notifications namespace: io(VITE_API_URL + '/notifications', { auth: { token } })
  - On 'notification' event: call notifications.store.addNotification(notification)
  - Export connect() and disconnect() functions

Call connect() in main.tsx after auth.store confirms user is logged in.
Call disconnect() on logout.

--- notifications.store.ts ---
  state: { notifications: INotification[], unreadCount: number }
  actions:
    fetchNotifications() → GET /notifications
    fetchUnreadCount() → GET /notifications/unread-count
    markRead(id) → PATCH, update local state
    markAllRead() → PATCH, update local state
    addNotification(n) → prepend to list, increment unreadCount

--- NotificationBell component ---
Build apps/web/src/components/ui/NotificationBell.tsx:
  - Bell icon in AppShell top bar
  - Red badge with unreadCount (hidden if 0)
  - Clicking: open dropdown panel
  Panel:
    - "Mark all read" button (top)
    - List of notifications: icon by type + message + relative time + read/unread dot
    - Unread: highlighted background
    - Clicking a row: markRead(id), navigate to resourceType/resourceId
    - Empty state: "You're all caught up ✓"

Notification messages:
  assigned:         "{actor name} assigned you to "{task title}""
  mentioned:        "{actor name} mentioned you in "{task title}""
  commented:        "{actor name} commented on "{task title}""
  added_to_project: "{actor name} added you to "{project name}""
```

---

# PHASE 10 — PRESENCE

---

## PROMPT 20 — Presence (cursors & avatars)

```
Implement real-time presence on the canvas using Yjs Awareness.

--- User color assignment ---
In apps/web/src/lib/user-color.ts:
  const PALETTE = ['#E85D75','#5D9AE8','#E8B45D','#5DE87A','#B45DE8','#5DD4E8','#E8725D','#5DE8C1']
  export function getUserColor(userId: string): string {
    // hash the userId string to a palette index
    const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return PALETTE[hash % PALETTE.length]
  }

--- Awareness state ---
Each client sets:
  { userId, name, avatarUrl, color: getUserColor(userId), cursor: { x, y } | null }

In TaskCanvasPage on mount (after connecting):
  awareness.setLocalState({ userId: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl, color: getUserColor(currentUser.id), cursor: null })

In CanvasStage, on Konva stage mousemove (throttled 50ms):
  awareness.setLocalStateField('cursor', { x: pointerPos.x, y: pointerPos.y })

On stage mouseleave:
  awareness.setLocalStateField('cursor', null)

On page unmount:
  awareness.setLocalState(null)

--- Rendering remote cursors (in CanvasStage) ---
Subscribe to awareness changes:
  awareness.on('change', () => {
    const states = Array.from(awareness.getStates().values()).filter(s => s.userId !== currentUser.id)
    setRemoteUsers(states)
  })

For each remoteUser with cursor != null:
  Render a Konva.Group at their cursor position (account for stage scale + offset):
    - Small triangle/arrow shape (Konva.Path) in their color
    - Name label below the pointer, same color background, white text
  Smooth movement with lerp via requestAnimationFrame.

--- Presence avatars in TopBar (in CanvasTopBar) ---
Subscribe to awareness changes.
Show circular avatar chips for all connected users (including self, slightly dimmed).
Each chip: avatar or initials, colored ring matching getUserColor(userId).
Up to 5 visible, "+N" for overflow.
Tooltip on hover: user's full name + "You" for self.
```

---

# PHASE 11 — POLISH & COMPLETION

---

## PROMPT 21 — Users module (profile & avatar)

```
Implement the users module in apps/api/src/modules/users/.

--- Service ---
  findMe(userId): Return current user (IUser without passwordHash)

  updateMe(userId, dto: { name?: string }): Promise<IUser>
    - Update user record, return updated user

  updateAvatar(userId, file: Express.Multer.File): Promise<IUser>
    - Validate: image/* only, max 5MB
    - Upload to R2, key: avatars/{userId}.{ext}
    - If user had a previous avatar in R2, delete it (DeleteObjectCommand)
    - Update user.avatarUrl, return updated user

--- Controller (protected with JwtAuthGuard) ---
GET   /users/me          → findMe
PATCH /users/me          → updateMe (body: { name })
POST  /users/me/avatar   → updateAvatar (FileInterceptor, field: 'file')

--- Frontend (ProfilePage) ---
Route: /settings/profile

Sections:
  Profile:
    - Current avatar (large, with an "Upload photo" overlay on hover)
    - Name field (editable, save on blur or button click → PATCH /users/me)
    - Email (read-only, label: "Email cannot be changed")

  Avatar upload:
    - Clicking the avatar opens a file picker (image/* only)
    - POST /users/me/avatar with FormData { file }
    - On success: update auth.store.user.avatarUrl + show success toast

  Change password:
    - Current password, new password, confirm new password
    - POST /auth/change-password
    - Show success toast, clear form on success
    - Show error toast on wrong current password

Update auth.store.user after any successful profile update.
Add a "Profile" link in the AppShell sidebar bottom section (next to user avatar).
```

---

## PROMPT 22 — Error handling, loading states & accessibility

```
Apply comprehensive error handling, loading states, and accessibility across the app.

--- Backend ---
Refine http-exception.filter.ts:
  Return consistent error shape: { statusCode, message, error, timestamp, path }

Add a TypeORM exception interceptor that maps:
  - QueryFailedError code '23505' → ConflictException("Already exists")
  - EntityNotFoundError → NotFoundException

--- Frontend API error handling ---
In apps/web/src/lib/api.ts:
  On 4xx/5xx: extract message from response.data.message, throw typed ApiError { message, statusCode }

Custom hook apps/web/src/lib/use-query.ts:
  useQuery<T>({ queryFn, onError?, showErrorToast? = true })
  Returns: { data, isLoading, error, refetch }
  Shows toast on error by default.

--- Loading states ---
TaskGrid: show 8 TaskCardSkeleton while fetching
Canvas page: show centered spinner while provider.synced === false (Yjs not yet connected)
Comment pane: show 3 skeleton comment threads while fetching
Notification panel: show 5 skeleton rows while fetching

Build Skeleton component (apps/web/src/components/ui/Skeleton.tsx):
  Div with shimmer animation (CSS keyframes, background gradient that animates left-to-right)
  Props: { width?, height?, className? }

--- Empty states ---
No workspaces: "Create your first workspace" + button
No projects: "No projects yet. Create one." + button
No tasks: "Nothing here yet" (per status tab)
No notifications: "You're all caught up" + checkmark icon
No comments: "No comments yet. Use the comment tool (C) to add one."

--- Form validation ---
All forms: required fields show "This field is required" on blur if empty.
Email: validate format. Password: min 8 chars. Confirm password: must match.
Disable submit button if form is invalid. Clear errors when user starts typing.

--- Accessibility ---
All icon-only buttons must have aria-label.
All form inputs must have associated <label> or aria-label.
Modals: trap focus (Tab cycles within modal), Escape closes.
Status badges: include text label, not color only.
Canvas toolbar buttons: aria-label + keyboard shortcut in tooltip.
```

---

## PROMPT 23 — Auth guards, route protection & session management

```
Harden frontend routing and session management.

--- Route guards ---

ProtectedRoute:
  - Checks auth.store.user
  - While loadFromStorage() is running: show full-screen spinner
  - If no user after check: redirect to /login

WorkspaceRoute (wraps /w/:workspaceId/*):
  - On mount: verify workspaceId in store, fetch workspace if not loaded
  - On 403: redirect to /workspaces with toast "Access denied"
  - On 404: redirect to /workspaces with toast "Workspace not found"
  - Loads workspace members into store on mount

ProjectRoute (wraps /w/:workspaceId/p/:projectId/*):
  - On mount: GET /projects/:projectId
  - On 403: show ForbiddenPage (inline, not redirect)
  - On 404: show NotFoundPage

CanvasRoute (wraps /tasks/:taskId/canvas):
  - On mount: GET /tasks/:taskId
  - On 404: show NotFoundPage
  - If no snapshotUrl: that's fine, render empty canvas

--- Session persistence ---
In auth.store.loadFromStorage():
  1. Read token from localStorage
  2. If token exists: call GET /auth/me with the token
  3. If 200: set user in state
  4. If 401: clear token, redirect to /login
  5. If no token: stay on /login

Call loadFromStorage() before the router renders (in main.tsx before <RouterProvider>).

--- Error pages ---
Build ForbiddenPage and NotFoundPage:
  Centered layout, icon, message, "Go back" button (history.back())
  ForbiddenPage: "You don't have access to this"
  NotFoundPage: "This page doesn't exist"

Register a catch-all route in the router: path="*" → NotFoundPage
```

---

## PROMPT 24 — Performance & UX refinements

```
Apply performance optimizations and UX polish across the app.

--- Canvas performance ---
In CanvasStage.tsx:
  - Use React.memo to prevent re-renders when props haven't changed
  - Track element changes by ID — only update Konva nodes that actually changed
  - Lazy-load react-konva with dynamic import (React.lazy + Suspense) to reduce initial bundle
  - Show a slim progress bar (top of page) while Yjs syncing (provider.synced === false)

Image loading on canvas:
  - Cache loaded HTMLImageElement objects in a Map keyed by URL
  - Show gray placeholder rect while image loads
  - On load: replace with Konva.Image
  - On error: show "broken image" placeholder (red tint, icon text)

--- Optimistic updates ---
In task.store.updateTask:
  1. Save previous state
  2. Apply change to local state immediately
  3. PATCH /tasks/:taskId
  4. On error: revert to previous state + show error toast

In comment pane replies: optimistic append, revert on error.

--- Keyboard shortcuts ---
Ensure these all work on the canvas page:
  V, T, I, C → tool switch
  Ctrl+Z → undoManager.undo()
  Ctrl+Shift+Z / Ctrl+Y → undoManager.redo()
  Delete/Backspace → delete selected element
  Escape → deselect / close popover / exit edit mode

Use a single useEffect with keydown listener on document, active only when canvas page is mounted.
Prevent shortcuts from firing when a text input or textarea is focused.

--- Responsive layout ---
Desktop-first but handle smaller screens:
  - AppShell sidebar: icon-only rail at < 1200px
  - TaskGrid: 4 columns → 2 columns at < 900px
  - Canvas page: hide comment pane by default at < 1400px
  - All modals: scrollable on short screens (max-height: 90vh, overflow-y: auto)

--- UX polish ---
  - All modals: animate in with subtle fade + scale (CSS transition)
  - Toast notifications: slide in from bottom-right
  - Canvas element selection: smooth transformer animation (already Konva default)
  - Task card hover: smooth shadow transition (CSS transition: box-shadow 150ms)
  - Navigation: show a slim loading bar at top of page during route transitions
  - Relative timestamps: use a simple util that returns "just now", "2 min ago", "3 hours ago", "2 days ago", "Mar 15"
```

---

## PROMPT 25 — Integration verification & README

```
Wire everything together, verify all flows end-to-end, and write the README.

--- Verify these 5 flows work completely ---

Flow 1 — Auth & workspace:
  Register User A. Create a workspace. Invite User B by email.
  User B logs in, sees the workspace. User A excludes User B from one project.
  User B cannot see that project. No errors, no 500s.

Flow 2 — Tasks:
  Create 3 tasks in different statuses (todo, inprogress, done).
  All appear in the "All tasks" tab in the correct status rows.
  Drag to reorder rows — order persists after page refresh (localStorage).
  Clicking a task navigates to the canvas page.

Flow 3 — Real-time canvas (two browser windows):
  Open the same task canvas in two windows as different users.
  User A adds a text element — appears for User B within ~1 second.
  User B moves it — User A sees it move.
  Both cursors visible. Presence avatars show in TopBar.
  After 3 seconds of inactivity, a snapshot is saved — visible on the task card after refresh.

Flow 4 — Comments:
  User A drops a comment pin on the canvas. Pin appears visually.
  Comment appears in the right pane.
  User B replies. User A receives an in-app notification (bell badge increments).
  Clicking the notification navigates to the task canvas and highlights the comment thread.
  Resolving the comment grays it out on the canvas pin and in the pane.

Flow 5 — Snapshot:
  Edit something on the canvas. Wait 3 seconds.
  Navigate back to the project page.
  The task card thumbnail has updated.

--- Common issues to fix before shipping ---
Check and fix:
  - CORS errors (verify CLIENT_URL env is set correctly, credentials: true on both sides)
  - WebSocket auth failing (token passed correctly as query param to y-websocket)
  - Yjs state not persisting (canvas_documents upsert logic in CanvasService.saveDoc)
  - Notification socket not connecting after login (ensure connect() is called after token is set)
  - R2 uploads failing with 403 (check bucket CORS policy allows PUT from CLIENT_URL)
  - Snapshot not updating on task card (check PATCH /tasks/:id/snapshot endpoint and snapshotUrl field)
  - Comment pins not appearing on canvas after page reload (check comments load → ydoc population on mount)

--- README.md ---
Create README.md at the monorepo root:

# Mesh

Canvas-first project management tool. Each task is a freeform, collaborative canvas.

## Prerequisites
- Node 20+
- Docker & Docker Compose

## Setup
```bash
# 1. Install dependencies
npm install

# 2. Start postgres and redis
docker-compose up -d

# 3. Copy env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Edit both .env files with your values

# 4. Run database migrations
cd apps/api && npm run migration:run

# 5. Start everything
cd ../.. && npm run dev
```

## What runs
- API: http://localhost:3000
- Web: http://localhost:5173
- Yjs WebSocket: ws://localhost:1234

## Architecture
- Monorepo: npm workspaces (apps/api, apps/web, packages/shared)
- Backend: NestJS + TypeORM + PostgreSQL
- Frontend: React + Vite + Konva.js
- Real-time: Yjs + y-websocket (self-hosted)
- Presence: Yjs Awareness protocol
- Files: Cloudflare R2 (S3-compatible)
- Notifications: Socket.io (/notifications namespace)

## Key decisions
- Konva.js renders the canvas; Yjs owns all canvas state
- Snapshots: client-side toDataURL(), debounced 3s, uploaded to R2
- Comments stored in both Postgres (persistent) and Yjs (live canvas pins)
- Workspace members can be excluded from specific projects
```

---

# APPENDIX — QUICK REFERENCE

---

## API endpoints summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register |
| POST | /auth/login | Login |
| GET | /auth/me | Current user |
| POST | /auth/change-password | Change password |
| GET | /workspaces | List my workspaces |
| POST | /workspaces | Create workspace |
| PATCH | /workspaces/:id | Update workspace |
| DELETE | /workspaces/:id | Delete workspace |
| GET | /workspaces/:id/members | List workspace members |
| POST | /workspaces/:id/members/invite | Invite member |
| DELETE | /workspaces/:id/members/:userId | Remove member |
| GET | /workspaces/:id/projects | List projects |
| POST | /workspaces/:id/projects | Create project |
| GET | /projects/:id | Get project |
| PATCH | /projects/:id | Update project |
| DELETE | /projects/:id | Delete project |
| GET | /projects/:id/members | List project members |
| POST | /projects/:id/members | Add project member |
| DELETE | /projects/:id/members/:userId | Remove project member |
| POST | /projects/:id/exclusions | Exclude workspace member |
| DELETE | /projects/:id/exclusions/:userId | Remove exclusion |
| GET | /projects/:id/tasks | List tasks (filterable) |
| POST | /projects/:id/tasks | Create task |
| GET | /tasks/:id | Get task |
| PATCH | /tasks/:id | Update task |
| DELETE | /tasks/:id | Delete task |
| PATCH | /tasks/:id/snapshot | Update snapshot URL |
| GET | /canvas/:taskId | Get Yjs doc binary |
| POST | /canvas/:taskId | Save Yjs doc binary |
| POST | /canvas/:taskId/snapshot | Upload canvas snapshot |
| GET | /tasks/:taskId/comments | List comments |
| POST | /comments | Create comment pin |
| POST | /comments/:id/replies | Reply to comment |
| PATCH | /comments/:id/resolve | Resolve thread |
| PATCH | /comments/:id/unresolve | Unresolve thread |
| DELETE | /comments/:id | Delete comment |
| POST | /files | Upload file |
| DELETE | /files/:id | Delete file |
| GET | /notifications | List notifications |
| GET | /notifications/unread-count | Unread count |
| PATCH | /notifications/read-all | Mark all read |
| PATCH | /notifications/:id/read | Mark one read |
| GET | /users/me | Get profile |
| PATCH | /users/me | Update profile |
| POST | /users/me/avatar | Upload avatar |

---

## Technology decisions (do not change)

| Concern | Choice | Why |
|---------|--------|-----|
| Canvas rendering | Konva.js | Predictable render model; Yjs owns state |
| Real-time sync | Yjs + y-websocket (self-hosted) | Full control, fits NestJS infra |
| Yjs data | Y.Array of Y.Maps | Granular conflict resolution per element |
| Snapshot | Client-side toDataURL(), debounced 3s | Simple, no server-side rendering needed |
| Notifications RT | Socket.io /notifications namespace | Separate from Yjs, simpler for targeted delivery |
| Presence | Yjs Awareness protocol | Built into y-websocket, no extra infra |
| File storage | Cloudflare R2 (S3-compatible) | Cheaper egress than S3 |
| Auth | JWT + bcrypt | Simple, stateless, email/password first |
| DB | PostgreSQL + TypeORM | Relational, strong JSON support |
| Cache/Presence store | Redis | TTL-based presence, session data |

---

## Monorepo final structure

```
canvas-pm/
  apps/
    api/
      src/
        modules/
          auth/       (strategy, dto, service, controller)
          workspaces/ (dto, entity, service, controller)
          projects/   (dto, entity, service, controller)
          tasks/      (dto, entity, service, controller)
          canvas/     (service, controller)
          comments/   (dto, entity, service, controller)
          files/      (service, controller)
          notifications/ (service, controller, gateway)
          presence/   (service)
          users/      (service, controller)
        common/
          guards/
          decorators/
          filters/
          interceptors/
        database/
          migrations/
          entities/
        app.module.ts
        main.ts
        ws-server.ts
      data-source.ts
      .env
    web/
      src/
        pages/
          auth/        (LoginPage, RegisterPage)
          workspaces/  (WorkspaceSelectorPage)
          projects/    (ProjectsPage, ProjectDetailPage)
          tasks/       (TaskCanvasPage)
          settings/    (ProfilePage, WorkspaceSettingsPage, ProjectSettingsPage)
          errors/      (ForbiddenPage, NotFoundPage)
        components/
          canvas/      (CanvasStage, CanvasToolbar, CanvasTopBar)
          comments/    (CommentPin, CommentPane, CommentCompose)
          tasks/       (TaskCard, TaskCardSkeleton, TaskGrid, NewTaskModal)
          layout/      (AppShell, Sidebar)
          ui/          (Button, Input, Modal, Avatar, Badge, Skeleton, Toast, NotificationBell)
        store/
          auth.store.ts
          workspace.store.ts
          project.store.ts
          task.store.ts
          canvas.store.ts
          notifications.store.ts
        lib/
          api.ts
          ws.ts
          user-color.ts
          use-query.ts
          notifications-socket.ts
      index.html
      vite.config.ts
      tailwind.config.ts
      .env
  packages/
    shared/
      src/
        enums.ts
        types.ts
        canvas-types.ts
        index.ts
  docker-compose.yml
  package.json
  README.md
```
