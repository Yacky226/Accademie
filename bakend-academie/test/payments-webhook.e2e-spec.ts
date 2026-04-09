import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { createHmac } from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { TokenService } from '../src/modules/auth/services/token.service';
import { JwtAuthGuard } from '../src/core/guards/jwt-auth.guard';
import { RolesGuard } from '../src/core/guards/roles.guard';
import { PermissionsGuard } from '../src/core/guards/permissions.guard';
import { CoursesService } from '../src/modules/courses/courses.service';
import { InvoicesService } from '../src/modules/invoices/invoices.service';
import { PaymentsController } from '../src/modules/payments/payments.controller';
import { PaymentsService } from '../src/modules/payments/payments.service';
import { PaymentEntity } from '../src/modules/payments/entities/payment.entity';
import { PaymentsRepository } from '../src/modules/payments/repositories/payments.repository';

describe('Payments webhook (e2e)', () => {
  let app: INestApplication<App>;
  let lastSavedPayment: PaymentEntity | null;

  const payment = {
    id: 'payment-1',
    reference: 'PAY-1234',
    amount: '99.00',
    currency: 'EUR',
    status: 'PENDING',
    provider: undefined,
    providerTransactionId: undefined,
    metadata: undefined,
    paidAt: undefined,
    refundedAt: undefined,
    user: {
      id: 'user-1',
      firstName: 'Marie',
      lastName: 'Curie',
      email: 'marie@example.com',
    },
    course: {
      id: 'course-1',
      title: 'Algo Expert',
      slug: 'algo-expert',
    },
  } as PaymentEntity;

  const paymentsRepositoryMock = {
    findPaymentByReference: jest.fn(),
    findPaymentByProviderTransactionId: jest.fn(),
    findPaymentByMetadataValue: jest.fn(),
    savePayment: jest.fn(),
  };

  const invoicesServiceMock = {
    ensureInvoiceForPayment: jest.fn().mockResolvedValue(null),
    syncInvoiceFromPayment: jest.fn().mockResolvedValue(undefined),
  };

  const coursesServiceMock = {
    enrollCurrentUser: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    lastSavedPayment = null;
    process.env.PAYMENT_WEBHOOK_SECRET = 'test-webhook-secret';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test-webhook-secret';
    process.env.PAYMENT_WEBHOOK_TOLERANCE_SECONDS = '300';

    paymentsRepositoryMock.findPaymentByReference.mockResolvedValue({
      ...payment,
    });
    paymentsRepositoryMock.findPaymentByProviderTransactionId.mockResolvedValue(
      null,
    );
    paymentsRepositoryMock.findPaymentByMetadataValue.mockResolvedValue(null);
    paymentsRepositoryMock.savePayment.mockImplementation(
      (input: PaymentEntity) => {
        lastSavedPayment = input;
        return Promise.resolve(input);
      },
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        PaymentsService,
        { provide: PaymentsRepository, useValue: paymentsRepositoryMock },
        { provide: InvoicesService, useValue: invoicesServiceMock },
        { provide: CoursesService, useValue: coursesServiceMock },
        {
          provide: TokenService,
          useValue: {
            verifyAccessToken: jest.fn(),
          },
        },
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
        {
          provide: APP_GUARD,
          useClass: RolesGuard,
        },
        {
          provide: APP_GUARD,
          useClass: PermissionsGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
    delete process.env.PAYMENT_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.PAYMENT_WEBHOOK_TOLERANCE_SECONDS;
  });

  it('rejects unsigned webhook calls', async () => {
    await request(app.getHttpServer())
      .post('/payments/webhooks/provider')
      .send({
        provider: 'stripe',
        eventType: 'payment_succeeded',
        reference: 'PAY-1234',
      })
      .expect(401);
  });

  it('accepts Stripe-style signed webhook calls based on the raw body', async () => {
    const body = {
      id: 'evt_1',
      object: 'event',
      type: 'checkout.session.completed',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'cs_test_123',
          object: 'checkout.session',
          client_reference_id: 'PAY-1234',
          payment_intent: 'pi_123',
          payment_status: 'paid',
          mode: 'payment',
          amount_total: 9900,
          currency: 'eur',
          metadata: { reference: 'PAY-1234', source: 'stripe-cli' },
        },
      },
    };
    const timestamp = `${Math.floor(Date.now() / 1000)}`;
    const rawBody = JSON.stringify(body);
    const signature = signStripePayload(timestamp, rawBody);

    const response = await request(app.getHttpServer())
      .post('/payments/webhooks/provider')
      .set('content-type', 'application/json')
      .set('stripe-signature', `t=${timestamp},v1=${signature}`)
      .send(rawBody)
      .expect(201);

    expect(response.body).toEqual({ processed: true });
    expect(paymentsRepositoryMock.savePayment).toHaveBeenCalledTimes(1);
    expect(invoicesServiceMock.ensureInvoiceForPayment).toHaveBeenCalledWith(
      'payment-1',
      'user-1',
    );
    expect(invoicesServiceMock.syncInvoiceFromPayment).toHaveBeenCalledWith(
      'payment-1',
    );
    expect(coursesServiceMock.enrollCurrentUser).toHaveBeenCalledWith(
      'course-1',
      'user-1',
    );

    expect(lastSavedPayment).toBeDefined();
    if (!lastSavedPayment) {
      throw new Error('Expected a payment to be persisted');
    }
    expect(lastSavedPayment.status).toBe('PAID');
    expect(lastSavedPayment.provider).toBe('stripe');
    expect(lastSavedPayment.providerTransactionId).toBe('pi_123');
    expect(lastSavedPayment.paidAt).toBeInstanceOf(Date);
    expect(lastSavedPayment.metadata?.stripeCheckoutSessionId).toBe(
      'cs_test_123',
    );
    expect(lastSavedPayment.metadata?.stripePaymentIntentId).toBe('pi_123');
  });

  it('maps subscription cancellation events to the local subscription state', async () => {
    paymentsRepositoryMock.findPaymentByReference.mockResolvedValue(null);
    paymentsRepositoryMock.findPaymentByProviderTransactionId.mockResolvedValue(
      null,
    );
    paymentsRepositoryMock.findPaymentByMetadataValue.mockResolvedValue({
      ...payment,
      isSubscription: true,
      subscriptionStatus: 'ACTIVE',
      metadata: {
        stripeSubscriptionId: 'sub_123',
      },
    });

    const body = {
      id: 'evt_2',
      object: 'event',
      type: 'customer.subscription.deleted',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'sub_123',
          object: 'subscription',
          status: 'canceled',
          canceled_at: Math.floor(Date.now() / 1000),
          metadata: {},
          items: {
            data: [
              {
                price: {
                  id: 'price_monthly',
                  recurring: {
                    interval: 'month',
                  },
                },
              },
            ],
          },
        },
      },
    };
    const timestamp = `${Math.floor(Date.now() / 1000)}`;
    const rawBody = JSON.stringify(body);
    const signature = signStripePayload(timestamp, rawBody);

    await request(app.getHttpServer())
      .post('/payments/webhooks/provider')
      .set('content-type', 'application/json')
      .set('stripe-signature', `t=${timestamp},v1=${signature}`)
      .send(rawBody)
      .expect(201);

    expect(lastSavedPayment).toBeDefined();
    if (!lastSavedPayment) {
      throw new Error('Expected a payment to be persisted');
    }
    expect(lastSavedPayment.status).toBe('CANCELLED');
    expect(lastSavedPayment.subscriptionStatus).toBe('CANCELED');
    expect(lastSavedPayment.billingInterval).toBe('MONTH');
    expect(lastSavedPayment.canceledAt).toBeInstanceOf(Date);
    expect(coursesServiceMock.enrollCurrentUser).not.toHaveBeenCalled();
  });

  it('keeps the webhook route public while protected payment routes still require authentication', async () => {
    await request(app.getHttpServer()).get('/payments').expect(401);
  });
});

function signStripePayload(timestamp: string, rawBody: string): string {
  return createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET ?? '')
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
}
