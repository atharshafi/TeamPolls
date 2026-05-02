# TeamPolls — Frontend

> React + Vite web application for the TeamPolls real-time anonymous polling platform.

[![CI](https://github.com/atharshafi/TeamPolls/actions/workflows/ci.yml/badge.svg)](https://github.com/atharshafi/TeamPolls/actions)
![React](https://img.shields.io/badge/react-19.x-61dafb)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)
![Vite](https://img.shields.io/badge/vite-6.x-646cff)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Pages](#pages)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Key Concepts](#key-concepts)
- [API Integration](#api-integration)
- [Scripts](#scripts)
- [Contributing](#contributing)

---

## Overview

The TeamPolls frontend is a single-page React application with three views:

- **Create Poll** — manager enters a question, options, and expiry time
- **Vote** — employee opens the poll link and casts an anonymous vote
- **Live Results** — real-time bar chart that updates instantly when anyone votes (no page refresh)

The app communicates with the TeamPolls backend via REST for data operations and WebSocket for live updates.

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.x | UI framework |
| TypeScript | 5.x | Language (strict mode) |
| Vite | 6.x | Build tool and dev server |
| React Router | 7.x | Client-side routing |
| Axios | 1.x | HTTP client for API calls |
| WebSocket API | Native | Live results streaming |

---

## Pages

### `/` — Create Poll

The manager's page. Fill in:
- A question (3–500 characters)
- 2–10 answer options
- Expiry time (1h, 2h, 6h, or 24h)

On submit, the poll is created via the backend API and the manager is redirected to the live results page.

### `/poll/:id/vote` — Vote

The voter's page. Loaded by sharing the vote link. Shows:
- The poll question and all options
- A radio-style selector
- Submit button (disabled until an option is selected)

On submit, the vote is sent with the user's anonymous JWT token. The voter is redirected to live results after voting.

### `/poll/:id/results` — Live Results

The results page. Shows:
- A live bar chart of all vote counts
- A "Leading" badge on the winning option
- Total vote count
- Live/Closed status indicator
- WebSocket connection status (green = connected)
- "Copy Vote Link" button to share with others
- "Create New Poll" button

Results update automatically every time anyone votes — powered by WebSocket.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v22+
- The [TeamPolls backend](../backend/README.md) must be running on `http://localhost:3000`

### 1. Navigate to the frontend folder

```bash
cd TeamPolls/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> ⚠️ Make sure the backend is running first (`docker compose up -d` from the project root), otherwise API calls will fail.

---

## Environment Variables

The frontend currently uses hardcoded localhost URLs for development. For production deployment, create a `.env` file in the `frontend/` folder:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

Then update `src/api/client.ts` to use:
```typescript
baseURL: import.meta.env.VITE_API_URL
```

> Vite requires all environment variables to be prefixed with `VITE_` to be accessible in the browser.

---

## Project Structure

```
frontend/
├── index.html               ← HTML entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.tsx             ← renders <App /> into #root
    ├── App.tsx              ← route definitions
    │
    ├── types/
    │   └── index.ts         ← shared TypeScript interfaces (Poll, VoteCount, etc.)
    │
    ├── api/
    │   └── client.ts        ← all backend API calls in one place
    │                           getOrCreateToken, createPoll, getPoll, castVote
    │
    ├── hooks/
    │   └── useWebSocket.ts  ← custom React hook for WebSocket live updates
    │
    └── pages/
        ├── CreatePoll.tsx   ← / route — poll creation form
        ├── VotePoll.tsx     ← /poll/:id/vote — voting page
        └── Results.tsx      ← /poll/:id/results — live results page
```

---

## Key Concepts

### Anonymous Authentication

On first visit, the app calls `POST /auth/anon` to get a JWT token. This token is saved in `localStorage` and reused for all future votes — no login, no signup.

```typescript
// src/api/client.ts
export async function getOrCreateToken(): Promise<string> {
  const existing = localStorage.getItem('teampolls_token')
  if (existing) return existing

  const res = await api.post('/auth/anon')
  localStorage.setItem('teampolls_token', res.data.token)
  return res.data.token
}
```

### Live Results via WebSocket

The `useWebSocket` hook in `src/hooks/useWebSocket.ts` manages the WebSocket lifecycle:

```typescript
// Usage in Results.tsx
const { data: poll, connected } = useWebSocket(pollId)
```

- Connects automatically when the component mounts
- Receives the current results immediately on connect
- Receives updated results every time anyone votes
- Disconnects cleanly when the component unmounts (tab closed / navigation)

### Routing

Three routes defined in `App.tsx`:

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `CreatePoll` | Manager creates a poll |
| `/poll/:id/vote` | `VotePoll` | Employee votes |
| `/poll/:id/results` | `Results` | Live results view |
| `*` | Redirect to `/` | Unknown paths go home |

### Type Safety

All data shapes from the backend are defined in `src/types/index.ts`:

```typescript
export interface Poll {
  id: string
  question: string
  options: string[]
  expires_at: string
  created_at: string
}

export interface PollWithResults extends Poll {
  votes: VoteCount[]
  is_expired: boolean
}
```

These are imported as `import type { ... }` everywhere (TypeScript `verbatimModuleSyntax` requirement).

---

## API Integration

All backend communication is centralised in `src/api/client.ts`. Pages never call `fetch` or `axios` directly — they always go through this module.

| Function | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| `getOrCreateToken()` | POST | `/auth/anon` | Get or reuse JWT token |
| `createPoll(q, opts, exp)` | POST | `/poll` | Create a new poll |
| `getPoll(id)` | GET | `/poll/:id` | Get poll + vote counts |
| `castVote(id, idx)` | POST | `/poll/:id/vote` | Submit a vote with JWT |

WebSocket connection is managed separately in `src/hooks/useWebSocket.ts`:

```typescript
const ws = new WebSocket(`ws://localhost:3000/poll/${pollId}/live`)
```

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Start Vite at `http://localhost:5173` |
| Build | `npm run build` | Compile TypeScript + bundle for production |
| Preview | `npm run preview` | Preview the production build locally |
| Type check | `npm run tsc` | Check TypeScript without building |

---

## Browser Support

Tested and working in:
- Chrome 120+
- Firefox 120+
- Edge 120+
- Safari 17+

Requires WebSocket support (all modern browsers).

---

## Contributing

See [`CONTRIBUTING.md`](../CONTRIBUTING.md) for branch naming, commit format, and PR process.

---

## License

MIT