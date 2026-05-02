# Security Document

**Project:** TeamPolls
**Version:** 1.0
**Classification:** Internal
**Date:** May 2026

---

## 1. Security Summary

TeamPolls is designed for internal team use on a trusted network. The following controls are in place for v1.0.

| Control | Implemented | Notes |
|---------|-------------|-------|
| HTTP security headers | ✅ | Via @fastify/helmet |
| Input validation | ✅ | Via Zod on all endpoints |
| SQL injection prevention | ✅ | Parameterised queries only |
| Authentication on vote | ✅ | JWT required |
| Rate limiting | ✅ | 5 req/sec per IP |
| No PII stored | ✅ | Users are anonymous UUIDs only |
| Secrets in environment | ✅ | `.env` file, never committed |
| TLS / HTTPS | ❌ | Not in v1.0 — add nginx in production |
| CORS configuration | ❌ | Not restricted in v1.0 |
| Audit logging | ❌ | Planned for v2 |

---

## 2. Authentication & Authorization

### How it works

- Users call `POST /auth/anon` to receive a JWT token
- The JWT contains only `{ userId: string }` — no name, email, or other PII
- The JWT is signed with `JWT_SECRET` using HS256 algorithm
- JWT tokens expire after **2 hours**
- The vote endpoint verifies the JWT on every request via `app.authenticate`

### What a JWT looks like

```
Header:  { "alg": "HS256", "typ": "JWT" }
Payload: { "userId": "8e40ce3a-...", "iat": 1234567890, "exp": 1234574890 }
```

### Threat: JWT secret compromise

If `JWT_SECRET` leaks, an attacker can forge tokens for any userId.

**Mitigations:**
- Never hardcode JWT_SECRET in source code
- Rotate JWT_SECRET immediately if compromise is suspected — all existing tokens become invalid
- Use a minimum 32-character random string: `openssl rand -hex 32`

---

## 3. Input Validation

Every incoming request body is validated with Zod before any database work:

```typescript
CreatePollSchema = z.object({
  question: z.string().min(3).max(500),
  options:  z.array(z.string().min(1)).min(2).max(10),
  expiresAt: z.coerce.date()
})
```

If validation fails, the request is rejected with a 400 before touching the database.

---

## 4. SQL Injection Prevention

All database queries use parameterised statements:

```typescript
// SAFE — user input never concatenated into SQL
await app.pg.query(
  'SELECT * FROM polls WHERE id = $1',
  [pollId]
)

// NEVER do this
await app.pg.query(`SELECT * FROM polls WHERE id = '${pollId}'`)
```

---

## 5. HTTP Security Headers

`@fastify/helmet` sets the following headers on every response:

| Header | Value | Purpose |
|--------|-------|---------|
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-Frame-Options | SAMEORIGIN | Prevent clickjacking |
| X-XSS-Protection | 0 | Modern browsers don't need this — disabled |
| Strict-Transport-Security | max-age=15552000 | Force HTTPS (when TLS is added) |

`contentSecurityPolicy` is disabled in v1.0 as the frontend is not yet configured.

---

## 6. Rate Limiting

The `@fastify/rate-limit` plugin limits all requests to **5 per second per IP address**.

This mitigates:
- Vote flooding / ballot stuffing
- Brute force on JWT endpoints
- Denial of service via request volume

Rate limiting is disabled in `NODE_ENV=test` to avoid false test failures.

---

## 7. Data Privacy

- No names, emails, or any personally identifiable information are stored
- Users are identified only by a randomly generated UUID
- There is no way to link a vote back to a real person
- All data is stored locally — no third-party services receive any data

---

## 8. Secrets Management

| Secret | Where stored | Notes |
|--------|-------------|-------|
| POSTGRES_PASSWORD | `.env` only | Never in source code |
| JWT_SECRET | `.env` only | Minimum 32 characters |
| All `.env` | `.gitignore`'d | Use `.env.example` as template |

**Generating a strong JWT secret:**
```bash
openssl rand -hex 32
```

**Rotating secrets in production:**
1. Update `.env` with new values
2. `docker compose down && docker compose up -d`
3. All existing JWT tokens become invalid — users will need to re-authenticate

---

## 9. Known Security Gaps (v1.0)

These are accepted risks for v1.0 internal deployment and are planned for v2:

| Gap | Risk | v2 Plan |
|-----|------|---------|
| No TLS | Traffic unencrypted on network | Add nginx reverse proxy with Let's Encrypt SSL |
| No CORS restriction | Any origin can call the API | Configure allowed origins in production |
| No poll ownership | Anyone with poll ID can read results | Add creator token or password protection |
| No audit log | Votes cannot be traced back for disputes | Add structured audit log table |
| Tokens not revokable | Compromised token valid until expiry | Add token revocation list in Redis |

---

## 10. Security Incident Response

If a security issue is discovered:

1. **Assess severity** — is data at risk? Is the service compromised?
2. **Contain** — if JWT_SECRET is compromised: rotate it immediately (`docker compose down && update .env && docker compose up -d`)
3. **Wipe if needed** — if database is compromised: `docker compose down -v` removes all data
4. **Document** — write up what happened, what was affected, what was done
5. **Patch** — fix the vulnerability before bringing service back online

To report a security issue, contact the project maintainer directly.
