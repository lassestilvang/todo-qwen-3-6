# Task Planner

A modern, professional daily task planner built with Next.js 16, featuring rich task management, multiple views, natural language entry, and a clean dark-mode-first design.

## Features

- **Multiple Views** - Today, Next 7 Days, Upcoming, and All Tasks
- **Rich Task Management** - Priorities, labels, subtasks, deadlines, time estimates, reminders, and recurring tasks
- **Lists & Labels** - Organize tasks with custom lists and color-coded labels
- **Natural Language Entry** - Type "meeting tomorrow at 2pm #work !high" and have it parsed automatically
- **Full-Text Search** - Find tasks instantly with search across titles, descriptions, and labels
- **Task Detail Panel** - Edit all task properties in a dedicated side panel
- **Dark Mode** - Dark-first design with theme support
- **Responsive UI** - Collapsible sidebar, works on all screen sizes
- **Local SQLite** - Fast, zero-config local database with no external dependencies

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui, base-ui |
| Animations | Framer Motion |
| Database | SQLite (better-sqlite3) |
| Validation | Zod v4 |
| Date Handling | date-fns |
| Runtime | Bun |
| Testing | Bun Test |
| Icons | Lucide React |
| Notifications | Sonner |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) 1.0+
- Node.js 20+ (if not using Bun)

### Installation

```bash
# Install dependencies
bun install

# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Available Scripts

```bash
bun dev          # Start development server
bun build        # Build for production
bun start        # Start production server
bun lint         # Run ESLint
bun test         # Run unit tests (excludes DB tests)
bun test:all     # Run all tests including DB tests
bun test:watch   # Run tests in watch mode
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── tasks/          # Task CRUD endpoints
│   │   │   └── [id]/
│   │   │       ├── changes/  # Task change history
│   │   │       └── route.ts
│   │   ├── lists/          # List CRUD endpoints
│   │   ├── labels/         # Label CRUD endpoints
│   │   └── search/         # Full-text search endpoint
│   ├── layout.tsx          # Root layout with theme provider
│   ├── page.tsx            # Main app page
│   └── globals.css         # Global styles and theme variables
├── components/
│   ├── layout/
│   │   └── header.tsx      # App header with search
│   ├── sidebar/
│   │   └── sidebar.tsx     # Navigation sidebar
│   ├── tasks/
│   │   ├── task-form.tsx   # Task creation/editing form
│   │   ├── task-item.tsx   # Individual task row
│   │   ├── task-list.tsx   # Task list container
│   │   └── task-detail.tsx # Task detail/edit panel
│   ├── search/
│   │   └── search-bar.tsx  # Search input component
│   └── ui/                 # shadcn/ui primitives
├── hooks/
│   ├── use-app.tsx         # Global app state context
│   └── use-data.ts         # Data fetching hooks
├── lib/
│   ├── db.ts               # SQLite connection & schema
│   ├── repository.ts       # Data access layer
│   ├── natural-language.ts # NLP parser for task input
│   ├── types.ts            # TypeScript type definitions
│   ├── utils.ts            # Utility functions
│   └── validation.ts       # Zod validation schemas
└── tests/
    ├── validation.test.ts
    └── natural-language.test.ts
```

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | Get all tasks (supports filtering by view, list, completed) |
| `POST` | `/api/tasks` | Create a new task |
| `GET` | `/api/tasks/[id]` | Get a single task |
| `PATCH` | `/api/tasks/[id]` | Update a task |
| `DELETE` | `/api/tasks/[id]` | Delete a task |
| `GET` | `/api/tasks/[id]/changes` | Get task change history |
| `GET` | `/api/lists` | Get all lists |
| `POST` | `/api/lists` | Create a new list |
| `GET` | `/api/lists/[id]` | Get a single list |
| `PATCH` | `/api/lists/[id]` | Update a list |
| `DELETE` | `/api/lists/[id]` | Delete a list |
| `GET` | `/api/labels` | Get all labels |
| `POST` | `/api/labels` | Create a new label |
| `PATCH` | `/api/labels/[id]` | Update a label |
| `GET` | `/api/search` | Search tasks by query |

## Natural Language Parsing

The task input supports a natural language syntax for quick task creation:

```
Task description @date #label !priority ~time
```

| Syntax | Example | Result |
|--------|---------|--------|
| `@date` | `@tomorrow` | Sets due date to tomorrow |
| `@time` | `@2pm` | Sets time to 14:00 |
| `#label` | `#work` | Assigns "work" label |
| `!priority` | `!high` | Sets high priority |
| `~estimate` | `~30m` | Sets 30 minute time estimate |

Supported date expressions: `today`, `tomorrow`, `yesterday`, day names (`monday`), `next week`, and `YYYY-MM-DD` format.

## Database

Uses SQLite via `better-sqlite3` for local storage. The database file is created automatically at `data/tasks.db` on first run. Schema includes tables for:

- `lists` - Task lists/groups
- `labels` - Color-coded labels
- `tasks` - Main task records
- `task_labels` - Many-to-many task-label relationship
- `sub_tasks` - Task sub-items
- `reminders` - Task reminders
- `attachments` - Task file attachments
- `task_changes` - Change history/audit log

## Testing

```bash
# Run unit tests (validation & natural language parsing)
bun test

# Run all tests (includes database tests)
bun test:all
```

Note: Database tests are skipped by default due to native module compatibility with Bun's test runner.

## License

MIT
