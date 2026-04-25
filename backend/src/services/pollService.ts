
import { FastifyInstance } from "fastify";
import '../types.js'


//describes what poll look like when we read it from the database
export interface Poll {
id:string
question:string
options:string[]
expires_at:string
created_at:string
}

//Next the poll plus the vote counts and wether its expired
export interface PollWithResults extends Poll{
    votes:{option_idx:number;count:number}[]
    is_expired:boolean
} 

//Creates a new poll and returns null if not found
export async function createPoll(
       app: FastifyInstance,
       question:string,
       options:string[],
       expiresAt: Date
): Promise<Poll> {
    const {rows} = await app.pg.query<Poll>(
         `INSERT INTO polls (question, options, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, question, options, expires_at, created_at`,
    [question, JSON.stringify(options), expiresAt]
        

    )
    return rows[0]

}

// Fetches one poll + its vote counts. Returns null if not found.
export async function getPollWithResults(
    app: FastifyInstance,
    pollId: string,
): Promise<PollWithResults | null>{
    const { rows } = await app.pg.query<Poll>(
    `SELECT id, question, options, expires_at, created_at
     FROM polls WHERE id = $1`,
    [pollId]
  )

  if (rows.length === 0) return null

  const poll = rows[0]

  // Count how many votes each option got
  // GROUP BY means: "give me one row per option_idx, with the count"
  const { rows: voteRows } = await app.pg.query<{ option_idx: number; count: string }>(
    `SELECT option_idx, COUNT(*) as count
     FROM votes
     WHERE poll_id = $1
     GROUP BY option_idx`,
    [pollId]
  )

  return {
    ...poll,
    votes: voteRows.map(v => ({
      option_idx: v.option_idx,
      count: Number(v.count)   // PostgreSQL returns count as string, convert to number
    })),
    is_expired: new Date(poll.expires_at) < new Date()
  }
}
 