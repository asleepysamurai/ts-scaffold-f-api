/**
 * POST /user endpoint
 */

import fastify from 'fastify';
import type { ServerResponse } from 'http';
import { db } from 'utils/db';
import { env } from 'utils/environment';
import { mailer } from 'utils/mailer';
import type { Transaction } from 'knex';

export const schema = {
  body: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        pattern:
          "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$",
      },
    },
    required: ['email'],
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

const sendResetCode = async (email: string, code: string) => {
  const resetLink = `${env.get('MAILER_LINK_PREFIX')}/user/reset-password?code=${code}`;

  return mailer.send(
    {
      name: 'F-API Support',
      address: 'f-api-support@example.com',
    },
    email,
    'Please reset your account password',
    `Hello :)

You (or somebody on your behalf), recently requested a password reset for your F-API account. In order to reset your password, please copy the link below and paste it into your browser's address bar.

${resetLink}

If you did not request the password reset, or it was not created on your behalf, you can ignore this email. There has been no unauthorized access to your account, and your account is safe.

Regards,
F-API Support
`,
    `Hello :)

<p>You (or somebody on your behalf), recently requested a password reset for your F-API account. In order to reset your password, please click the link below.</p>

<p><a href="${resetLink}">${resetLink}</a></p>

<p>If you did not request the password reset, or it was not created on your behalf, you can ignore this email. There has been no unauthorized access to your account, and your account is safe.</p>

<br><br>Regards,<br>
F-API Support
`,
  );
};

export const handle = async (
  req: fastify.FastifyRequest,
  res: fastify.FastifyReply<ServerResponse>,
) => {
  try {
    await db.transact(async (trx: Transaction) => {
      const user = await db.getOne('users', { email: req.body.email });

      if (user?.id) {
        const resetCode = await db.insert(
          'pending_password_resets',
          { user_id: user.id },
          { idField: 'code', recordCanUpdate: false },
          trx,
        );

        await sendResetCode(req.body.email, resetCode);
        return;
      }
    });

    return { success: true, data: {} };
  } catch (err) {
    req.log.error(`Failed to create reset code`, { err: err.message });

    res.status(500);
    return {
      success: false,
      error: {
        message: 'Internal server error',
      },
    };
  }
};
