import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';

interface SendMailInput {
  html: string;
  subject: string;
  text: string;
  to: string;
}

interface SendVerificationEmailInput {
  fullName?: string;
  to: string;
  verificationUrl: string;
}

interface SendPasswordResetEmailInput {
  fullName?: string;
  resetUrl: string;
  to: string;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly config = {
    fromEmail:
      process.env.SMTP_FROM_EMAIL?.trim() ||
      process.env.SMTP_USER?.trim() ||
      'no-reply@academie.local',
    fromName: process.env.SMTP_FROM_NAME?.trim() || 'Academie',
    host: process.env.SMTP_HOST?.trim() || '',
    password: process.env.SMTP_PASSWORD ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: ['true', '1', 'yes'].includes(
      (process.env.SMTP_SECURE ?? 'false').trim().toLowerCase(),
    ),
    user: process.env.SMTP_USER?.trim() || '',
  };
  private hasLoggedMissingConfig = false;
  private transporter: Transporter | null = null;

  async sendVerificationEmail({
    fullName,
    to,
    verificationUrl,
  }: SendVerificationEmailInput) {
    const recipientName = fullName?.trim() || 'there';
    const safeRecipientName = escapeHtml(recipientName);
    const safeUrl = escapeHtml(verificationUrl);

    return this.sendMail({
      to,
      subject: 'Verify your email address',
      text: [
        `Hello ${recipientName},`,
        '',
        'Confirm your email address to activate your Academie account.',
        verificationUrl,
        '',
        'If you did not request this email, you can ignore it.',
      ].join('\n'),
      html: `
        <div style="font-family: Segoe UI, Arial, sans-serif; color: #0d1c2e; line-height: 1.6;">
          <h2 style="margin-bottom: 16px;">Verify your email address</h2>
          <p>Hello ${safeRecipientName},</p>
          <p>Confirm your email address to activate your Academie account.</p>
          <p>
            <a
              href="${safeUrl}"
              style="display: inline-block; padding: 12px 18px; border-radius: 10px; background: #004ac6; color: #ffffff; text-decoration: none; font-weight: 700;"
            >
              Verify my email
            </a>
          </p>
          <p>If the button does not work, open this link:</p>
          <p><a href="${safeUrl}">${safeUrl}</a></p>
          <p>If you did not request this email, you can ignore it.</p>
        </div>
      `.trim(),
    });
  }

  async sendPasswordResetEmail({
    fullName,
    resetUrl,
    to,
  }: SendPasswordResetEmailInput) {
    const recipientName = fullName?.trim() || 'there';
    const safeRecipientName = escapeHtml(recipientName);
    const safeUrl = escapeHtml(resetUrl);

    return this.sendMail({
      to,
      subject: 'Reset your password',
      text: [
        `Hello ${recipientName},`,
        '',
        'A password reset was requested for your Academie account.',
        resetUrl,
        '',
        'If you did not request this email, you can ignore it.',
      ].join('\n'),
      html: `
        <div style="font-family: Segoe UI, Arial, sans-serif; color: #0d1c2e; line-height: 1.6;">
          <h2 style="margin-bottom: 16px;">Reset your password</h2>
          <p>Hello ${safeRecipientName},</p>
          <p>A password reset was requested for your Academie account.</p>
          <p>
            <a
              href="${safeUrl}"
              style="display: inline-block; padding: 12px 18px; border-radius: 10px; background: #004ac6; color: #ffffff; text-decoration: none; font-weight: 700;"
            >
              Reset my password
            </a>
          </p>
          <p>If the button does not work, open this link:</p>
          <p><a href="${safeUrl}">${safeUrl}</a></p>
          <p>If you did not request this email, you can ignore it.</p>
        </div>
      `.trim(),
    });
  }

  private async sendMail(input: SendMailInput) {
    if (!this.isConfigured()) {
      if (!this.hasLoggedMissingConfig) {
        this.logger.warn(
          'SMTP is not fully configured. Email delivery is disabled until SMTP_* variables are set.',
        );
        this.hasLoggedMissingConfig = true;
      }
      return false;
    }

    await this.getTransporter().sendMail({
      from: this.formatFromAddress(),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    this.logger.log(`Email sent to ${input.to} with subject "${input.subject}".`);
    return true;
  }

  private formatFromAddress() {
    const { fromEmail, fromName } = this.config;

    return fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;
  }

  private getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.password,
        },
      });
    }

    return this.transporter;
  }

  private isConfigured() {
    return Boolean(
      this.config.host &&
        Number.isFinite(this.config.port) &&
        this.config.user &&
        this.config.password &&
        this.config.fromEmail,
    );
  }
}
