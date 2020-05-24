/**
 * Application Entry Point
 */

import fastify from 'fastify';
import fastifyFormBody from 'fastify-formbody';
import fastifySecureSession from 'fastify-secure-session';
import type { ServerResponse } from 'http';

import { env } from 'utils/environment';
import * as routes from 'routes';

const initPlugins = async (app: fastify.FastifyInstance) => {
  app.register(fastifyFormBody);
  app.register(fastifySecureSession, {
    secret: env.get('SESSION_COOKIE_KEY'),
    salt: env.get('SESSION_COOKIE_SALT'),
    cookie: {
      secret: env.get('SESSION_COOKIE_SECRET'),
    },
  });
};

const setupDefaultRoute = (app: fastify.FastifyInstance) => {
  app.get('/', async (_req: fastify.FastifyRequest, res: fastify.FastifyReply<ServerResponse>) => {
    return res.redirect(env.get('APP_SERVER_DEFAULT_URL'));
  });
};

const initRoutes = async (app: fastify.FastifyInstance) => {
  setupDefaultRoute(app);

  return Promise.all(
    Object.values(routes).map((init) => {
      return Promise.resolve(init(app));
    }),
  );
};

const init = async () => {
  const app = fastify({
    ignoreTrailingSlash: true,
    logger: true,
    trustProxy: true,
  });

  try {
    await initPlugins(app);
    await initRoutes(app);

    await app.listen(env.getAsInt('APP_SERVER_PORT'), env.get('APP_SERVER_HOST'));
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  return app;
};

init();
