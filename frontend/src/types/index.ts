// This file describes the shape of data coming from our backend API
// Think of it as a contract — "this is what a Poll looks like"

export interface Poll {
  id: string
  question: string
  options: string[]
  expires_at: string
  created_at: string
}

export interface VoteCount {
  option_idx: number
  count: number
}

export interface PollWithResults extends Poll {
  votes: VoteCount[]
  is_expired: boolean
}