# Mesh

**Website:** [https://usemesh.work](https://usemesh.work)

**Mesh** is an interactive, real-time collaborative workspace and task management application. It allows teams to work together seamlessly on a unified canvas equipped with rich-text editing, multimedia support, and real-time multiplayer synchronization. 

From creating detailed task cards with rich text formatting to connecting ideas visually on an infinite canvas, Mesh aims to be the modern hub for productive teams.

---

## 🛠 Tech Stack & Architecture

Mesh is built using a modern, scalable, and type-safe architecture organized as a **Turborepo** monorepo.

### Core Technologies
- **Language**: [TypeScript](https://www.typescriptlang.org/) across the entire stack.
- **Monorepo Management**: [Turborepo](https://turbo.build/)

### Frontend (User Interface)
- **Framework**: [React](https://react.dev/) 19 & [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) for global state and [Yjs](https://yjs.dev/) for CRDT-based real-time multiplayer state.
- **Canvas Rendering**: [Konva](https://konvajs.org/) & `react-konva` for high-performance 2D canvas drawing.
- **Rich Text Editing**: [TipTap](https://tiptap.dev/) (built on ProseMirror) integrated with the canvas for text blocks, callouts, and comments. Supports mentions, alignments, robust styling, and font-sizing.
- **Routing**: React Router DOM

### Backend (API & Services)
- **Framework**: [NestJS](https://nestjs.com/) (Node.js)
- **Database**: **PostgreSQL** via [TypeORM](https://typeorm.io/)
- **Real-Time Communication**: [Socket.IO](https://socket.io/) (for notifications and UI updates) and `y-websocket` (for Yjs CRDT synchronization).
- **Background Jobs & Queuing**: [BullMQ](https://bullmq.io/) backed by **Redis** for asynchronous tasks (e.g., email notifications, due date alerts).
- **Authentication**: JWT-based authentication via Passport.js.
- **Storage**: Cloud storage integrations configured via AWS S3 / Azure Blob Storage sdks for assets and profile picture uploads.

---

## 🚀 Getting Started

### Prerequisites
Before running Mesh locally, ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or later (Recommended: v20 LTS).
- **npm**: v10.0.0 or later.
- **PostgreSQL**: v14.0 or later running locally or via Docker.
- **Redis**: v6.2 or later running locally or via Docker (required for BullMQ jobs).

### Setup and Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/mesh.git
   cd mesh
   ```

2. **Install dependencies:**
   Mesh uses NPM workspaces, so dependencies can be installed at the root:
   ```bash
   npm install
   ```

3. **Database & Environment Setup:**
   - Create a local PostgreSQL database named `mesh` (or your preferred name).
   - Navigate to `apps/api` and copy the `.env.example` to `.env`:
     ```bash
     cd apps/api
     cp .env.example .env
     ```
   - Configure your `.env` variables (Database connection string, Redis URL, JWT Secret, S3 buckets, etc.).
   - Run the database migrations (if applicable) or rely on `synchronize: true` in development (check your `data-source.ts` config).

4. **Run the Application:**
   From the root of the project, you can start both the frontend and backend concurrently using Turbo:
   ```bash
   npm run dev
   ```
   If needed, you might also have to start the `y-websocket` synchronization server. Run this in a new terminal window:
   ```bash
   npm run dev:ws
   ```

5. **Access the Application:**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3000

---

## 🤝 Contributing

We welcome contributions! Whether it is a bug fix, feature addition, or documentation improvement, please follow these guidelines to make the process smooth for everyone.

### Contribution Workflow

1. **Find an Issue**: Browse the open issues or open a new one to discuss your proposed changes before writing code.
2. **Fork and Branch**: 
   - Create a feature branch from the `main` branch. 
   - Use a clear naming convention: `feature/your-feature-name`, `bugfix/issue-description`, or `chore/task-name`.
3. **Commit your changes**: Ensure your commits are atomic and have meaningful commit messages. We recommend using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
4. **Push and create a Pull Request (PR)**: 
   - Push your branch to your fork.
   - Open a PR against the `main` branch.
   - Describe what your PR accomplishes and link it to any related issue.

### Development Standards

- **TypeScript Strict Mode**: Try to avoid the `any` type whenever possible. All new code must be properly typed.
- **Linting & Formatting**: Ensure you run `npm run lint` and `npm run format` (if available) before committing.
- **Performance First**: Since Mesh is a highly interactive application, avoid unnecessary intermediate allocations and redundant re-renders, especially inside the canvas and Yjs synchronization logic.
- **Reusable Components**: Keep React components decoupled and strictly adhere to separation of concerns. Maintain custom hooks where state logic can be shared.

### Code of Conduct

Please maintain respect and professionalism in all communications, PR reviews, and issues.

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.