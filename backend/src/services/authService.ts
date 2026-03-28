import { FastifyInstance } from 'fastify'
import '../types.js'

export async function createAnonUser(app: FastifyInstance) {
  // Step 1 — Create a new user row in the database
  // PostgreSQL auto-generates the UUID for us
  const { rows } = await app.pg.query<{ id: string }>(
    `INSERT INTO users (id, created_at)
     VALUES (gen_random_uuid(), NOW())
     RETURNING id`
  )

  const userId = rows[0].id

  // Step 2 — Create a JWT token containing the userId
  const token = app.jwt.sign({ userId })

  return { token, userId }
}