import Fastify from 'fastify'
import helmet from '@fastify/helmet'

// Plugins
import postgresPlugin from './plugins/postgres.js'
import redisPlugin from './plugins/redis.js'
import jwtPlugin from './plugins/jwt.js'
import websocketPlugin from './plugins/websocket.js'

// Routes
import { authRoutes } from './routes/auth.js'

const app = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
      }
    }
  }
})

// ── Security headers ──────────────────────────────────
await app.register(helmet, {
  contentSecurityPolicy: false
})

// ── Plugins ───────────────────────────────────────────
await app.register(postgresPlugin)
await app.register(redisPlugin)
await app.register(jwtPlugin)
await app.register(websocketPlugin)

// ── Routes ────────────────────────────────────────────
await app.register(authRoutes)

// ── Health check ──────────────────────────────────────
app.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      postgres: 'connected',
      redis: 'connected'
    }
  }
})

export default app