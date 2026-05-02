# Product Requirements Document (PRD)

**Project:** TeamPolls
**Version:** 1.0
**Status:** Approved
**Author:** Athar
**Date:** May 2026
**Reviewers:** Engineering Lead, Product Lead

---

## 1. Overview

### 1.1 Problem Statement

Teams in meetings and remote sessions need a quick, anonymous way to gather opinions or votes. Existing solutions (Slido, Mentimeter) require paid subscriptions and complex setup. TeamPolls provides a lightweight, self-hosted alternative that any team can deploy.

### 1.2 Product Vision

A fast, anonymous polling tool that works in real time — no account creation required for voters, results visible to everyone as they come in.

### 1.3 Success Metrics

| Metric | Target |
|--------|--------|
| Time to create a poll | Under 30 seconds |
| Vote-to-result latency | Under 500ms |
| Uptime | 99.5% |
| Test coverage | 80%+ |
| Anonymous user flow | Zero friction (no signup) |

---

## 2. Users

### 2.1 User Personas

**Manager (Poll Creator)**
- Creates polls with a question, options, and expiry time
- Wants to see live results on screen during meetings
- Does not need to vote

**Employee (Voter)**
- Opens a poll link and votes anonymously
- Sees results update live after voting
- Cannot vote twice on the same poll

### 2.2 Out of Scope Users

- Super admins managing multiple organizations
- Public internet users (this is an internal tool)

---

## 3. Features

### 3.1 MVP Features (v1.0)

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| F-01 | Anonymous JWT token on first visit | P0 | No signup required |
| F-02 | Create poll (question + options + expiry) | P0 | Manager action |
| F-03 | Cast one vote per poll per user | P0 | Enforced at DB level |
| F-04 | View poll results with vote counts | P0 | Available to everyone |
| F-05 | Live results via WebSocket | P0 | No page refresh needed |
| F-06 | Poll expiry — no votes after expiry time | P0 | Server-side check |
| F-07 | Rate limiting on vote endpoint | P1 | 5 req/sec per IP |

### 3.2 Future Features (Post v1.0)

| ID | Feature | Priority |
|----|---------|----------|
| F-08 | Poll password protection | P2 |
| F-09 | Multiple question types (ranked, open text) | P2 |
| F-10 | Export results to CSV | P2 |
| F-11 | Manager dashboard for multiple polls | P3 |
| F-12 | Email/Slack notification when poll ends | P3 |

---

## 4. Functional Requirements

### 4.1 Authentication

- FR-01: Any client can call `POST /auth/anon` to receive a JWT token without providing any credentials
- FR-02: JWT tokens expire after 2 hours
- FR-03: The voting endpoint must reject requests without a valid JWT

### 4.2 Poll Management

- FR-04: A poll must have a question (3–500 characters), 2–10 options, and a future expiry time
- FR-05: The system must reject invalid poll data with a descriptive 400 error
- FR-06: Poll IDs must be UUIDs (not guessable sequential integers)

### 4.3 Voting

- FR-07: One user (identified by JWT) can cast exactly one vote per poll
- FR-08: Attempting to vote twice must return an error, not silently fail
- FR-09: Voting on an expired poll must return an error
- FR-10: Voting on a non-existent poll must return a 404

### 4.4 Results

- FR-11: `GET /poll/:id` must return vote counts grouped by option
- FR-12: Results must include an `is_expired` flag
- FR-13: WebSocket clients must receive updated results within 500ms of a vote being cast

---

## 5. Non-Functional Requirements

| Category | Requirement |
|----------|------------|
| Performance | API responses under 200ms at 100 concurrent users |
| Security | All inputs validated with Zod, helmet headers on all responses |
| Reliability | PostgreSQL and Redis health checks before backend starts |
| Scalability | Stateless backend — can run multiple instances behind a load balancer |
| Observability | Structured JSON logging via Pino on all requests |
| Testability | All routes covered by automated tests, CI runs on every push |

---

## 6. Constraints

- Must run entirely via Docker Compose (no external cloud services in v1.0)
- No personally identifiable information stored — users are anonymous UUIDs
- Backend must start only after PostgreSQL and Redis are healthy

---

## 7. Assumptions

- Internal network deployment — no TLS required in v1.0
- Single-instance deployment in v1.0 (horizontal scaling is a v2 concern)
- Voters are on the same network as the server (office/VPN)

---

## 8. Out of Scope (v1.0)

- User accounts with passwords
- Email notifications
- Mobile native apps
- Poll analytics / history
- Admin panel
