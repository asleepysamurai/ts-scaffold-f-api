/**
 * Fastify auth plugin for JWT based auth
 */

import fastify from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import fastifyJWT from 'fastify-jwt';
import { env } from './environment';
import { Server, IncomingMessage, ServerResponse } from 'http';

declare module 'fastify' {
  export interface FastifyInstance<
    HttpServer = Server,
    HttpRequest = IncomingMessage,
    HttpResponse = ServerResponse
  > {
    authenticate: (
      req: fastify.FastifyRequest,
      res: fastify.FastifyReply<ServerResponse>,
    ) => Promise<void>;
  }
}

export const authPlugin = fastifyPlugin(async function (app: fastify.FastifyInstance) {
  app.register(fastifyJWT, {
    secret: env.get('JWT_SECRET'),
  });

  app.decorate('authenticate', async function (
    req: fastify.FastifyRequest,
    res: fastify.FastifyReply<ServerResponse>,
  ) {
    try {
      await req.jwtVerify();
    } catch (err) {
      res.send(err);
    }
  });
});
