import { useEffect, useRef, useState } from 'react'
import type { PollWithResults } from '../types/index.js'

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000'
const RECONNECT_DELAY_MS = 3000

interface ServerError {
  error: string
}

function isServerError(data: unknown): data is ServerError {
  return typeof data === 'object' && data !== null && 'error' in data
}

export function useWebSocket(pollId: string) {
  const [data, setData] = useState<PollWithResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!pollId) return

    let ws: WebSocket
    let cancelled = false

    function connect() {
      ws = new WebSocket(`${WS_BASE}/poll/${pollId}/live`)

      ws.onopen = () => {
        setConnected(true)
        setError(null)
      }

      ws.onmessage = (event) => {
        try {
          const parsed: unknown = JSON.parse(event.data)
          if (isServerError(parsed)) {
            setError(parsed.error)
          } else {
            setData(parsed as PollWithResults)
          }
        } catch {
          setError('Failed to parse server message')
        }
      }

      ws.onerror = () => {
        setError('WebSocket connection error')
        setConnected(false)
      }

      ws.onclose = () => {
        setConnected(false)
        if (!cancelled) {
          retryRef.current = setTimeout(connect, RECONNECT_DELAY_MS)
        }
      }
    }

    connect()

    return () => {
      cancelled = true
      if (retryRef.current) clearTimeout(retryRef.current)
      ws.close()
    }
  }, [pollId])

  return { data, error, connected }
}
