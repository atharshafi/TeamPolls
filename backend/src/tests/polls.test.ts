import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp, closeApp } from './setup.js'
import { FastifyInstance } from 'fastify'

let app: FastifyInstance
let pollId: string    // we'll store the poll ID between tests
let token: string     // we'll store the JWT token between tests

beforeAll(async () => {
  app = await buildApp()

  // Get an anonymous token once — reuse it in all poll tests
  const res = await app.inject({ method: 'POST', url: '/auth/anon' })
  token = res.json().token
})

afterAll(async () => {
  await closeApp()
})

describe('Poll routes', () => {

  // ── Test 1: Create a poll ──────────────────────────
  it('POST /poll should create a poll and return it', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/poll',
      payload: {
        question: 'Test question?',
        options: ['Option A', 'Option B', 'Option C'],
        expiresAt: '2026-12-31T23:59:59Z'
      }
    })

    expect(response.statusCode).toBe(201)

    const body = response.json()
    expect(body.id).toBeDefined()
    expect(body.question).toBe('Test question?')

    pollId = body.id  // save for next tests
  })


  // ── Test 2: Get poll results ───────────────────────
  it('GET /poll/:id should return poll with empty votes', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/poll/${pollId}`
    })

    expect(response.statusCode).toBe(200)

    const body = response.json()
    expect(body.id).toBe(pollId)
    expect(body.votes).toBeDefined()
    expect(body.is_expired).toBe(false)
  })


  // ── Test 3: Vote on the poll ───────────────────────
  it('POST /poll/:id/vote should record a vote', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/poll/${pollId}/vote`,
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: { optionIdx: 0 }
    })

    expect(response.statusCode).toBe(201)
    expect(response.json().message).toBe('Vote recorded successfully')
  })


  // ── Test 4: Vote count updated ─────────────────────
  it('GET /poll/:id should show 1 vote after voting', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/poll/${pollId}`
    })

    const body = response.json()
    const votesForOption0 = body.votes.find((v: { option_idx: number }) => v.option_idx === 0)

    expect(votesForOption0).toBeDefined()
    expect(votesForOption0.count).toBe(1)
  })


  // ── Test 5: Can't vote twice ───────────────────────
  it('POST /poll/:id/vote should reject a second vote from same user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/poll/${pollId}/vote`,
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: { optionIdx: 1 }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().error).toBe('You have already voted on this poll')
  })


  // ── Test 6: Can't vote without a token ────────────
  it('POST /poll/:id/vote should reject request without token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/poll/${pollId}/vote`,
      payload: { optionIdx: 0 }
    })

    expect(response.statusCode).toBe(401)
  })


  // ── Test 7: 404 for unknown poll ───────────────────
  it('GET /poll/:id should return 404 for unknown poll', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/poll/00000000-0000-0000-0000-000000000000'
    })

    expect(response.statusCode).toBe(404)
  })
})