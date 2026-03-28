import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'

export interface JwtPayload {
  userId: string
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}

const jwtPlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'fallback_secret',
    sign: { expiresIn: '2h' }
  })

  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch {
      reply.status(401).send({
        error: 'Unauthorized',
        message: 'Valid JWT token required'
      })
    }
  })

  app.log.info('✅ JWT plugin registered')
}

export default fp(jwtPlugin, { name: 'jwt' })