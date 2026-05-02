# Test Report

**Project:** TeamPolls
**Version:** 1.0.0
**Date:** May 2026
**Test Framework:** Vitest v4.1.2
**Environment:** Docker (Node.js 22, PostgreSQL 16, Redis 7)

---

## Summary

| Metric | Result |
|--------|--------|
| Test files | 3 |
| Total tests | 9 |
| Passed | 9 |
| Failed | 0 |
| Duration | ~890ms |
| Status | ✅ All passing |

---

## Test Files

### health.test.ts — 1 test

| Test | Status | Duration |
|------|--------|----------|
| GET /health → should return status ok | ✅ Pass | ~6ms |

**What it verifies:**
- Response status code is 200
- Body contains `status: "ok"`
- PostgreSQL shows as connected
- Redis shows as connected

---

### auth.test.ts — 1 test

| Test | Status | Duration |
|------|--------|----------|
| POST /auth/anon → should return a JWT token and userId | ✅ Pass | ~28ms |

**What it verifies:**
- Response status code is 201
- Response body contains a `token` field
- Response body contains a `userId` field
- Token is a non-empty string

---

### polls.test.ts — 7 tests

| # | Test | Status | Duration |
|---|------|--------|----------|
| 1 | POST /poll → should create a poll and return it | ✅ Pass | ~10ms |
| 2 | GET /poll/:id → should return poll with empty votes | ✅ Pass | ~4ms |
| 3 | POST /poll/:id/vote → should record a vote | ✅ Pass | ~7ms |
| 4 | GET /poll/:id → should show 1 vote after voting | ✅ Pass | ~3ms |
| 5 | POST /poll/:id/vote → should reject a second vote from same user | ✅ Pass | ~2ms |
| 6 | POST /poll/:id/vote → should reject request without token | ✅ Pass | ~1ms |
| 7 | GET /poll/:id → should return 404 for unknown poll | ✅ Pass | ~1ms |

**What they verify:**
- Poll is created and ID is returned
- Fresh poll has empty votes array
- Authenticated vote is saved and returns 201
- Vote count increments correctly in results
- Duplicate vote rejected with 400 (UNIQUE constraint working)
- Missing JWT rejected with 401 (auth middleware working)
- Unknown poll ID returns 404 (not found handling)

---

## Test Approach

### Testing Strategy

We use **integration tests** rather than unit tests. Each test sends real HTTP requests (via `app.inject()`) against a real database and Redis instance. This means:

- Tests verify the full stack — routing, validation, service logic, and database
- No mocking — tests fail if the database schema is wrong
- Tests are slower than pure unit tests but catch real integration bugs

### Why `app.inject()` instead of `supertest`?

Fastify's `app.inject()` sends fake HTTP requests without opening a real TCP socket. This is faster and more reliable in CI than `supertest` which requires a real listening port.

### Test Isolation

Each test run starts with a fresh database state (volumes are reset in CI). In local development, tests create real records in the development database — this is acceptable for v1.0.

---

## Known Test Limitations

| Limitation | Impact | Plan |
|-----------|--------|------|
| No WebSocket tests | Live update flow not covered | Add in v1.1 using WebSocket test client |
| No expired poll test | Expiry logic tested manually only | Add time-mocking in v1.1 |
| No load / performance tests | Don't know behaviour under concurrent votes | Add k6 load tests in v2 |
| Tests share a database | Parallel test runs could conflict | Acceptable with `singleFork: true` |

---

## CI Results

Tests run automatically on every push to `main` via GitHub Actions.

**CI environment:**
- Ubuntu latest
- Node.js 22
- PostgreSQL 16-alpine (service container)
- Redis 7-alpine (service container)

All 9 tests must pass for a PR to be mergeable.
