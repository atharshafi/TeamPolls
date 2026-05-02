# TeamPolls — Backend

> REST + WebSocket API for the TeamPolls real-time anonymous polling platform.
> Built with Fastify, TypeScript, PostgreSQL, and Redis.

[![CI](https://github.com/atharshafi/TeamPolls/actions/workflows/ci.yml/badge.svg)](https://github.com/atharshafi/TeamPolls/actions)
![Node](https://img.shields.io/badge/node-22.x-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)
![Fastify](https://img.shields.io/badge/fastify-5.x-black)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database](#database)
- [Real-Time (WebSocket)](#real-time-websocket)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Contributing](#contributing)

---

## Overview

The TeamPolls backend is a production-ready REST + WebSocket API that powers:

- **Anonymous authentication** — every user gets a JWT token with zero friction (no signup)
- **Poll management** — create polls with questions, options, and expiry times
- **Vote casting** — one vote per user per poll, enforced at the database level
- **Live results** — vote updates pushed to all connected clients via WebSocket + Redis pub/sub

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 22.x | Runtime |
| TypeScript | 5.x | Language (strict mode) |
| Fastify | 5.x | HTTP framework |
| PostgreSQL | 16 | Primary database |
| Redis | 7 | Pub/sub for live updates |
| Zod | 4.x | Input validation |
| JWT (`@fastify/jwt`) | 10.x | Anonymous authentication |
| Vitest | 4.x | Testing framework |
| Docker Compose | 2.x | Local development environment |
| Pino | 10.x | Structured logging |

---

## Architecture

```
Request → routes/ (validation) → services/ (business logic) → db/ + redis/
```

```
┌──────────────────────────────────────────────────┐
│                   Fastify Server                 │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  routes/ │  │services/ │  │   plugins/     │  │
│  │  auth    │→ │  auth    │  │  postgres      │  │
│  │  polls   │→ │  polls   │→ │  redis         │  │
│  │  live    │→ │  votes   │  │  jwt           │  │
│  └──────────┘  │  live    │  │  websocket     │  │
│                └──────────┘  └────────────────┘  │
└──────────────────────┬───────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
   ┌──────▼──────┐         ┌────────▼────────┐
   │ PostgreSQL  │         │     Redis       │
   │  users      │         │  pub/sub        │
   │  polls      │         │  vote:cast      │
   │  votes      │         └─────────────────┘
   └─────────────┘
```

**Live update flow:**
```
POST /poll/:id/vote
       ↓
  Save vote to PostgreSQL
       ↓
  PUBLISH to Redis "vote:cast"
       ↓
  Redis subscriber fires
       ↓
  Fetch fresh results from DB
       ↓
  Broadcast to all WebSocket clients on that poll
```

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) v24+
- [Node.js](https://nodejs.org/) v22+
- [Git](https://git-scm.com/)

### 1. Clone the repository

```bash
git clone https://github.com/atharshafi/TeamPolls.git
cd TeamPolls
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` — change the passwords and JWT secret before running in production.

> ⚠️ Never commit your `.env` file. It is already in `.gitignore`.

### 3. Start all services

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, and the backend server. The backend waits for PostgreSQL and Redis to be healthy before starting.

### 4. Run database migrations

```bash
docker compose exec backend npm run migrate
```

### 5. Verify everything is running

```bash
curl http://localhost:3000/health
```

Expected:
```json
{
  "status": "ok",
  "timestamp": "2026-05-02T12:00:00.000Z",
  "services": { "postgres": "connected", "redis": "connected" }
}
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values.

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `POSTGRES_USER` | ✅ | `polluser` | PostgreSQL username |
| `POSTGRES_PASSWORD` | ✅ | `changeme123` | PostgreSQL password — use a strong value in production |
| `POSTGRES_DB` | ✅ | `pollsdb` | PostgreSQL database name |
| `DATABASE_URL` | ✅ | `postgresql://polluser:pw@postgres:5432/pollsdb` | Full connection string |
| `REDIS_URL` | ✅ | `redis://redis:6379` | Redis connection string |
| `JWT_SECRET` | ✅ | `at-least-32-random-characters` | Signs JWT tokens — rotate immediately if compromised |
| `PORT` | ✅ | `3000` | Port the backend listens on |
| `NODE_ENV` | ✅ | `development` / `production` / `test` | Controls rate limiting and logging |

**Generating a secure JWT secret:**
```bash
openssl rand -hex 32
```

---

## API Reference

### Base URL
```
http://localhost:3000
```

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | None | Service health check |
| `POST` | `/auth/anon` | None | Get anonymous JWT token |
| `POST` | `/poll` | None | Create a poll |
| `GET` | `/poll/:id` | None | Get poll with vote counts |
| `POST` | `/poll/:id/vote` | JWT | Cast a vote |
| `WS` | `/poll/:id/live` | None | Live results stream |

### Authentication

Obtain a token once per session:

```bash
curl -X POST http://localhost:3000/auth/anon
```

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "8e40ce3a-1234-5678-abcd-ef1234567890"
}
```

Use the token in the `Authorization` header:
```
Authorization: Bearer <token>
```

### Create a poll

```bash
curl -X POST http://localhost:3000/poll \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What should we have for lunch?",
    "options": ["Avocado sandwich", "Fruits and rice", "Chapati and veggies"],
    "expiresAt": "2026-12-31T23:59:59Z"
  }'
```

### Cast a vote

```bash
curl -X POST http://localhost:3000/poll/<poll-id>/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{ "optionIdx": 0 }'
```

### Get results

```bash
curl http://localhost:3000/poll/<poll-id>
```

Full API documentation → [`docs/API_REFERENCE.md`](../teampolls-docs/docs/API_REFERENCE.md)

---

## Database

### Schema overview

```
users       id (UUID), created_at
polls       id (UUID), question, options (JSONB), expires_at, created_at
votes       id (UUID), poll_id → polls, user_id → users, option_idx, created_at
              UNIQUE(poll_id, user_id)  ← enforces one vote per user per poll
```

### Running migrations

```bash
docker compose exec backend npm run migrate
```

Migrations are in `src/db/migrations/` as numbered SQL files. They run in order and are tracked in a `_migrations` table — safe to run multiple times.

### Connecting directly to PostgreSQL

```bash
docker compose exec postgres psql -U polluser -d pollsdb
```

---

## Real-Time (WebSocket)

Connect to the live results stream:

```javascript
const ws = new WebSocket('ws://localhost:3000/poll/<poll-id>/live')

ws.onmessage = (event) => {
  const results = JSON.parse(event.data)
  console.log(results.votes)
}
```

- On connect: current results are sent immediately
- On every vote: updated results are pushed automatically
- On disconnect: connection is cleaned up server-side

**How it works internally:**

1. Vote is saved to PostgreSQL
2. Backend publishes `{ pollId }` to Redis channel `vote:cast`
3. Redis subscriber (a separate connection) receives the event
4. Subscriber fetches fresh results from DB
5. Results are broadcast to all WebSocket clients watching that poll

---

## Running Tests

```bash
docker compose exec backend npm test
```

### Test results

```
✓ health.test.ts    (1 test)
✓ auth.test.ts      (1 test)
✓ polls.test.ts     (7 tests)

Test Files  3 passed (3)
Tests       9 passed (9)
```

### What is tested

| Test | What it verifies |
|------|-----------------|
| `GET /health` | All services connected |
| `POST /auth/anon` | Returns valid JWT and userId |
| `POST /poll` | Poll created and returned |
| `GET /poll/:id` | Poll returned with empty votes |
| `POST /poll/:id/vote` | Vote saved successfully |
| `GET /poll/:id` (after vote) | Vote count is 1 |
| `POST /poll/:id/vote` (duplicate) | Rejected with 400 |
| `POST /poll/:id/vote` (no token) | Rejected with 401 |
| `GET /poll/unknown-id` | Returns 404 |

Tests use `app.inject()` — real database and Redis, no mocking.

---

## Project Structure

```
backend/
├── Dockerfile
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts              ← entry point — starts the server
    ├── app.ts                ← registers all plugins and routes
    ├── types.ts              ← module augmentation for app.pg, app.redis
    ├── plugins/
    │   ├── postgres.ts       ← PostgreSQL connection pool → app.pg
    │   ├── redis.ts          ← Redis client → app.redis
    │   ├── jwt.ts            ← JWT setup → app.authenticate
    │   └── websocket.ts      ← WebSocket support
    ├── routes/
    │   ├── auth.ts           ← POST /auth/anon
    │   ├── polls.ts          ← POST /poll, GET /poll/:id, POST /poll/:id/vote
    │   └── live.ts           ← WS /poll/:id/live
    ├── services/
    │   ├── authService.ts    ← create anonymous user + sign JWT
    │   ├── pollService.ts    ← create poll, get poll with results
    │   ├── voteService.ts    ← validate + save vote, publish to Redis
    │   └── liveService.ts    ← WebSocket registry + Redis subscriber
    ├── db/
    │   ├── migrate.ts        ← migration runner
    │   └── migrations/
    │       ├── 001_create_users.sql
    │       ├── 002_create_polls.sql
    │       └── 003_create_votes.sql
    └── tests/
        ├── setup.ts
        ├── health.test.ts
        ├── auth.test.ts
        └── polls.test.ts
```

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Start dev | `docker compose up -d` | Start all services |
| Stop | `docker compose down` | Stop all services |
| Wipe data | `docker compose down -v` | Stop + delete volumes |
| Logs | `docker compose logs -f backend` | Stream backend logs |
| Migrate | `docker compose exec backend npm run migrate` | Run DB migrations |
| Test | `docker compose exec backend npm test` | Run all tests |
| Restart | `docker compose restart backend` | Restart backend only |
| Build | `docker compose exec backend npm run build` | Compile TypeScript |

---

## Contributing

See [`CONTRIBUTING.md`](../CONTRIBUTING.md) for branch naming, commit format, and PR process.

All PRs must have passing CI before merging.

---

## License

MIT