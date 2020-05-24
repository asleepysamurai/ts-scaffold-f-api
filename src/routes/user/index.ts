/**
 * User management endpoints
 */

import fastify from 'fastify';
import * as create from 'routes/user/create';

export const user = (app: fastify.FastifyInstance) => {
  app.post('/user', { schema: create.schema }, create.handle);
};
