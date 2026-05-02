# Architecture Decision Records (ADR)

ADRs document **why** we made each major technical decision.
Each record is immutable — if a decision changes, a new ADR is written.

---

## ADR-001: Use Fastify over Express

**Date:** April 2026
**Status:** Accepted

### Context
We needed a Node.js HTTP framework for the backend. The two main candidates were Express and Fastify.

### Decision
We chose **Fastify**.

### Reasons
- Fastify is 2–3x faster than Express in benchmarks (JSON serialization is built-in and optimised)
- Built-in TypeScript support without extra configuration
- Plugin system with lifecycle hooks makes it easy to add PostgreSQL, Redis, and JWT cleanly
- `app.inject()` makes testing routes without a real HTTP server trivial
- Schema-based validation is a first-class feature

### Consequences
- Team must learn Fastify's plugin system (fp / fastify-plugin)
- Fewer Stack Overflow answers than Express (Express has 10 years of community content)

---

## ADR-002: Use PostgreSQL over MongoDB

**Date:** April 2026
**Status:** Accepted

### Context
We needed a database to store users, polls, and votes. We considered PostgreSQL (relational) and MongoDB (document).

### Decision
We chose **PostgreSQL**.

### Reasons
- Votes have a strict relationship to polls and users — relational integrity matters here
- `UNIQUE(poll_id, user_id)` constraint enforces one-vote-per-user at the database level, not in application code. This is bulletproof.
- PostgreSQL's `JSONB` type lets us store poll options as a flexible array without sacrificing query performance
- `gen_random_uuid()` is built into PostgreSQL 13+ — no library needed for UUIDs

### Consequences
- Schema migrations are required when the data model changes
- More rigid structure than MongoDB — but that rigidity is the point here

---

## ADR-003: Use Redis for Pub/Sub (not polling or SSE)

**Date:** April 2026
**Status:** Accepted

### Context
For live results, we had three options:
1. Client polls `GET /poll/:id` every second
2. Server-Sent Events (SSE) — one-way stream from server to client
3. WebSocket + Redis pub/sub — bidirectional, scalable

### Decision
We chose **WebSocket + Redis pub/sub**.

### Reasons
- Polling (option 1) wastes bandwidth and adds 1-second latency — unacceptable for a live experience
- SSE (option 2) is simpler but not supported by all environments and is one-way only
- WebSocket gives true push — the server sends data the moment a vote is cast
- Redis pub/sub decouples the HTTP vote handler from the WebSocket broadcaster. They don't need to know about each other. This also means the design is ready for horizontal scaling

### Consequences
- Requires a dedicated Redis subscriber connection (subscribe mode locks a connection)
- In-memory WebSocket registry won't work in multi-instance deployments (v2 concern)

---

## ADR-004: Use JWT for anonymous auth (not sessions)

**Date:** April 2026
**Status:** Accepted

### Context
We need to identify voters without requiring them to create accounts. Options:
1. Server-side sessions (session ID in cookie, session data in Redis)
2. Stateless JWT tokens

### Decision
We chose **stateless JWT tokens**.

### Reasons
- No session store required — the server doesn't need to look anything up to verify a token
- Works naturally with WebSocket connections (token passed in URL or header)
- Stateless design means the backend can scale horizontally without session affinity
- 2-hour expiry is appropriate for a single meeting or session

### Consequences
- Tokens cannot be revoked before expiry (acceptable for anonymous users)
- If JWT_SECRET leaks, tokens can be forged — secret must be rotated

---

## ADR-005: Use Zod for validation (not Fastify's built-in JSON Schema)

**Date:** April 2026
**Status:** Accepted

### Context
Fastify supports JSON Schema validation natively. We also considered Zod.

### Decision
We chose **Zod**.

### Reasons
- Zod error messages are readable and structured — easier to return to API consumers
- Zod's TypeScript inference is excellent — `z.infer<typeof Schema>` gives us typed data automatically
- `z.coerce.date()` handles ISO date string → Date conversion in one line
- JSON Schema is verbose and has poor TypeScript integration

### Consequences
- Slightly more code per route (manual `safeParse` call)
- Two validation systems in the project is a risk — we use Zod only, never mix with JSON Schema

---

## ADR-006: Use Docker Compose for local development

**Date:** April 2026
**Status:** Accepted

### Context
The project needs PostgreSQL and Redis to run. Developers could install these natively or use containers.

### Decision
We chose **Docker Compose**.

### Reasons
- One command (`docker compose up`) starts the entire stack
- All developers run identical versions of PostgreSQL and Redis — no "works on my machine"
- Health checks ensure the backend doesn't start until DB and Redis are ready
- Production can mirror the same container setup

### Consequences
- Docker Desktop required on developer machines
- Volume deletion (`docker compose down -v`) is needed when credentials change — can surprise developers new to Docker

---

## ADR-007: Use TypeScript (not plain JavaScript)

**Date:** April 2026
**Status:** Accepted

### Decision
We chose **TypeScript** with strict mode enabled.

### Reasons
- Compile-time errors catch bugs before runtime — especially important for database query types
- Module augmentation (`declare module 'fastify'`) lets us safely type `app.pg`, `app.redis`, `app.authenticate`
- `strict: true` enforces null checks — no surprise `undefined is not a function` errors
- Industry standard for Node.js backends in 2026

### Consequences
- Build step required (`tsc`) for production
- Type errors must be fixed before the build passes — sometimes adds friction during rapid prototyping
