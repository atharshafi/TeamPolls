# API Reference

**Base URL:** `http://localhost:3000`
**Version:** v1.0
**Auth:** Bearer JWT (obtain from `POST /auth/anon`)

---

## Authentication

All protected endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens are obtained from `POST /auth/anon` and expire after **2 hours**.

---

## Endpoints

---

### GET /health

Health check. Returns the status of all connected services.

**Auth required:** No

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-02T12:00:00.000Z",
  "services": {
    "postgres": "connected",
    "redis": "connected"
  }
}
```

---

### POST /auth/anon

Creates an anonymous user and returns a JWT token. Call this once per session — reuse the token for all subsequent requests.

**Auth required:** No

**Request body:** None

**Response 201:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "8e40ce3a-1234-5678-abcd-ef1234567890",
  "message": "Anonymous user created successfully"
}
```

**Error responses:**

| Status | When |
|--------|------|
| 500 | Database unavailable |

---

### POST /poll

Creates a new poll.

**Auth required:** No

**Request body:**

```json
{
  "question": "What is your favourite language?",
  "options": ["TypeScript", "Python", "Go"],
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

**Field rules:**

| Field | Type | Rules |
|-------|------|-------|
| question | string | Min 3 chars, max 500 chars |
| options | string[] | Min 2 items, max 10 items. Each item min 1 char |
| expiresAt | ISO 8601 date string | Must be a valid date |

**Response 201:**
```json
{
  "id": "613059aa-9d5b-42ce-ac2c-ddaff93c291f",
  "question": "What is your favourite language?",
  "options": ["TypeScript", "Python", "Go"],
  "expires_at": "2026-12-31T23:59:59.000Z",
  "created_at": "2026-05-02T12:00:00.000Z"
}
```

**Error responses:**

| Status | When |
|--------|------|
| 400 | Validation failed (missing fields, wrong types, too few options) |
| 429 | Rate limit exceeded |
| 500 | Database error |

**400 example:**
```json
{
  "error": "Invalid input",
  "details": [
    {
      "code": "too_small",
      "message": "Array must contain at least 2 element(s)",
      "path": ["options"]
    }
  ]
}
```

---

### GET /poll/:id

Returns a poll with its current vote counts and expiry status.

**Auth required:** No

**URL parameters:**

| Param | Type | Description |
|-------|------|-------------|
| id | UUID | Poll ID returned from POST /poll |

**Response 200:**
```json
{
  "id": "613059aa-9d5b-42ce-ac2c-ddaff93c291f",
  "question": "What is your favourite language?",
  "options": ["TypeScript", "Python", "Go"],
  "expires_at": "2026-12-31T23:59:59.000Z",
  "created_at": "2026-05-02T12:00:00.000Z",
  "votes": [
    { "option_idx": 0, "count": 14 },
    { "option_idx": 2, "count": 7 }
  ],
  "is_expired": false
}
```

Notes:
- `votes` only includes options that have at least one vote. Options with zero votes are omitted.
- `option_idx` maps to the position in the `options` array (0-indexed)
- `is_expired: true` when current time is past `expires_at`

**Error responses:**

| Status | When |
|--------|------|
| 404 | Poll ID does not exist |
| 429 | Rate limit exceeded |
| 500 | Database error |

---

### POST /poll/:id/vote

Casts a vote on a poll. Each user (identified by JWT) can only vote once per poll.

**Auth required:** Yes (Bearer JWT)

**URL parameters:**

| Param | Type | Description |
|-------|------|-------------|
| id | UUID | Poll ID |

**Request body:**
```json
{
  "optionIdx": 0
}
```

| Field | Type | Rules |
|-------|------|-------|
| optionIdx | integer | Must be ≥ 0 and less than the number of options |

**Response 201:**
```json
{
  "message": "Vote recorded successfully"
}
```

**Error responses:**

| Status | Body | When |
|--------|------|------|
| 400 | `{ "error": "Poll not found" }` | Poll ID doesn't exist |
| 400 | `{ "error": "Poll has expired" }` | Past expiry time |
| 400 | `{ "error": "Invalid option selected" }` | optionIdx out of range |
| 400 | `{ "error": "You have already voted on this poll" }` | User voted before |
| 400 | `{ "error": "Invalid input", "details": [...] }` | Malformed body |
| 401 | `{ "error": "Unauthorized" }` | Missing or invalid JWT |
| 429 | Rate limit message | Too many requests |
| 500 | `{ "error": "Could not record vote" }` | Server error |

---

### WebSocket: GET /poll/:id/live

Opens a WebSocket connection that receives live results whenever a vote is cast.

**Auth required:** No

**URL parameters:**

| Param | Type | Description |
|-------|------|-------------|
| id | UUID | Poll ID to watch |

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:3000/poll/613059aa-9d5b-42ce-ac2c-ddaff93c291f/live')

ws.onmessage = (event) => {
  const results = JSON.parse(event.data)
  console.log(results)
}
```

**Initial message (sent immediately on connect):**
```json
{
  "id": "613059aa-9d5b-42ce-ac2c-ddaff93c291f",
  "question": "What is your favourite language?",
  "options": ["TypeScript", "Python", "Go"],
  "expires_at": "2026-12-31T23:59:59.000Z",
  "created_at": "2026-05-02T12:00:00.000Z",
  "votes": [],
  "is_expired": false
}
```

**Push message (sent every time someone votes):**
Same structure as above, with updated `votes` array.

**Error message (poll not found):**
```json
{ "error": "Poll not found" }
```
Connection is closed immediately after this message.

---

## Error Format

All error responses follow this structure:

```json
{
  "error": "Short error title",
  "message": "Optional longer explanation"
}
```

Validation errors include a `details` array from Zod:

```json
{
  "error": "Invalid input",
  "details": [
    {
      "code": "too_small",
      "minimum": 3,
      "type": "string",
      "message": "String must contain at least 3 character(s)",
      "path": ["question"]
    }
  ]
}
```

---

## Rate Limits

| Limit | Value |
|-------|-------|
| Requests per second per IP | 5 |
| Response when exceeded | 429 Too Many Requests |
| Reset window | 1 second |

Rate limiting is disabled when `NODE_ENV=test`.
