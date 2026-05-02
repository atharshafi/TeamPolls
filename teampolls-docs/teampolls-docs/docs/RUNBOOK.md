# Runbook — Deployment & Operations

> A runbook is what an engineer opens at 2am when something breaks.
> Every common scenario is covered here with exact commands.

**Project:** TeamPolls
**Environment:** Docker Compose (single host)
**Maintained by:** Athar

---

## 1. Normal Operations

### Start everything

```bash
docker compose up -d
```

### Stop everything (keep data)

```bash
docker compose down
```

### Stop everything and wipe all data

```bash
docker compose down -v
```

⚠️ This deletes all PostgreSQL and Redis data permanently. Use only in development or when resetting a broken environment.

### View live logs

```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Last 50 lines
docker compose logs backend --tail=50
```

### Check container health

```bash
docker compose ps
```

All three containers should show `(healthy)`:
```
NAME                   STATUS
teampolls_postgres     running (healthy)
teampolls_redis        running (healthy)
teampolls_backend      running
```

---

## 2. Database Operations

### Run migrations

```bash
docker compose exec backend npm run migrate
```

Run this after every deployment that includes new migration files.

### Connect to PostgreSQL directly

```bash
docker compose exec postgres psql -U polluser -d pollsdb
```

Useful queries:

```sql
-- Count polls
SELECT COUNT(*) FROM polls;

-- Count votes
SELECT COUNT(*) FROM votes;

-- See recent votes
SELECT v.id, p.question, v.option_idx, v.created_at
FROM votes v
JOIN polls p ON p.id = v.poll_id
ORDER BY v.created_at DESC
LIMIT 10;

-- See which migrations have run
SELECT * FROM _migrations ORDER BY ran_at;
```

### Backup the database

```bash
docker compose exec postgres pg_dump -U polluser pollsdb > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from backup

```bash
cat backup_20260502_120000.sql | docker compose exec -T postgres psql -U polluser pollsdb
```

---

## 3. Common Incidents

### Backend won't start — PostgreSQL auth failed (code 28P01)

**Symptoms:** Logs show `auth_failed` or `28P01`

**Cause:** The PostgreSQL volume was created with different credentials than the current `.env` file.

**Fix:**
```bash
docker compose down -v
docker compose up -d
docker compose exec backend npm run migrate
```

---

### Backend won't start — connection timeout

**Symptoms:** Logs show `Connection terminated due to connection timeout`

**Cause:** Backend started before PostgreSQL was fully ready.

**Fix:**
```bash
docker compose down
docker compose up -d
```

The `depends_on: condition: service_healthy` should prevent this. If it keeps happening, check that the PostgreSQL healthcheck is passing:
```bash
docker compose ps postgres
```

---

### Rate limit errors during testing (429)

**Symptoms:** Tests fail with `expected 400 to be 429`

**Cause:** `NODE_ENV` is not set to `test`.

**Fix:** Ensure the test script in `package.json` sets `NODE_ENV=test`:
```json
"test": "NODE_ENV=test vitest run"
```

---

### WebSocket not receiving updates after votes

**Symptoms:** Votes are saved (POST /vote returns 201) but WebSocket clients don't receive updates.

**Check 1 — Redis subscriber running:**
```bash
docker compose logs backend | grep "Redis subscriber"
```
Should show: `✅ Redis subscriber listening on vote:cast`

**Check 2 — Redis pub/sub working:**
```bash
docker compose exec redis redis-cli
SUBSCRIBE vote:cast
# In another terminal, cast a vote and watch if a message appears
```

**Check 3 — Restart backend:**
```bash
docker compose restart backend
```

---

### Tests fail with "Cannot use a pool after calling end on the pool"

**Symptoms:** Error in test logs about the pool being closed.

**Cause:** Multiple test files sharing the same Fastify app instance — one closes the pool before others finish.

**Fix:** Ensure `vitest.config` in `package.json` has `singleFork: true`:
```json
"vitest": {
  "pool": "forks",
  "poolOptions": {
    "forks": { "singleFork": true }
  }
}
```

---

### Disk space — Docker volumes growing large

**Check disk usage:**
```bash
docker system df
```

**Clean up unused images and containers:**
```bash
docker system prune
```

**Clean up unused volumes (⚠️ will delete data):**
```bash
docker volume prune
```

---

## 4. Deployment Checklist

Use this checklist before every deployment to production:

- [ ] All tests passing locally: `docker compose exec backend npm test`
- [ ] CI pipeline green on GitHub Actions
- [ ] `.env` file updated on the server (never deploy with development secrets)
- [ ] New migration files present? → Run `npm run migrate` after deploy
- [ ] `docker compose pull` to fetch latest images
- [ ] `docker compose up -d --build` to rebuild and restart
- [ ] Health check passing: `curl http://localhost:3000/health`
- [ ] Quick smoke test: create a poll, vote, check results

---

## 5. Environment Variables Reference

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| POSTGRES_USER | Yes | `polluser` | PostgreSQL username |
| POSTGRES_PASSWORD | Yes | `changeme123` | Use a strong password in production |
| POSTGRES_DB | Yes | `pollsdb` | Database name |
| DATABASE_URL | Yes | `postgresql://polluser:pw@postgres:5432/pollsdb` | Full connection string |
| REDIS_URL | Yes | `redis://redis:6379` | Redis connection string |
| JWT_SECRET | Yes | `long-random-string` | Min 32 chars, keep secret |
| PORT | Yes | `3000` | Port the backend listens on |
| NODE_ENV | Yes | `development` / `production` / `test` | Controls rate limiting |

---

## 6. Health Check Endpoints

| Endpoint | Expected Response | Check Frequency |
|----------|------------------|-----------------|
| `GET /health` | `{ "status": "ok" }` | Every 30 seconds |

In production, point your load balancer or uptime monitor at `/health`.
