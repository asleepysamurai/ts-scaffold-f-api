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
import type { User, ResetCode } from 'types';

const MAX_CODE_VALID_DURATION = 2 * 24 * 60 * 60 * 1000; // 2 Days;

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
      const resetCode = await db.getOne<ResetCode>('pending_password_resets', {
        where: { code: req.body.code },
      });

      if (!resetCode?.user_id) {
        throw {
          code: 400,
          message: 'Invalid code',
          errorCode: 'EINVALIDCODE',
        };
      }

      const codeCreatedAt = db.getCreatedAtFromId(resetCode?.code);
      const codeMaxExpirationAt = codeCreatedAt + MAX_CODE_VALID_DURATION;

      if (codeMaxExpirationAt < Date.now()) {
        throw {
          code: 400,
          message: 'Expired code',
          errorCode: 'EEXPIREDCODE',
        };
      }

      {
        const user = await db.getOne<User>('users', {
          where: { id: resetCode.user_id },
        });

        const updateDoc = Object.assign(
          {
            password: await bcrypt.hash(req.body.password, 10),
          },
          user?._verified_at ? {} : { _verified_at: Date.now() },
        );

        await Promise.all([
          db.update('users', {
            where: { id: resetCode.user_id },
            update: updateDoc,
            limit: 1,
            trx,
          }),
          db.delete('pending_password_resets', {
            where: { code: req.body.code },
            limit: 1,
            trx,
            recordCanUpdate: false,
          }),
        ]);
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
          code: err.errorCode,
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
