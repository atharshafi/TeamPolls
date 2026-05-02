import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp, closeApp } from './setup.js'
import { FastifyInstance } from 'fastify'

// describe = a group of related tests (like a chapter)
// it       = one single test (like one sentence in that chapter)
// expect   = the actual check (like "I expect this to equal that")

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
})

afterAll(async () => {
  await closeApp()
})

describe('Health check', () => {
  it('should return status ok', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    })

    // app.inject = sends a fake HTTP request without needing a real server
    // It's like a test dummy — safe, fast, no real network needed

    expect(response.statusCode).toBe(200)

    const body = response.json()
    expect(body.status).toBe('ok')
    expect(body.services.postgres).toBe('connected')
    expect(body.services.redis).toBe('connected')
  })
})