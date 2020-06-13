/**
 * Application Entry Point
 */

import fastify from 'fastify';
import fastifyFormBody from 'fastify-formbody';
import fastifyCors from 'fastify-cors';

import { env } from 'utils/environment';
import { authPlugin } from 'utils/auth';
import * as routes from 'routes';

const initPlugins = async (app: fastify.FastifyInstance) => {
  app.register(fastifyFormBody);
  app.register(authPlugin);
  app.register(fastifyCors, {
    origin: `${env.get('FRONTEND_APP_PROTOCOL')}://${env.get('FRONTEND_APP_HOST')}`,
    methods: ['GET', 'POST'],
  });
};

const initRoutes = async (app: fastify.FastifyInstance) => {
  return Object.values(routes).map((init) => {
    app.register(
      async (app, _, done) => {
        await init(app);
        done();
      },
      { prefix: '/v1' },
    );
  });
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
