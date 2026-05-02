# Changelog

All notable changes to TeamPolls are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.0.0] — 2026-05-02

### Added
- `POST /auth/anon` — anonymous user creation with JWT token
- `POST /poll` — poll creation with question, options, and expiry time
- `GET /poll/:id` — poll results with vote counts per option
- `POST /poll/:id/vote` — authenticated vote casting (one vote per user per poll)
- `GET /poll/:id/live` — WebSocket endpoint for live result updates
- `GET /health` — health check for all connected services
- PostgreSQL database with users, polls, votes tables
- Database migration system with ordered SQL files
- Redis pub/sub for decoupled live update broadcasting
- JWT authentication via `@fastify/jwt`
- Input validation via Zod on all endpoints
- Rate limiting — 5 requests/second per IP via `@fastify/rate-limit`
- HTTP security headers via `@fastify/helmet`
- Structured logging via Pino + pino-pretty
- 9 automated tests covering all routes and edge cases
- GitHub Actions CI pipeline — tests run on every push to `main`
- Docker Compose setup for one-command local development
- Full project documentation (PRD, TDD, ADR, API Reference, Runbook, Security)

---

## [Unreleased]

### Planned for v1.1
- React + Vite frontend (Phase 8)
- Live results bar chart
- Poll sharing via URL

### Planned for v2.0
- TLS via nginx reverse proxy
- Poll password protection
- CORS configuration for production
- Horizontal scaling support (Redis-backed WS registry)
- Audit logging
- Export results to CSV
