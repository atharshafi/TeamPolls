import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPoll } from '../api/client'

export default function CreatePoll() {
  const navigate = useNavigate()

  // Form state
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])   // start with 2 empty options
  const [expiryHours, setExpiryHours] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Update one option by index
  const updateOption = (index: number, value: string) => {
    setOptions(prev => prev.map((opt, i) => i === index ? value : opt))
  }

  // Add a new blank option (max 10)
  const addOption = () => {
    if (options.length < 10) setOptions(prev => [...prev, ''])
  }

  // Remove an option by index (min 2)
  const removeOption = (index: number) => {
    if (options.length > 2) setOptions(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setError('')

    // Basic validation before hitting the API
    if (question.trim().length < 3) {
      setError('Question must be at least 3 characters')
      return
    }
    const filledOptions = options.filter(o => o.trim().length > 0)
    if (filledOptions.length < 2) {
      setError('Please fill in at least 2 options')
      return
    }

    try {
      setLoading(true)
      const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000)
      const poll = await createPoll(question.trim(), filledOptions, expiresAt)

      // After creating, go straight to the results page
      navigate(`/poll/${poll.id}/results`)
    } catch {
      setError('Failed to create poll. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create a Poll</h1>
        <p style={styles.subtitle}>Fill in the details below and share the link with your team</p>

        {/* Question */}
        <div style={styles.field}>
          <label style={styles.label}>Question</label>
          <input
            style={styles.input}
            placeholder="e.g. What should we have for lunch?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            maxLength={500}
          />
        </div>

        {/* Options */}
        <div style={styles.field}>
          <label style={styles.label}>Options</label>
          {options.map((opt, i) => (
            <div key={i} style={styles.optionRow}>
              <input
                style={{ ...styles.input, flex: 1 }}
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={e => updateOption(i, e.target.value)}
              />
              {options.length > 2 && (
                <button style={styles.removeBtn} onClick={() => removeOption(i)}>✕</button>
              )}
            </div>
          ))}
          {options.length < 10 && (
            <button style={styles.addBtn} onClick={addOption}>+ Add option</button>
          )}
        </div>

        {/* Expiry */}
        <div style={styles.field}>
          <label style={styles.label}>Expires after</label>
          <select
            style={styles.input}
            value={expiryHours}
            onChange={e => setExpiryHours(Number(e.target.value))}
          >
            <option value={1}>1 hour</option>
            <option value={2}>2 hours</option>
            <option value={6}>6 hours</option>
            <option value={24}>24 hours</option>
          </select>
        </div>

        {/* Error */}
        {error && <p style={styles.error}>{error}</p>}

        {/* Submit */}
        <button
          style={{ ...styles.submitBtn, opacity: loading ? 0.6 : 1 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Poll'}
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
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '560px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
  },
  title: { margin: '0 0 8px', fontSize: '26px', fontWeight: 600, color: '#111' },
  subtitle: { margin: '0 0 32px', fontSize: '14px', color: '#666' },
  field: { marginBottom: '24px' },
  label: { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#333' },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '8px'
  },
  optionRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  removeBtn: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '8px 10px',
    cursor: 'pointer',
    color: '#999',
    fontSize: '12px',
    marginBottom: '8px'
  },
  addBtn: {
    background: 'none',
    border: '1px dashed #aaa',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    color: '#666',
    fontSize: '13px',
    width: '100%',
    marginTop: '4px'
  },
  submitBtn: {
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
  error: { color: '#e53e3e', fontSize: '13px', marginBottom: '16px' }
}