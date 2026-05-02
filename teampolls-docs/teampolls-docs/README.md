# TeamPolls

> A real-time anonymous polling platform for teams. Create polls, vote instantly, watch results update live.

[![CI](https://github.com/your-org/teampolls/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/teampolls/actions)
![Node](https://img.shields.io/badge/node-22.x-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## What is TeamPolls?

TeamPolls lets managers create polls and employees vote anonymously — with live results updating on everyone's screen without refreshing. Think Slido or Mentimeter, built from scratch.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 22 + Fastify 5 |
| Language | TypeScript |
| Database | PostgreSQL 16 |
| Cache / Realtime | Redis 7 |
| Auth | JWT (anonymous tokens) |
| Validation | Zod |
| Tests | Vitest |
| Containers | Docker + Docker Compose |
| Frontend | React + Vite (Phase 8) |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) v24+
- [Node.js](https://nodejs.org/) v22+
- [Git](https://git-scm.com/) v2.40+
- [VS Code](https://code.visualstudio.com/) (recommended)

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-org/teampolls.git
cd teampolls
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your own secrets. Never commit `.env` to git.

### 3. Start everything

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, and the backend server all at once.

### 4. Run database migrations

```bash
docker compose exec backend npm run migrate
```

### 5. Verify it's working

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{ "status": "ok", "services": { "postgres": "connected", "redis": "connected" } }
```

---

## Available Scripts

| Command | What it does |
|---------|-------------|
| `docker compose up -d` | Start all services in background |
| `docker compose down` | Stop all services |
| `docker compose down -v` | Stop and delete all data volumes |
| `docker compose exec backend npm test` | Run all tests |
| `docker compose exec backend npm run migrate` | Run database migrations |
| `docker compose logs backend` | View backend logs |
| `docker compose restart backend` | Restart only the backend |

---

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/anon` | None | Get anonymous JWT token |
| GET | `/health` | None | Health check |
| POST | `/poll` | None | Create a poll |
| GET | `/poll/:id` | None | Get poll + results |
| POST | `/poll/:id/vote` | JWT | Cast a vote |
| WS | `/poll/:id/live` | None | Live results stream |

Full API documentation → [docs/API_REFERENCE.md](./docs/API_REFERENCE.md)

---

## Project Structure

```
TeamPolls/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── docs/                        ← all project documentation
│   ├── PRD.md
│   ├── TDD.md
│   ├── ADR.md
│   ├── API_REFERENCE.md
│   ├── RUNBOOK.md
│   ├── SECURITY.md
│   └── TEST_REPORT.md
└── backend/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts
        ├── app.ts
        ├── types.ts
        ├── plugins/
        ├── routes/
        ├── services/
        ├── db/
        └── tests/
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to submit changes, branch naming, and code review process.

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.

---

## License

MIT — see [LICENSE](./LICENSE)
