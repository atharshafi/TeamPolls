# Technical Design Document (TDD)

**Project:** TeamPolls
**Version:** 1.0
**Status:** Approved
**Author:** Athar
**Date:** May 2026

---

## 1. Architecture Overview

TeamPolls follows a **Layered Architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│              Client (Browser)           │
│         React + Vite (Phase 8)          │
└─────────────────┬───────────────────────┘
                  │ HTTP / WebSocket
┌─────────────────▼───────────────────────┐
│           Backend (Fastify)             │
│  routes/ → services/ → db/ + redis/     │
└──────┬──────────────────────┬───────────┘
       │                      │
┌──────▼──────┐      ┌────────▼────────┐
│ PostgreSQL  │      │     Redis       │
│  (data)     │      │ (pub/sub cache) │
└─────────────┘      └─────────────────┘
```

### Layer Responsibilities

| Layer | Folder | Responsibility |
|-------|--------|---------------|
| Routes | `src/routes/` | Receive HTTP/WS requests, validate input, send responses |
| Services | `src/services/` | All business logic — no HTTP knowledge |
| Plugins | `src/plugins/` | Infrastructure connections (DB, Redis, JWT) |
| Migrations | `src/db/migrations/` | Database schema versioning |

---

## 2. Component Design

### 2.1 Authentication Flow

```
Client                    Backend                   PostgreSQL
  │                          │                           │
  │  POST /auth/anon          │                           │
  ├─────────────────────────► │                           │
  │                          │  INSERT INTO users        │
  │                          ├──────────────────────────►│
  │                          │  ← { id: uuid }           │
  │                          │                           │
  │                          │  jwt.sign({ userId })     │
  │  ◄─────────────────────── │                           │
  │  { token, userId }        │                           │
```

### 2.2 Vote + Live Update Flow

```
Voter             Backend          PostgreSQL       Redis         All WS Clients
  │                  │                 │              │                 │
  │ POST /vote        │                 │              │                 │
  ├────────────────► │                 │              │                 │
  │                  │ INSERT vote     │              │                 │
  │                  ├───────────────► │              │                 │
  │                  │ ← ok            │              │                 │
  │                  │                 │              │                 │
  │                  │ PUBLISH vote:cast              │                 │
  │                  ├──────────────────────────────► │                 │
  │ ← 201 Created    │                 │              │                 │
  │                  │                 │    on message│                 │
  │                  │ ◄──────────────────────────────│                 │
  │                  │ SELECT results  │              │                 │
  │                  ├───────────────► │              │                 │
  │                  │ ← vote counts   │              │                 │
  │                  │ broadcast to all WS clients    │                 │
  │                  ├─────────────────────────────────────────────────►
  │                  │                 │              │  { updated results }
```

### 2.3 WebSocket Subscription

```
Client                    Backend (liveService)
  │                              │
  │  GET /poll/:id/live (WS)     │
  ├────────────────────────────► │
  │                              │  subscribe(pollId, socket)
  │                              │  (added to in-memory Map)
  │  ◄──────────── current results
  │                              │
  │          ... time passes ... │
  │                              │  (vote arrives via Redis)
  │  ◄──────────── updated results
  │                              │
  │  (tab closed)                │
  ├── WS close event ──────────► │
  │                              │  unsubscribe(pollId, socket)
```

---

## 3. Database Design

### 3.1 Schema

**users**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key, generated |
| created_at | TIMESTAMPTZ | Auto-set |

**polls**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key, generated |
| question | TEXT | 3–500 chars |
| options | JSONB | Array of strings |
| expires_at | TIMESTAMPTZ | Set by creator |
| created_at | TIMESTAMPTZ | Auto-set |

**votes**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key, generated |
| poll_id | UUID | FK → polls.id (CASCADE) |
| user_id | UUID | FK → users.id (CASCADE) |
| option_idx | INTEGER | Index into poll.options |
| created_at | TIMESTAMPTZ | Auto-set |

**Unique constraint:** `UNIQUE(poll_id, user_id)` — enforces one vote per user per poll at database level.

### 3.2 Indexes

```sql
CREATE INDEX idx_polls_expires_at ON polls(expires_at);
CREATE INDEX idx_votes_poll_id    ON votes(poll_id);
CREATE INDEX idx_votes_user_id    ON votes(user_id);
```

### 3.3 Migration Strategy

- Migrations live in `src/db/migrations/` as numbered SQL files
- A `_migrations` table tracks which files have run
- Migrations are idempotent — safe to run multiple times
- Never modify an existing migration; always create a new one

---

## 4. API Design

### 4.1 REST Conventions

- All request/response bodies are `application/json`
- Successful creates return `201 Created`
- Successful reads return `200 OK`
- Validation errors return `400 Bad Request` with Zod error details
- Auth errors return `401 Unauthorized`
- Not found returns `404 Not Found`
- Server errors return `500 Internal Server Error`

### 4.2 Rate Limiting

- Global: 5 requests per second per IP
- Disabled in `NODE_ENV=test` to avoid false failures in CI
- Returns `429 Too Many Requests` when exceeded

### 4.3 Input Validation

All incoming data is validated with **Zod** before reaching the database:

```typescript
const CreatePollSchema = z.object({
  question: z.string().min(3).max(500),
  options:  z.array(z.string().min(1)).min(2).max(10),
  expiresAt: z.coerce.date()
})
```

---

## 5. Real-Time Design

### 5.1 Why Redis Pub/Sub?

Redis pub/sub is used as the message bus between the HTTP vote handler and the WebSocket broadcaster. This design is intentional:

- The HTTP handler (which saves the vote) and the WebSocket broadcaster are decoupled
- In future, multiple backend instances can run — each subscribes to Redis and broadcasts to its own connected clients
- Redis handles the fan-out, not the application

### 5.2 In-Memory Connection Registry

Active WebSocket connections are stored in a `Map<pollId, Set<WebSocket>>` in `liveService.ts`. This is intentional for v1.0 — it is fast and simple. In a multi-instance deployment, this would be replaced with a shared registry (e.g., Redis itself).

---

## 6. Security Design

| Concern | Approach |
|---------|---------|
| HTTP headers | `@fastify/helmet` — sets Content-Security-Policy, X-Frame-Options, etc. |
| Auth | Short-lived JWT (2h expiry), verified on every vote request |
| Input validation | Zod rejects malformed data before it touches the DB |
| SQL injection | Parameterised queries only (`$1, $2` syntax) — never string interpolation |
| Rate limiting | 5 req/sec per IP — mitigates vote flooding |
| Secrets | All secrets in `.env` — never hardcoded or committed |
| Anonymous identity | Users are random UUIDs — no PII stored |

---

## 7. Error Handling Strategy

- All route handlers are wrapped in `try/catch`
- Expected errors (poll not found, already voted) return structured JSON with a descriptive `error` field
- Unexpected errors are logged via Pino and return a generic 500 message (no stack traces to clients)
- Database constraint violations (error code `23505`) are caught specifically for double-vote detection

---

## 8. Technology Decisions

See [ADR.md](./ADR.md) for the full rationale behind each major technology choice.

---

## 9. Known Limitations (v1.0)

| Limitation | Impact | Resolution in v2 |
|-----------|--------|-----------------|
| In-memory WS registry | Won't work across multiple backend instances | Replace with Redis-backed registry |
| No TLS | Unencrypted traffic on local network | Add nginx reverse proxy with SSL |
| No poll ownership | Anyone can read any poll by ID | Add creator token or password protection |
| No metrics endpoint | No Prometheus/Grafana visibility | Expose `/metrics` via prom-client |
