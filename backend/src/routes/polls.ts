import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createPoll, getPollWithResults } from '../services/pollService.js'
import { castVote } from '../services/voteService.js'

// Zod = our "bouncer" at the door. It checks the shape of incoming data.
// If the data doesn't match, it rejects the request before any DB work happens.

const CreatePollSchema = z.object({
  question: z.string().min(3).max(500),
  options:  z.array(z.string().min(1)).min(2).max(10),
  // z.coerce.date() = take whatever string the user sends and turn it into a Date
  expiresAt: z.coerce.date()
})

const VoteSchema = z.object({
  optionIdx: z.number().int().min(0)
})

export async function pollRoutes(app: FastifyInstance) {

  // ─────────────────────────────────────────
  // POST /poll  →  Create a new poll
  // ─────────────────────────────────────────
  app.post('/poll', async (request, reply) => {
    // Validate the request body
    const result = CreatePollSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({
        error: 'Invalid input',
        details: result.error.issues
      })
    }

    const { question, options, expiresAt } = result.data

    try {
      const poll = await createPoll(app, question, options, expiresAt)
      return reply.status(201).send(poll)
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Could not create poll' })
    }
  })


  // ─────────────────────────────────────────
  // GET /poll/:id  →  Get poll + results
  // ─────────────────────────────────────────
  app.get('/poll/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      const poll = await getPollWithResults(app, id)

      if (!poll) {
        return reply.status(404).send({ error: 'Poll not found' })
      }

      return reply.send(poll)
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Could not fetch poll' })
    }
  })


  // ─────────────────────────────────────────
  // POST /poll/:id/vote  →  Cast a vote
  // Requires a valid JWT token (the one from /auth/anon)
  // ─────────────────────────────────────────
  app.post('/poll/:id/vote', {
    preHandler: [app.authenticate]   // 🔒 blocked if no valid JWT
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    // request.user is set by the JWT plugin after token is verified
    const userId = request.user.userId

    const result = VoteSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({
        error: 'Invalid input',
        details: result.error.issues
      })
    }

    const { optionIdx } = result.data

    try {
      const voteResult = await castVote(app, id, userId, optionIdx)

      if (!voteResult.success) {
        return reply.status(400).send({ error: voteResult.message })
      }

      return reply.status(201).send({ message: voteResult.message })
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Could not record vote' })
    }
  })
}