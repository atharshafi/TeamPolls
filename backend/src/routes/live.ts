import { FastifyInstance } from 'fastify'
import { subscribe, unsubscribe } from '../services/liveService.js'
import { getPollWithResults } from '../services/pollService.js'

export async function liveRoutes(app: FastifyInstance) {

  // GET /poll/:id/live  ← WebSocket connection
  // This is a special route — it upgrades a normal HTTP request
  // into a persistent WebSocket connection
  app.get('/poll/:id/live', { websocket: true }, async (socket, request) => {
    const { id: pollId } = request.params as { id: string }

    app.log.info(`Client connected to poll ${pollId}`)

    // Step 1: Send the current results immediately when they connect
    // (so they don't see a blank screen while waiting for a vote)
    try {
      const current = await getPollWithResults(app, pollId)
      if (current) {
        socket.send(JSON.stringify(current))
      } else {
        socket.send(JSON.stringify({ error: 'Poll not found' }))
        socket.close()
        return
      }
    } catch (err) {
      app.log.error(err)
      socket.close()
      return
    }

    // Step 2: Register this connection so it receives future updates
    subscribe(pollId, socket)

    // Step 3: Clean up when the user closes the tab / disconnects
    socket.on('close', () => {
      app.log.info(`Client disconnected from poll ${pollId}`)
      unsubscribe(pollId, socket)
    })
  })
}