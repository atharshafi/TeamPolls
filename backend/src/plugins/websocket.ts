// Sets up WebSocket support
// Allows us to push live updates to connected browsers

import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import fastifyWebsocket from '@fastify/websocket'

async function websocketPlugin(app: FastifyInstance) {
  await app.register(fastifyWebsocket, {
    options: {
      maxPayload: 1048576 // max message size: 1MB
    }
  })

  app.log.info('✅ WebSocket plugin registered')
}

export default fp(websocketPlugin, { name: 'websocket' })