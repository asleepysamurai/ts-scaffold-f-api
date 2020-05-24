/**
 * User management endpoints
 */

import fastify from 'fastify';
import * as create from 'routes/user/create';
import * as resetPassword from 'routes/user/resetPassword';
import * as forgotPassword from 'routes/user/forgotPassword';
import * as login from 'routes/user/login';

export const user = (app: fastify.FastifyInstance) => {
  app.post('/user', { schema: create.schema }, create.handle);
  app.post('/user/reset-password', { schema: resetPassword.schema }, resetPassword.handle);
  app.post('/user/forgot-password', { schema: forgotPassword.schema }, forgotPassword.handle);
  app.post('/user/login', { schema: login.schema }, login.handle);
};
