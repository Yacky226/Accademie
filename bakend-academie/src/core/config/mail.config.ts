export default () => ({
  from: process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER ?? 'no-reply@academie.local',
  fromName: process.env.SMTP_FROM_NAME ?? 'Academie',
  host: process.env.SMTP_HOST ?? '',
  password: process.env.SMTP_PASSWORD ?? '',
  port: Number(process.env.SMTP_PORT ?? 587),
  provider: process.env.MAIL_PROVIDER ?? 'smtp',
  secure: ['true', '1', 'yes'].includes(
    (process.env.SMTP_SECURE ?? 'false').trim().toLowerCase(),
  ),
  user: process.env.SMTP_USER ?? '',
});
