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
    softAuthenticate: (
      req: fastify.FastifyRequest,
      res: fastify.FastifyReply<ServerResponse>,
    ) => Promise<void>;
    hardAuthenticate: (
      req: fastify.FastifyRequest,
      res: fastify.FastifyReply<ServerResponse>,
    ) => Promise<void>;
  }
}

export const authPlugin = fastifyPlugin(async function (app: fastify.FastifyInstance) {
  app.register(fastifyJWT, {
    secret: env.get('JWT_SECRET'),
  });

  const auth = function (throwError: boolean) {
    return async function (req: fastify.FastifyRequest, res: fastify.FastifyReply<ServerResponse>) {
      try {
        await req.jwtVerify();
      } catch (err) {
        if (throwError) {
          res.send(err);
        }
      }
    };
  };

  app.decorate('hardAuthenticate', auth(true));
  app.decorate('softAuthenticate', auth(false));
});
