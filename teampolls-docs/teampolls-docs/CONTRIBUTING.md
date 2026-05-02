# Contributing to TeamPolls

Thank you for contributing! This document explains how we work.

---

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/teampolls.git`
3. Follow the setup in [README.md](./README.md)
4. Create a branch for your change (see Branch Naming below)

---

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/short-description` | `feat/poll-password-protection` |
| Bug fix | `fix/short-description` | `fix/websocket-disconnect-cleanup` |
| Docs | `docs/short-description` | `docs/api-reference-update` |
| Refactor | `refactor/short-description` | `refactor/vote-service-cleanup` |
| Test | `test/short-description` | `test/add-expiry-edge-cases` |

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add poll password protection
fix: clean up WebSocket connection on abnormal close
docs: update API reference with WebSocket examples
test: add expired poll vote rejection test
refactor: extract vote validation into helper function
chore: update dependencies
```

---

## Pull Request Process

1. Make sure all tests pass: `docker compose exec backend npm test`
2. Make sure there are no TypeScript errors: `docker compose exec backend npm run build`
3. Write tests for any new functionality
4. Update relevant documentation (`API_REFERENCE.md`, `TDD.md`, etc.)
5. Open a PR with a clear description of what changed and why
6. Request a review from at least one other developer
7. All CI checks must be green before merging

---

## Code Standards

- All new code must be TypeScript with strict mode
- Use `async/await` — no raw Promise chains
- Use parameterised queries — never string-concatenated SQL
- All route handlers must have `try/catch`
- New endpoints must have corresponding tests
- Follow the existing layer pattern: routes → services → db

---

## Running Tests

```bash
docker compose exec backend npm test
```

All 9 tests must pass before submitting a PR.

---

## Questions?

Open an issue on GitHub or contact the maintainer directly.
