export default () => ({
  from: process.env.MAIL_FROM ?? 'no-reply@academie.local',
  provider: process.env.MAIL_PROVIDER ?? 'smtp',
});

