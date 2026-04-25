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
  // Like checking if a restaurant is still open before ordering
  if (new Date(poll.expires_at) < new Date()) {
    return { success: false, message: 'Poll has expired' }
  }

  // Step 3: Is the option index valid?
  // e.g. if there are 3 options, valid indexes are 0, 1, 2
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
    return { success: true, message: 'Vote recorded successfully' }

  } catch (err: unknown) {
    // Error code 23505 = "unique constraint violation"
    // This means: this user already voted on this poll
    // Our database table has UNIQUE(poll_id, user_id) — one vote per person per poll
    if ((err as { code?: string }).code === '23505') {
      return { success: false, message: 'You have already voted on this poll' }
    }
    throw err  // some other unexpected error — let it bubble up
  }
}