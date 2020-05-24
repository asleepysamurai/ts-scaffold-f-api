/**
 * POST /user/reset-password endpoint
 *
 * Also used for account verification
 */

import fastify from 'fastify';
import type { ServerResponse } from 'http';
import { db } from 'utils/db';
import bcrypt from 'bcrypt';
import type { Transaction } from 'knex';

export const schema = {
  body: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
      },
      password: {
        type: 'string',
      },
    },
    required: ['code', 'password'],
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
              },
            },
          },
        },
      },
    },
  },
};

export const handle = async (
  req: fastify.FastifyRequest,
  res: fastify.FastifyReply<ServerResponse>,
) => {
  try {
    let user: {
      id?: string;
    } = {};

    await db.transact(async (trx: Transaction) => {
      const resetCode = await db.getOne('pending_password_resets', {
        code: req.body.code,
      });

      if (resetCode?.user_id) {
        const user = await db.getOne('users', {
          id: resetCode.user_id,
        });

        const updateDoc = Object.assign(
          {
            password: await bcrypt.hash(req.body.password, 10),
          },
          user?._verified_at ? {} : { _verified_at: Date.now() },
        );

        await Promise.all([
          db.update('users', { id: resetCode.user_id }, updateDoc, undefined, 1, trx),
          db.delete('pending_password_resets', { code: req.body.code }, undefined, 1, trx, false),
        ]);
      } else {
        throw {
          code: 400,
          message: 'Invalid code',
        };
      }

      user = { id: resetCode.user_id };
      return;
    });

    return { success: true, data: { user } };
  } catch (err) {
    if (err.code && err.code > 299 && err.code < 600 && err.message) {
      res.status(err.code);
      return {
        success: false,
        error: {
          message: err.message,
        },
      };
    } else {
      req.log.error(`Failed to reset user password`, { err: err.message });

      res.status(500);
      return {
        success: false,
        error: {
          message: 'Internal server error',
        },
      };
    }
  }
};
