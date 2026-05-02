# TeamPolls

> A real-time anonymous polling platform for teams.
> Create a poll, share the link, watch votes come in live — no accounts required.

[![CI](https://github.com/atharshafi/TeamPolls/actions/workflows/ci.yml/badge.svg)](https://github.com/atharshafi/TeamPolls/actions)
![Node](https://img.shields.io/badge/node-22.x-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## What is TeamPolls?

TeamPolls lets managers create polls and employees vote anonymously — with results updating live on everyone's screen without refreshing. Think Slido or Mentimeter, self-hosted and built from scratch.

---

## How it works

```
Manager creates a poll  →  Shares the vote link  →  Team votes anonymously
                                                            ↓
                                          Results update live for everyone
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + TypeScript |
| Backend | Node.js 22 + Fastify 5 + TypeScript |
| Database | PostgreSQL 16 |
| Cache / Realtime | Redis 7 (WebSocket + pub/sub) |
| Auth | JWT (anonymous tokens — no signup) |
| Tests | Vitest (9 tests, all passing) |
| CI | GitHub Actions |
| Containers | Docker + Docker Compose |

---

## Repository Structure

```
TeamPolls/
├── backend/          ← Fastify REST + WebSocket API
├── frontend/         ← React + Vite web app
├── teampolls-docs/   ← Full project documentation
└── docker-compose.yml
```

→ [Backend README](./backend/README.md)
→ [Frontend README](./frontend/README.md)

---

## Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) v24+
- [Node.js](https://nodejs.org/) v22+

### 1. Clone and configure

```bash
git clone https://github.com/atharshafi/TeamPolls.git
cd TeamPolls
cp .env.example .env
```

### 2. Start the backend

```bash
docker compose up -d
docker compose exec backend npm run migrate
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — the app is live.

---

## Features

- **Zero friction** — voters get an anonymous token automatically, no signup needed
- **One vote per person** — enforced at the database level, not just in code
- **Live results** — WebSocket pushes updates to everyone the moment a vote is cast
- **Poll expiry** — polls close automatically after the time you set
- **Rate limiting** — 5 requests/second per IP to prevent vote flooding
- **Tested** — 9 automated tests covering all routes and edge cases
- **CI pipeline** — GitHub Actions runs tests on every push

---

## Documentation

Full project documentation lives in [`teampolls-docs/`](./teampolls-docs/):

| Document | Description |
|----------|-------------|
| [PRD](./teampolls-docs/docs/PRD.md) | Product requirements and feature list |
| [TDD](./teampolls-docs/docs/TDD.md) | Technical design and architecture |
| [ADR](./teampolls-docs/docs/ADR.md) | Why each technology was chosen |
| [API Reference](./teampolls-docs/docs/API_REFERENCE.md) | All endpoints with examples |
| [Runbook](./teampolls-docs/docs/RUNBOOK.md) | Deployment and incident response |
| [Security](./teampolls-docs/docs/SECURITY.md) | Security controls and known gaps |
| [Test Report](./teampolls-docs/docs/TEST_REPORT.md) | Test coverage and results |

---

## License

MIT
