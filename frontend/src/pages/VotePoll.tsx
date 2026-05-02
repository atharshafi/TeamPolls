import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPoll, castVote, getOrCreateToken } from '../api/client'
import type { PollWithResults } from '../types/index'

export default function VotePoll() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [poll, setPoll] = useState<PollWithResults | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState('')

  // Load the poll when the page opens
  useEffect(() => {
    const load = async () => {
      try {
        await getOrCreateToken()  // ensure we have a token ready
        const data = await getPoll(id!)
        setPoll(data)
      } catch {
        setError('Poll not found or backend is not running.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleVote = async () => {
    if (selected === null) return
    setVoting(true)
    setError('')
    try {
      await castVote(id!, selected)
      // After voting, go to live results
      navigate(`/poll/${id}/results`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error
      setError(msg || 'Could not cast vote.')
      setVoting(false)
    }
  }

  if (loading) return <div style={styles.center}>Loading poll...</div>
  if (error && !poll) return <div style={styles.center}>{error}</div>
  if (!poll) return null

  if (poll.is_expired) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.expiredBadge}>Poll Expired</p>
          <h2 style={styles.question}>{poll.question}</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>This poll is no longer accepting votes.</p>
          <button style={styles.resultsBtn} onClick={() => navigate(`/poll/${id}/results`)}>
            View Final Results
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <p style={styles.badge}>Live Poll</p>
        <h2 style={styles.question}>{poll.question}</h2>
        <p style={styles.hint}>Select one option and submit your vote</p>

        <div style={styles.optionsList}>
          {poll.options.map((option, i) => (
            <div
              key={i}
              style={{
                ...styles.option,
                borderColor: selected === i ? '#5048e5' : '#e2e8f0',
                background: selected === i ? '#eef2ff' : '#fff',
              }}
              onClick={() => setSelected(i)}
            >
              <div style={{
                ...styles.radio,
                borderColor: selected === i ? '#5048e5' : '#cbd5e0',
                background: selected === i ? '#5048e5' : 'transparent'
              }} />
              <span style={styles.optionText}>{option}</span>
            </div>
          ))}
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={{
            ...styles.voteBtn,
            opacity: selected === null || voting ? 0.5 : 1,
            cursor: selected === null || voting ? 'not-allowed' : 'pointer'
          }}
          onClick={handleVote}
          disabled={selected === null || voting}
        >
          {voting ? 'Submitting...' : 'Submit Vote'}
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'system-ui, sans-serif'
  },
  center: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, sans-serif',
    color: '#666'
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '520px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
  },
  badge: {
    display: 'inline-block',
    background: '#eef2ff',
    color: '#5048e5',
    fontSize: '12px',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: '20px',
    marginBottom: '16px'
  },
  expiredBadge: {
    display: 'inline-block',
    background: '#fff5f5',
    color: '#e53e3e',
    fontSize: '12px',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: '20px',
    marginBottom: '16px'
  },
  question: { fontSize: '22px', fontWeight: 600, color: '#111', margin: '0 0 8px' },
  hint: { fontSize: '13px', color: '#888', marginBottom: '24px' },
  optionsList: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '2px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.15s'
  },
  radio: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: '2px solid #cbd5e0',
    flexShrink: 0,
    transition: 'all 0.15s'
  },
  optionText: { fontSize: '15px', color: '#222' },
  voteBtn: {
    width: '100%',
    padding: '14px',
    background: '#5048e5',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  resultsBtn: {
    marginTop: '16px',
    padding: '12px 24px',
    background: '#5048e5',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  error: { color: '#e53e3e', fontSize: '13px', marginBottom: '16px' }
}