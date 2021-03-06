/**
 * POST /user endpoint
 */

import fastify from 'fastify';
import type { ServerResponse } from 'http';
import { db } from 'utils/db';
import { env } from 'utils/environment';
import { mailer } from 'utils/mailer';
import type { Transaction } from 'knex';
import type { User, VerificationCode } from 'types';

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

const sendVerificationCode = async (email: string, verificationCode: string) => {
  const verificationLink = `${env.get('EMAIL_LINK_PREFIX')}/user/verify?code=${verificationCode}`;

  return mailer.send(
    {
      name: env.get('EMAIL_SUPPORT_NAME'),
      address: env.get('EMAIL_SUPPORT_ADDRESS'),
    },
    email,
    `Please activate your new ${env.get('APP_NAME')} account`,
    `Hello :)

A new ${env.get(
      'APP_NAME',
    )} account has been created for you. Before you can use this account, you need to verify your email address. In order to verify your email address, please copy the link below and paste it into your browser's address bar.

${verificationLink}

If you did not create this account, or it was not created on your behalf, please let us know (by replying to this email), so we can delete this account.

Regards,
${env.get('APP_NAME')} Support
`,
    `Hello :)

<p>A new ${env.get(
      'APP_NAME',
    )} account has been created for you. Before you can use this account, you need to verify your email address. In order to verify your email address, please click the link below.</p>

<p><a href="${verificationLink}">${verificationLink}</a></p>

<p>If you did not create this account, or it was not created on your behalf, please let us know (by replying to this email), so we can delete this account.</p>

<br><br>Regards,<br>
${env.get('APP_NAME')} Support
`,
  );
};

const sendVerificationOrWarning = async (email: string): Promise<{ id: string }> => {
  let user = await db.getOne<User>('users', { where: { email } });
  if (!(user?.email && user?.id)) {
    // Should never happen, but just in case
    throw new Error('Unknown user');
  }

  if (user?._verified_at) {
    // User already verified
    await mailer.send(
      {
        name: env.get('EMAIL_SUPPORT_NAME'),
        address: env.get('EMAIL_SUPPORT_ADDRESS'),
      },
      user.email,
      `Somebody attempted to create an ${env.get('APP_NAME')} account for you`,
      `Hello :)

You, or somebody on your behalf attempted to create a new ${env.get('APP_NAME')} account.

However an account already exists for this email address. If this was intended by you, you can go ahead and login, as you normally would, or you could request a password reset if you do not remember your account password.

If you did not create this account, or it was not created on your behalf, please ignore this email. Your account is safe, and there has not been any unauthorized access.

Regards,
${env.get('APP_NAME')} Support
`,
      `Hello :)

<p>You, or somebody on your behalf attempted to create a new ${env.get('APP_NAME')} account.</p>

<p>However an account already exists for this email address. If this was intended by you, you can go ahead and <a href="${env.get(
        'EMAIL_LINK_PREFIX',
      )}/user/login">login</a>, as you normally would, or you could request a <a href="${env.get(
        'EMAIL_LINK_PREFIX',
      )}/user/forgot-password">password reset</a> if you do not remember your account password.</p>

<p>If you did not create this account, or it was not created on your behalf, please ignore this email. Your account is safe, and there has not been any unauthorized access.</p>

<br><br>Regards,<br>
${env.get('APP_NAME')} Support
`,
    );
  } else {
    let verificationCode = await db.getOne<VerificationCode>('pending_password_resets', {
      where: { user_id: user.id },
    });
    if (verificationCode?.code) {
      await sendVerificationCode(user.email, verificationCode.code);
    } else {
      // Missing verificationCode - should never happen
      throw new Error(`Missing verification code - ${user?.id}`);
    }
  }

  return user;
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
      let userId;

      try {
        userId = await db.insert('users', { email: req.body.email }, { trx });
      } catch (err) {
        if (err.code === '23505') {
          const { id } = await sendVerificationOrWarning(req.body.email);
          user = { id };
          return;
        }

        throw err;
      }

      const verificationCode = await db.insert(
        'pending_password_resets',
        { user_id: userId },
        { idField: 'code', recordCanUpdate: false, trx },
      );

      await sendVerificationCode(req.body.email, verificationCode);
      user = { id: userId };
      return;
    });

    return { success: true, data: { user } };
  } catch (err) {
    if (err.code !== '23505') {
      req.log.error(`Failed to create user`, { err: err.message });
    }

    res.status(500);
    return {
      success: false,
      error: {
        message: 'Internal server error',
      },
    };
  }
};
