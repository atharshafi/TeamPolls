import axios from 'axios'
import type { Poll, PollWithResults } from '../types/index'

// All requests go to our Fastify backend
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' }
})

// ── Auth ──────────────────────────────────────────────

// Gets a JWT token and saves it to localStorage
// Called automatically when app loads if no token exists
export async function getOrCreateToken(): Promise<string> {
  const existing = localStorage.getItem('teampolls_token')
  if (existing) return existing

  const res = await api.post('/auth/anon')
  const token = res.data.token
  localStorage.setItem('teampolls_token', token)
  return token
}

// ── Polls ─────────────────────────────────────────────

export async function createPoll(
  question: string,
  options: string[],
  expiresAt: Date
): Promise<Poll> {
  const res = await api.post('/poll', { question, options, expiresAt })
  return res.data
}

export async function getPoll(pollId: string): Promise<PollWithResults> {
  const res = await api.get(`/poll/${pollId}`)
  return res.data
}

export async function castVote(pollId: string, optionIdx: number): Promise<void> {
  const token = await getOrCreateToken()
  await api.post(
    `/poll/${pollId}/vote`,
    { optionIdx },
    { headers: { Authorization: `Bearer ${token}` } }
  )
}