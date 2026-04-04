export default () => ({
  provider: process.env.PAYMENT_PROVIDER ?? 'stripe',
  currency: process.env.PAYMENT_CURRENCY ?? 'XOF',
});

