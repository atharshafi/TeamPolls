import fp from 'fastify-plugin'
import pg from 'pg'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    pg: pg.Pool
  }
}

const postgresPlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })

  const client = await pool.connect()
  client.release()
  app.log.info('✅ PostgreSQL connected')

  app.decorate('pg', pool)

  app.addHook('onClose', async () => {
    await pool.end()
  })
}

export default fp(postgresPlugin, { name: 'postgres' })