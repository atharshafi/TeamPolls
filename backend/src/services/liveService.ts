import { FastifyInstance } from 'fastify'
import { WebSocket } from '@fastify/websocket'
import '../types.js'

// This Map stores all active WebSocket connections
// Key   = poll ID  (e.g. "abc-123")
// Value = Set of WebSocket connections watching that poll
//
// Think of it like a cinema:
// Key = which movie is playing (poll ID)
// Value = all the seats that are occupied (open connections)
const pollSubscribers = new Map<string, Set<WebSocket>>()

// Called when a user opens the live page for a poll
export function subscribe(pollId: string, socket: WebSocket) {
  if (!pollSubscribers.has(pollId)) {
    pollSubscribers.set(pollId, new Set())
  }
  pollSubscribers.get(pollId)!.add(socket)
}

// Called when a user closes/leaves the live page
export function unsubscribe(pollId: string, socket: WebSocket) {
  pollSubscribers.get(pollId)?.delete(socket)
}

// Called after every vote — pushes fresh results to all watchers
export function broadcast(pollId: string, data: object) {
  const subscribers = pollSubscribers.get(pollId)
  if (!subscribers || subscribers.size === 0) return

  const message = JSON.stringify(data)

  for (const socket of subscribers) {
    // Only send if the connection is still open
    // readyState 1 = OPEN (like checking the phone line is still connected)
    if (socket.readyState === 1) {
      socket.send(message)
    }
  }
}

// Called on server startup — listens for vote events from Redis
// When any vote is cast, Redis notifies us here and we broadcast
export async function startRedisSubscriber(app: FastifyInstance) {
  // We need a SEPARATE Redis connection just for subscribing
  // A Redis connection in "subscribe mode" can't do anything else
  // So we create a duplicate connection specifically for this
  const subscriber = app.redis.duplicate()

  await subscriber.subscribe('vote:cast', (err) => {
    if (err) {
      app.log.error('Redis subscription error: ' + err.message)
    } else {
      app.log.info('✅ Redis subscriber listening on vote:cast')
    }
  })

  // This fires every time a vote is published to the vote:cast channel
  subscriber.on('message', async (channel, message) => {
    try {
      const { pollId } = JSON.parse(message)

      // Get the fresh results from the database
      const { getPollWithResults } = await import('./pollService.js')
      const results = await getPollWithResults(app, pollId)

      if (results) {
        broadcast(pollId, results)
      }
    } catch (err) {
      app.log.error('Error broadcasting vote update: ' + err)
    }
  })

  // Clean up when server shuts down
  app.addHook('onClose', async () => {
    await subscriber.quit()
  })
}