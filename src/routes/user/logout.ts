/**
 * POST /user/logout endpoint
 */

import fastify from 'fastify';
import type { ServerResponse } from 'http';
import { db } from 'utils/db';

export const schema = {
  body: {
    type: 'object',
    properties: {},
    required: [],
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
          properties: {},
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
    // Unauthenticated / expired authentication users will not have req.user
    if (req.user) {
      const { userId, sessionId } = req.user as { userId: string; sessionId: string };

      await db.delete('sessions', {
        where: { user_id: userId, id: sessionId },
        recordCanUpdate: false,
      });
    }

    return {
      success: true,
      data: {},
    };
  } catch (err) {
    req.log.error(`Failed to logout user`, { err: err.message });
  }

  res.status(500);
  return {
    success: false,
    error: {
      message: 'Internal server error',
    },
  };
};
