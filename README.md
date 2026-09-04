# DevPilot AI

**An Intelligent Software Project Management Platform with AI-Assisted Sprint Planning, Bug Tracking, and Team Collaboration.**

DevPilot AI combines conventional software project management — projects, sprints, Kanban tasks, bug tracking, comments, and notifications — with AI features powered by Google Gemini: sprint planning from a natural-language goal, user story generation, task prioritization, bug analysis, project risk scoring, and meeting summarization. Every AI-generated artefact is presented as an editable draft and is **never** persisted to the database without explicit human review and confirmation.

## Features

- **Auth & RBAC** — JWT authentication, bcrypt password hashing, and five roles enforced server-side on every route: Admin, Project Manager, Developer, Tester, Stakeholder.
- **Projects & Sprints** — full CRUD, member management, sprint lifecycle (Planned → Active → Completed).
- **Tasks & Kanban** — a real, working drag-and-drop board (To Do / In Progress / In Review / Done) backed by MongoDB, with priorities, due dates, story points, dependencies, and comments.
- **Bug Tracker** — severity/priority/status workflow, steps to reproduce, linked tasks, comments.
- **AI Assistant** (Gemini, backend-only key):
  - **AI Sprint Planner** — natural-language goal → structured backlog of user stories, acceptance criteria, priorities, and story points, reviewed/edited before saving.
  - **AI User Story Generator** — feature description → user story, acceptance criteria, suggested priority and tasks.
  - **AI Task Prioritization** — recommends a priority from deadline, dependencies, and sprint context.
  - **AI Bug Analyzer** — possible cause, suggested severity/module, debugging suggestions, next steps.
  - **AI Risk Analysis** — LOW/MEDIUM/HIGH project risk with an explanation, shown on the project dashboard.
  - **AI Meeting Summarizer** — meeting notes → summary, key decisions, action items (convertible into real tasks).
- **Real-time collaboration** — Socket.IO powers live task/bug board updates, comments, project chat, and notifications.
- **Analytics dashboards** — org-wide and per-project: task/bug breakdowns, team workload, sprint progress, risk.
- **Admin console** — manage users, roles, account status, and organizations.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios, Recharts, @dnd-kit, Socket.IO client, react-hot-toast |
| Backend | Node.js, Express, MongoDB, Mongoose, Socket.IO |
| Auth | JWT (`jsonwebtoken`), `bcryptjs` |
| AI | Google Gemini (`@google/generative-ai`), isolated in a backend service layer |
| Security | `helmet`, `express-rate-limit`, CORS allow-list |

## Architecture

```
Browser (React SPA)  ──HTTPS/REST──▶  Express API  ──Mongoose──▶  MongoDB
        ▲                                  │
        └───────────WebSocket (Socket.IO)──┘
                                            │
                                       Gemini API (server-side only)
```

- The **presentation tier** (`client/`) only renders and calls the API — it never talks to MongoDB or Gemini directly.
- The **application tier** (`server/`) owns authentication, authorization, domain logic, and all outbound AI calls. AI prompts/response-parsing live in `server/services/aiService.js`, called only from `server/controllers/aiController.js`, which audit-logs every request/response to the `AIRequest` collection and never lets a malformed AI response silently corrupt data — the endpoint fails clearly (503/502) so the frontend falls back to manual entry.
- The **persistence tier** is MongoDB via Mongoose.

## Folder Structure

```
DevPilot-AI/
├── client/                # React + Vite frontend
│   └── src/
│       ├── components/    # layout, common UI, kanban, tasks, bugs
│       ├── context/       # AuthContext, SocketContext
│       ├── hooks/         # useAuth, useSocket
│       ├── pages/         # route-level pages (auth, projects, tasks, bugs, ...)
│       ├── services/      # one file per REST resource (axios wrappers)
│       └── utils/         # roles, constants, formatting
├── server/                # Express backend
│   ├── config/            # db.js
│   ├── controllers/       # one per resource
│   ├── middleware/        # auth, error handling
│   ├── models/            # Mongoose schemas
│   ├── routes/            # one per resource, nested where relevant
│   ├── services/          # aiService, notificationService, activityService
│   ├── socket/            # Socket.IO server + auth
│   ├── seed/               # demo data seed script
│   └── server.js
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB instance — [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier) or a local `mongod`
- (Optional but required for AI features) A [Google Gemini API key](https://ai.google.dev/)

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment variables

Copy each `.env.example` to `.env` and fill in real values (never commit `.env`):

**`server/.env`**
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/devpilot_ai
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
```

**`client/.env`**
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Seed demo data (recommended)

Populates a demo organization, one account per role, and a full "E-Commerce Platform" project with sprints, tasks across every Kanban column, bugs, comments, and notifications:

```bash
cd server
npm run seed
```

### 4. Run the app

```bash
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm run dev
```

Open `http://localhost:5173`.

## Demo Credentials

*(created by `npm run seed` — development/demo accounts only, not real secrets)*

| Role | Email | Password |
|---|---|---|
| Admin | `admin@devpilot.ai` | `DevPilot@Demo123` |
| Project Manager | `pm@devpilot.ai` | `DevPilot@Demo123` |
| Developer | `dev1@devpilot.ai` | `DevPilot@Demo123` |
| Developer | `dev2@devpilot.ai` | `DevPilot@Demo123` |
| Tester | `tester@devpilot.ai` | `DevPilot@Demo123` |
| Stakeholder | `stakeholder@devpilot.ai` | `DevPilot@Demo123` |

## AI Setup

1. Get a key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Put it in `server/.env` as `GEMINI_API_KEY` — **backend only**, it is never sent to or embedded in the frontend bundle.
3. If the key is missing or the provider errors, AI endpoints return `503`/`502` with a clear message and the frontend surfaces it as a toast — no feature fakes a response.

## API Overview

All routes are versioned under `/api/v1`. Every route requires `Authorization: Bearer <token>` except `/auth/register` and `/auth/login`.

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me
PUT    /api/v1/auth/profile
PUT    /api/v1/auth/change-password

GET    /api/v1/users
PUT    /api/v1/users/:id/role          (Admin)
PUT    /api/v1/users/:id/status        (Admin)

GET    /api/v1/organizations           (Admin)

GET    /api/v1/projects
POST   /api/v1/projects                (Manager/Admin)
GET    /api/v1/projects/:id
PUT    /api/v1/projects/:id            (Manager/Admin)
POST   /api/v1/projects/:id/members    (Manager/Admin)

GET    /api/v1/projects/:projectId/sprints
POST   /api/v1/projects/:projectId/sprints        (Manager/Admin)

GET    /api/v1/tasks                   (cross-project, current user)
GET    /api/v1/projects/:projectId/tasks
POST   /api/v1/projects/:projectId/tasks           (Manager/Admin)
PUT    /api/v1/tasks/:id               (assignee can change status; Manager/Admin can edit everything)

GET    /api/v1/bugs
GET/POST /api/v1/projects/:projectId/bugs
PUT    /api/v1/bugs/:id

POST   /api/v1/tasks/:id/comments · /api/v1/bugs/:id/comments

GET    /api/v1/notifications
PUT    /api/v1/notifications/:id/read

GET    /api/v1/analytics/overview
GET    /api/v1/projects/:projectId/analytics

POST   /api/v1/ai/sprint-plan          (Manager/Admin)
POST   /api/v1/ai/user-story           (Manager/Admin)
POST   /api/v1/ai/prioritize-task      (Manager/Admin)
POST   /api/v1/ai/analyze-bug
POST   /api/v1/ai/analyze-risk         (Manager/Admin)
POST   /api/v1/ai/summarize-meeting

GET/POST /api/v1/projects/:projectId/meetings
```

## Known Limitations / Deviations from the SRS

- **Access tokens**: the SRS specifies short-lived (15 min) access tokens with 7-day rotating refresh tokens. This implementation uses a single 7-day JWT for simplicity — acceptable for an academic/demo deployment, but should be hardened with refresh-token rotation before any real production use.
- **File attachments** on bugs are modelled (`url`/`name`) but there is no file upload endpoint yet — attachments would need to be uploaded to object storage (e.g. S3) and the URL saved.
- **Redis-backed Socket.IO scaling** (for horizontal replicas, per the SRS deployment diagram) is not implemented — a single instance is assumed.

## Future Enhancements

- Refresh-token rotation and session revocation
- File/attachment uploads for bugs and tasks
- Subtask hierarchy (currently AI-generated stories map to a single task with acceptance criteria + a suggested-subtasks list in the description)
- Redis adapter for Socket.IO to support multiple API replicas
- Automated test suite (Jest/Vitest + Supertest) — the architecture (services/controllers separated from routes) is designed to make this straightforward to add
