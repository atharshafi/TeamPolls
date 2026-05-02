import { useParams, useNavigate } from 'react-router-dom'
import { useWebSocket } from '../hooks/useWebSocket'

export default function Results() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: poll, error, connected } = useWebSocket(id!)

  if (error) return <div style={styles.center}>Error: {error}</div>
  if (!poll) return <div style={styles.center}>Connecting to live results...</div>

  // Total votes cast so far
  const totalVotes = poll.votes.reduce((sum, v) => sum + v.count, 0)

  // Get vote count for a specific option index
  const getCount = (idx: number) =>
    poll.votes.find(v => v.option_idx === idx)?.count ?? 0

  // Get percentage width for the bar chart
  const getPercent = (idx: number) => {
    if (totalVotes === 0) return 0
    return Math.round((getCount(idx) / totalVotes) * 100)
  }

  // Find which option is winning (highest votes)
  const maxVotes = Math.max(...poll.options.map((_, i) => getCount(i)), 0)

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.statusRow}>
            <span style={{
              ...styles.badge,
              background: poll.is_expired ? '#fff5f5' : '#f0fdf4',
              color: poll.is_expired ? '#e53e3e' : '#16a34a'
            }}>
              {poll.is_expired ? 'Poll Closed' : '● Live'}
            </span>
            <span style={styles.totalVotes}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
          </div>
          <h2 style={styles.question}>{poll.question}</h2>
        </div>

        {/* Bar chart results */}
        <div style={styles.resultsList}>
          {poll.options.map((option, i) => {
            const count = getCount(i)
            const percent = getPercent(i)
            const isWinning = count > 0 && count === maxVotes

            return (
              <div key={i} style={styles.resultRow}>
                <div style={styles.labelRow}>
                  <span style={styles.optionLabel}>
                    {option}
                    {isWinning && <span style={styles.winnerTag}>Leading</span>}
                  </span>
                  <span style={styles.countLabel}>{count} ({percent}%)</span>
                </div>
                <div style={styles.barTrack}>
                  <div style={{
                    ...styles.barFill,
                    width: `${percent}%`,
                    background: isWinning ? '#5048e5' : '#a5b4fc'
                  }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.wsStatus}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: connected ? '#16a34a' : '#e53e3e'
            }} />
            <span style={{ fontSize: '12px', color: '#888' }}>
              {connected ? 'Connected — updates are live' : 'Reconnecting...'}
            </span>
          </div>

          <button
            style={styles.shareBtn}
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/poll/${id}/vote`
              )
              alert('Vote link copied to clipboard!')
            }}
          >
            Copy Vote Link
          </button>

          <button style={styles.newPollBtn} onClick={() => navigate('/')}>
            Create New Poll
          </button>
        </div>

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
    maxWidth: '580px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
  },
  header: { marginBottom: '32px' },
  statusRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' },
  badge: {
    fontSize: '12px', fontWeight: 600,
    padding: '4px 10px', borderRadius: '20px'
  },
  totalVotes: { fontSize: '13px', color: '#888' },
  question: { fontSize: '22px', fontWeight: 600, color: '#111', margin: 0 },
  resultsList: { display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' },
  resultRow: {},
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  optionLabel: { fontSize: '14px', fontWeight: 500, color: '#222', display: 'flex', alignItems: 'center', gap: '8px' },
  winnerTag: {
    fontSize: '11px', fontWeight: 600,
    background: '#eef2ff', color: '#5048e5',
    padding: '2px 8px', borderRadius: '10px'
  },
  countLabel: { fontSize: '13px', color: '#888' },
  barTrack: { height: '10px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '99px', transition: 'width 0.4s ease' },
  footer: { display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #f0f0f0', paddingTop: '24px' },
  wsStatus: { display: 'flex', alignItems: 'center', gap: '8px' },
  shareBtn: {
    padding: '12px', background: '#f8f9ff', color: '#5048e5',
    border: '1px solid #c7d2fe', borderRadius: '10px',
    fontSize: '14px', fontWeight: 500, cursor: 'pointer'
  },
  newPollBtn: {
    padding: '12px', background: '#5048e5', color: '#fff',
    border: 'none', borderRadius: '10px',
    fontSize: '14px', fontWeight: 600, cursor: 'pointer'
  }
}