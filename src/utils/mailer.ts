/**
 * Mailer utility
 */

import nodemailer from 'nodemailer';

import { env } from './environment';

type MailAddress =
  | {
      name: string;
      address: string;
    }
  | string;

class Mailer {
  private transporter!: nodemailer.Transporter;

  constructor(
    private host: string,
    private user: string,
    private password: string,
    private useTLS: boolean = true,
    private port?: number,
  ) {}

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    if (this.host === 'ETHEREAL') {
      const testAccount = await nodemailer.createTestAccount();

      this.host = 'smtp.ethereal.email';
      this.port = 587;
      this.useTLS = false;
      this.user = testAccount.user;
      this.password = testAccount.pass;
    }

    this.transporter = nodemailer.createTransport({
      host: this.host,
      port: this.useTLS ? 465 : this.port,
      secure: this.useTLS,
      auth: {
        user: this.user,
        pass: this.password,
      },
    });

    return this.transporter;
  }

  public async send(
    from: MailAddress,
    to: MailAddress,
    subject: string,
    text?: string,
    html?: string,
  ): Promise<string> {
    const transporter = await this.getTransporter();
    const result = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(result));

    return result?.messageId;
  }
}

export const mailer = new Mailer(
  env.get('MAILER_HOST'),
  env.get('MAILER_USER'),
  env.get('MAILER_PASSWORD'),
  env.getAsBool('MAILER_USE_TLS'),
  env.getAsInt('MAILER_PORT'),
);
