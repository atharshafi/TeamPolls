import { FastifyInstance } from "fastify";

import { createAnonUser } from "../services/authService";

export async function authRoutes(app:FastifyInstance){
    // POST /auth/anon
  // No body needed — just call it and get a token back
    app.post('/auth/anon', async (request, reply)=>{
        try {
            const {token,userId}= await createAnonUser(app)

            return reply.status(201).send({
                token,
                userId,
                message:"Anonymous user created successfully"
            })
            
        } catch (error) {
            app.log.error(error)
                return reply.status(500).send({
                    error:"Internal Server Error",
                    Message:"Could not create an anonymous user"
                })
        }

    })
}