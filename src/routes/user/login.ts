/**
 * POST /user/login endpoint
 */

import fastify from 'fastify';
import type { ServerResponse } from 'http';
import { db } from 'utils/db';
import bcrypt from 'bcrypt';

export const schema = {
  body: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        pattern:
          "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$",
      },
      password: {
        type: 'string',
      },
    },
    required: ['email', 'password'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
        },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
                token: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  },
};

export const handle = (app: fastify.FastifyInstance) => {
  return async (req: fastify.FastifyRequest, res: fastify.FastifyReply<ServerResponse>) => {
    try {
      const user = await db.getOne('users', { where: { email: req.body.email } });

      if (user?.id && user?.password) {
        const passwordCheckOkay = await bcrypt.compare(req.body.password, user.password);

        if (passwordCheckOkay) {
          const sessionId = await db.insert(
            'sessions',
            { user_id: user.id },
            { recordCanUpdate: false },
          );

          const token = app.jwt.sign({ sessionId, userId: user.id });
          return { success: true, data: { user: { id: user?.id, token } } };
        }
      }

      res.status(401);
      return {
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'EBADCREDENTIALS',
        },
      };
    } catch (err) {
      req.log.error(`Failed to login user`, { err: err.message });
    }

    res.status(500);
    return {
      success: false,
      error: {
        message: 'Internal server error',
      },
    };
  };
};
