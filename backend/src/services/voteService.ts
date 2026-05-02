import { FastifyInstance } from 'fastify'
import '../types.js'

export async function castVote(
  app: FastifyInstance,
  pollId: string,
  userId: string,
  optionIdx: number
): Promise<{ success: boolean; message: string }> {

  // Step 1: Does this poll even exist?
  const { rows } = await app.pg.query(
    `SELECT id, options, expires_at FROM polls WHERE id = $1`,
    [pollId]
  )

  if (rows.length === 0) {
    return { success: false, message: 'Poll not found' }
  }

  const poll = rows[0]

  // Step 2: Has the poll expired?
  if (new Date(poll.expires_at) < new Date()) {
    return { success: false, message: 'Poll has expired' }
  }

  // Step 3: Is the option index valid?
  const options = poll.options as string[]
  if (optionIdx < 0 || optionIdx >= options.length) {
    return { success: false, message: 'Invalid option selected' }
  }

  // Step 4: Try to save the vote
  try {
    await app.pg.query(
      `INSERT INTO votes (poll_id, user_id, option_idx) VALUES ($1, $2, $3)`,
      [pollId, userId, optionIdx]
    )

    // Step 5: Shout into the Redis megaphone 📢
    // This wakes up the subscriber in liveService.ts
    // which then pushes fresh results to all connected WebSocket clients
    await app.redis.publish('vote:cast', JSON.stringify({ pollId }))

    return { success: true, message: 'Vote recorded successfully' }

  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      return { success: false, message: 'You have already voted on this poll' }
    }
    throw err
  }
}