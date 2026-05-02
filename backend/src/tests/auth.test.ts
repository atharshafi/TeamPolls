import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp, closeApp } from './setup.js'
import { FastifyInstance } from 'fastify'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
})

afterAll(async () => {
  await closeApp()
})

describe('Auth routes', () => {
  it('POST /auth/anon should return a JWT token and userId', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/anon'
    })

    expect(response.statusCode).toBe(201)

    const body = response.json()
    expect(body.token).toBeDefined()       // token must exist
    expect(body.userId).toBeDefined()      // userId must exist
    expect(typeof body.token).toBe('string')
    expect(body.token.length).toBeGreaterThan(10)  // must be a real token, not empty
  })
})