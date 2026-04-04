import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { PaymentStatus, UserRole } from '../../core/enums';
import { InvoicesService } from '../invoices/invoices.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateSubscriptionPaymentDto } from './dto/create-subscription-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { ProviderWebhookDto } from './dto/provider-webhook.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentsRepository } from './repositories/payments.repository';

interface NormalizedWebhookEvent {
  provider: string;
  eventType: string;
  referenceCandidates: string[];
  transactionIds: string[];
  metadataLookups: Array<{ key: string; value: string }>;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
  stripeObject?: Record<string, unknown>;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly invoicesService: InvoicesService,
  ) {}

  async listPayments(): Promise<PaymentResponseDto[]> {
    const payments = await this.paymentsRepository.findAllPayments();
    return payments.map((payment) => this.toResponse(payment));
  }

  async listMyPayments(userId: string): Promise<PaymentResponseDto[]> {
    const user = await this.paymentsRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const payments = await this.paymentsRepository.findPaymentsByUserId(userId);
    return payments.map((payment) => this.toResponse(payment));
  }

  async getPaymentById(id: string, userId: string, roles: string[]): Promise<PaymentResponseDto> {
    const payment = await this.paymentsRepository.findPaymentById(id);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const isOwner = payment.user?.id === userId;
    const canRead = this.hasElevatedRole(roles) || isOwner;
    if (!canRead) {
      throw new ForbiddenException('You are not allowed to access this payment');
    }

    return this.toResponse(payment);
  }

  async createPayment(
    userId: string,
    dto: CreatePaymentDto,
    roles: string[],
  ): Promise<PaymentResponseDto> {
    const user = await this.paymentsRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const elevatedAccess = this.hasElevatedRole(roles);
    const payment = new PaymentEntity();
    payment.reference = this.generateReference();
    payment.amount = dto.amount.toFixed(2);
    payment.currency = (dto.currency ?? 'XOF').toUpperCase();
    payment.status = elevatedAccess ? dto.status ?? PaymentStatus.PENDING : PaymentStatus.PENDING;
    payment.provider = elevatedAccess ? dto.provider : undefined;
    payment.providerTransactionId = elevatedAccess ? dto.providerTransactionId : undefined;
    payment.description = dto.description;
    payment.metadata = dto.metadata;
    payment.isSubscription = dto.isSubscription ?? false;
    payment.subscriptionPlanCode = dto.subscriptionPlanCode;
    payment.subscriptionStatus = payment.isSubscription ? 'ACTIVE' : undefined;
    payment.billingInterval = dto.billingInterval;
    payment.nextBillingAt = dto.nextBillingAt ? new Date(dto.nextBillingAt) : undefined;
    payment.user = user;
    payment.paidAt = payment.status === PaymentStatus.PAID ? new Date() : undefined;

    if (dto.courseId) {
      const course = await this.paymentsRepository.findCourseById(dto.courseId);
      if (!course) {
        throw new NotFoundException('Course not found');
      }
      payment.course = course;
    }

    const saved = await this.paymentsRepository.savePayment(payment);
    await this.invoicesService.ensureInvoiceForPayment(saved.id, userId);
    await this.invoicesService.syncInvoiceFromPayment(saved.id);
    const hydrated = await this.paymentsRepository.findPaymentById(saved.id);
    return this.toResponse(hydrated ?? saved);
  }

  async createSubscriptionPayment(
    userId: string,
    dto: CreateSubscriptionPaymentDto,
    roles: string[],
  ): Promise<PaymentResponseDto> {
    const createDto: CreatePaymentDto = {
      amount: dto.amount,
      currency: dto.currency,
      status: PaymentStatus.PENDING,
      description: dto.description ?? `Subscription ${dto.planCode}`,
      courseId: dto.courseId,
      isSubscription: true,
      subscriptionPlanCode: dto.planCode,
      billingInterval: dto.billingInterval ?? 'MONTHLY',
      nextBillingAt: dto.nextBillingAt,
    };

    return this.createPayment(userId, createDto, roles);
  }

  async updatePayment(
    id: string,
    dto: UpdatePaymentDto,
    userId: string,
    roles: string[],
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentsRepository.findPaymentById(id);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const isOwner = payment.user?.id === userId;
    const canUpdate = this.hasElevatedRole(roles) || isOwner;
    if (!canUpdate) {
      throw new ForbiddenException('You are not allowed to update this payment');
    }

    const elevatedAccess = this.hasElevatedRole(roles);
    if (!elevatedAccess) {
      const isCancellingOwnSubscription =
        dto.subscriptionStatus?.toUpperCase() === 'CANCELED' &&
        dto.amount === undefined &&
        dto.currency === undefined &&
        dto.status === undefined &&
        dto.provider === undefined &&
        dto.providerTransactionId === undefined &&
        dto.billingInterval === undefined &&
        dto.nextBillingAt === undefined;

      const hasRestrictedChange =
        dto.amount !== undefined ||
        dto.currency !== undefined ||
        dto.status !== undefined ||
        dto.provider !== undefined ||
        dto.providerTransactionId !== undefined ||
        (dto.subscriptionStatus !== undefined && !isCancellingOwnSubscription) ||
        dto.billingInterval !== undefined ||
        dto.nextBillingAt !== undefined;

      if (hasRestrictedChange) {
        throw new ForbiddenException(
          'Only staff or provider webhooks can update financial payment fields',
        );
      }
    }

    if (dto.amount !== undefined) {
      payment.amount = dto.amount.toFixed(2);
    }
    if (dto.currency !== undefined) {
      payment.currency = dto.currency.toUpperCase();
    }
    if (dto.status !== undefined) {
      payment.status = dto.status;
      payment.paidAt = dto.status === PaymentStatus.PAID ? new Date() : payment.paidAt;
    }
    if (dto.provider !== undefined) {
      payment.provider = dto.provider;
    }
    if (dto.providerTransactionId !== undefined) {
      payment.providerTransactionId = dto.providerTransactionId;
    }
    if (dto.description !== undefined) {
      payment.description = dto.description;
    }
    if (dto.metadata !== undefined) {
      payment.metadata = dto.metadata;
    }
    if (dto.subscriptionPlanCode !== undefined) {
      payment.subscriptionPlanCode = dto.subscriptionPlanCode;
    }
    if (dto.subscriptionStatus !== undefined) {
      payment.subscriptionStatus = dto.subscriptionStatus.toUpperCase();
      if (payment.subscriptionStatus === 'CANCELED') {
        payment.canceledAt = new Date();
      }
    }
    if (dto.billingInterval !== undefined) {
      payment.billingInterval = dto.billingInterval.toUpperCase();
    }
    if (dto.nextBillingAt !== undefined) {
      payment.nextBillingAt = dto.nextBillingAt ? new Date(dto.nextBillingAt) : undefined;
    }

    const updated = await this.paymentsRepository.savePayment(payment);
    await this.invoicesService.ensureInvoiceForPayment(updated.id, payment.user?.id ?? userId);
    await this.invoicesService.syncInvoiceFromPayment(updated.id);
    const hydrated = await this.paymentsRepository.findPaymentById(updated.id);
    return this.toResponse(hydrated ?? updated);
  }

  async refundPayment(
    id: string,
    dto: RefundPaymentDto,
    userId: string,
    roles: string[],
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentsRepository.findPaymentById(id);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (!this.hasElevatedRole(roles)) {
      throw new ForbiddenException('Only staff members can refund payments');
    }

    if (payment.status !== PaymentStatus.PAID && payment.status !== PaymentStatus.REFUNDED) {
      throw new ConflictException('Only paid payments can be refunded');
    }

    const amountToRefund = dto.amount ?? Number(payment.amount);
    if (amountToRefund > Number(payment.amount)) {
      throw new ConflictException('Refund amount cannot exceed original amount');
    }

    payment.status = PaymentStatus.REFUNDED;
    payment.refundedAmount = amountToRefund.toFixed(2);
    payment.refundReason = dto.reason;
    payment.refundedAt = new Date();

    const saved = await this.paymentsRepository.savePayment(payment);
    await this.invoicesService.syncInvoiceFromPayment(saved.id);
    return this.toResponse(saved);
  }

  async processProviderWebhook(
    dto: ProviderWebhookDto,
    signatureHeader?: string,
    timestampHeader?: string,
    stripeSignatureHeader?: string,
    rawBody?: Buffer,
  ): Promise<{ processed: boolean }> {
    if (stripeSignatureHeader) {
      this.assertValidStripeWebhookSignature(rawBody, stripeSignatureHeader);
    } else {
      this.assertValidWebhookSignature(dto, signatureHeader, timestampHeader);
    }

    const normalizedEvent = this.normalizeWebhookEvent(dto, Boolean(stripeSignatureHeader));
    const payment = await this.findPaymentForWebhook(normalizedEvent);

    if (!payment) {
      return { processed: false };
    }

    this.applyWebhookEventToPayment(payment, normalizedEvent);

    const savedPayment = await this.paymentsRepository.savePayment(payment);
    await this.invoicesService.ensureInvoiceForPayment(savedPayment.id, savedPayment.user?.id);
    await this.invoicesService.syncInvoiceFromPayment(savedPayment.id);
    return { processed: true };
  }

  async deletePayment(id: string): Promise<void> {
    const payment = await this.paymentsRepository.findPaymentById(id);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    await this.paymentsRepository.softDeletePayment(payment);
  }

  private generateReference(): string {
    return `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  private hasElevatedRole(roles: string[]): boolean {
    return roles.includes(UserRole.ADMIN) || roles.includes(UserRole.TEACHER);
  }

  private assertValidWebhookSignature(
    dto: ProviderWebhookDto,
    signatureHeader?: string,
    timestampHeader?: string,
  ): void {
    const signature = this.extractWebhookSignature(signatureHeader);
    const timestamp = this.parseWebhookTimestamp(timestampHeader);
    const toleranceSeconds = Number(process.env.PAYMENT_WEBHOOK_TOLERANCE_SECONDS ?? 300);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) {
      throw new UnauthorizedException('Webhook timestamp is outside the accepted tolerance window');
    }

    const secret = process.env.PAYMENT_WEBHOOK_SECRET ?? 'academie-payment-webhook-secret';
    const payload = `${timestamp}.${this.serializeWebhookPayload(dto)}`;
    const expectedSignature = createHmac('sha256', secret).update(payload).digest('hex');

    const providedSignatureBuffer = Buffer.from(signature, 'hex');
    const expectedSignatureBuffer = Buffer.from(expectedSignature, 'hex');
    const signaturesMatch =
      providedSignatureBuffer.length === expectedSignatureBuffer.length &&
      timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer);

    if (!signaturesMatch) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }

  private extractWebhookSignature(signatureHeader?: string): string {
    if (!signatureHeader) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const rawSignature = signatureHeader.startsWith('sha256=')
      ? signatureHeader.slice('sha256='.length)
      : signatureHeader;
    const normalizedSignature = rawSignature.trim().toLowerCase();

    if (!/^[a-f0-9]{64}$/.test(normalizedSignature)) {
      throw new BadRequestException('Webhook signature must be a sha256 hex digest');
    }

    return normalizedSignature;
  }

  private assertValidStripeWebhookSignature(rawBody: Buffer | undefined, signatureHeader: string): void {
    if (!rawBody) {
      throw new UnauthorizedException('Missing raw body required for Stripe webhook verification');
    }

    const { timestamp, signatures } = this.parseStripeSignatureHeader(signatureHeader);
    const toleranceSeconds = Number(process.env.PAYMENT_WEBHOOK_TOLERANCE_SECONDS ?? 300);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) {
      throw new UnauthorizedException('Webhook timestamp is outside the accepted tolerance window');
    }

    const secret =
      process.env.STRIPE_WEBHOOK_SECRET ??
      process.env.PAYMENT_WEBHOOK_SECRET ??
      'academie-payment-webhook-secret';
    const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;
    const expectedSignature = createHmac('sha256', secret).update(signedPayload).digest('hex');
    const expectedSignatureBuffer = Buffer.from(expectedSignature, 'hex');

    const hasMatchingSignature = signatures.some((signature) => {
      const providedSignatureBuffer = Buffer.from(signature, 'hex');
      return (
        providedSignatureBuffer.length === expectedSignatureBuffer.length &&
        timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer)
      );
    });

    if (!hasMatchingSignature) {
      throw new UnauthorizedException('Invalid Stripe webhook signature');
    }
  }

  private parseStripeSignatureHeader(signatureHeader: string): {
    timestamp: number;
    signatures: string[];
  } {
    const parsedEntries = signatureHeader
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .map((entry) => {
        const [key, value] = entry.split('=');
        return { key, value };
      });

    const timestampValue = parsedEntries.find((entry) => entry.key === 't')?.value;
    const signatures = parsedEntries
      .filter((entry) => entry.key === 'v1')
      .map((entry) => entry.value?.trim().toLowerCase())
      .filter((value): value is string => Boolean(value) && /^[a-f0-9]{64}$/.test(value));

    if (!timestampValue || !/^\d+$/.test(timestampValue)) {
      throw new BadRequestException('Stripe signature header is missing a valid timestamp');
    }

    if (!signatures.length) {
      throw new BadRequestException('Stripe signature header is missing a valid v1 signature');
    }

    return {
      timestamp: Number(timestampValue),
      signatures,
    };
  }

  private parseWebhookTimestamp(timestampHeader?: string): number {
    if (!timestampHeader) {
      throw new UnauthorizedException('Missing webhook timestamp');
    }

    const normalizedTimestamp = timestampHeader.trim();
    if (!/^\d+$/.test(normalizedTimestamp)) {
      throw new BadRequestException('Webhook timestamp must be expressed as UNIX seconds');
    }

    return Number(normalizedTimestamp);
  }

  private serializeWebhookPayload(dto: ProviderWebhookDto): string {
    return JSON.stringify(this.sortWebhookPayload(dto));
  }

  private sortWebhookPayload(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((entry) => this.sortWebhookPayload(entry));
    }

    if (value && typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .reduce<Record<string, unknown>>((sorted, [key, nestedValue]) => {
          sorted[key] = this.sortWebhookPayload(nestedValue);
          return sorted;
        }, {});
    }

    return value;
  }

  private normalizeWebhookEvent(
    dto: ProviderWebhookDto,
    isStripeRequest: boolean,
  ): NormalizedWebhookEvent {
    if (isStripeRequest || dto.type || dto.object === 'event') {
      const stripeObject = this.extractStripeEventObject(dto);
      const metadata = this.extractStripeObjectMetadata(stripeObject);
      const referenceCandidates = this.compactUnique([
        dto.reference,
        this.readStringFromObject(metadata, 'reference'),
        this.readStringFromObject(metadata, 'paymentReference'),
        this.readStringFromObject(metadata, 'payment_reference'),
        this.readStringFromObject(metadata, 'internalReference'),
        this.readStringFromObject(metadata, 'internal_reference'),
        this.readStringValue(stripeObject, ['client_reference_id']),
      ]);
      const transactionIds = this.compactUnique([
        dto.providerTransactionId,
        this.readStringValue(stripeObject, ['payment_intent']),
        this.readStringValue(stripeObject, ['latest_charge']),
        this.readStringValue(stripeObject, ['charge']),
        this.readStringValue(stripeObject, ['invoice']),
        this.readStringValue(stripeObject, ['id']),
      ]);
      const metadataLookups = this.compactMetadataLookups([
        {
          key: 'stripeCheckoutSessionId',
          value:
            this.readStringValue(stripeObject, ['object']) === 'checkout.session'
              ? this.readStringValue(stripeObject, ['id'])
              : undefined,
        },
        {
          key: 'stripePaymentIntentId',
          value: this.readStringValue(stripeObject, ['payment_intent']),
        },
        {
          key: 'stripeChargeId',
          value: this.readStringValue(stripeObject, ['latest_charge']) ?? this.readStringValue(stripeObject, ['charge']),
        },
        {
          key: 'stripeInvoiceId',
          value:
            this.readStringValue(stripeObject, ['object']) === 'invoice'
              ? this.readStringValue(stripeObject, ['id'])
              : this.readStringValue(stripeObject, ['invoice']),
        },
        {
          key: 'stripeSubscriptionId',
          value:
            this.readStringValue(stripeObject, ['object']) === 'subscription'
              ? this.readStringValue(stripeObject, ['id'])
              : this.readStringValue(stripeObject, ['subscription']),
        },
      ]);

      return {
        provider: 'stripe',
        eventType: (dto.type ?? dto.eventType ?? '').trim().toLowerCase(),
        referenceCandidates,
        transactionIds,
        metadataLookups,
        metadata: {
          ...(dto.metadata ?? {}),
          ...(metadata ?? {}),
          stripeEventId: dto.id,
          stripeObjectType: this.readStringValue(stripeObject, ['object']),
          stripeCheckoutSessionId: metadataLookups.find((entry) => entry.key === 'stripeCheckoutSessionId')?.value,
          stripePaymentIntentId: metadataLookups.find((entry) => entry.key === 'stripePaymentIntentId')?.value,
          stripeChargeId: metadataLookups.find((entry) => entry.key === 'stripeChargeId')?.value,
          stripeInvoiceId: metadataLookups.find((entry) => entry.key === 'stripeInvoiceId')?.value,
          stripeSubscriptionId: metadataLookups.find((entry) => entry.key === 'stripeSubscriptionId')?.value,
          stripeCustomerId: this.readStringValue(stripeObject, ['customer']),
        },
        occurredAt: this.resolveWebhookOccurredAt(dto.created, stripeObject),
        stripeObject,
      };
    }

    return {
      provider: (dto.provider ?? 'unknown').trim().toLowerCase(),
      eventType: (dto.eventType ?? '').trim().toLowerCase(),
      referenceCandidates: this.compactUnique([dto.reference]),
      transactionIds: this.compactUnique([dto.providerTransactionId]),
      metadataLookups: [],
      metadata: dto.metadata,
      occurredAt: new Date(),
    };
  }

  private async findPaymentForWebhook(
    event: NormalizedWebhookEvent,
  ): Promise<PaymentEntity | null> {
    for (const reference of event.referenceCandidates) {
      const payment = await this.paymentsRepository.findPaymentByReference(reference);
      if (payment) {
        return payment;
      }
    }

    for (const transactionId of event.transactionIds) {
      const payment = await this.paymentsRepository.findPaymentByProviderTransactionId(transactionId);
      if (payment) {
        return payment;
      }
    }

    for (const lookup of event.metadataLookups) {
      const payment = await this.paymentsRepository.findPaymentByMetadataValue(
        lookup.key,
        lookup.value,
      );
      if (payment) {
        return payment;
      }
    }

    return null;
  }

  private applyWebhookEventToPayment(
    payment: PaymentEntity,
    event: NormalizedWebhookEvent,
  ): void {
    if (!event.eventType) {
      throw new BadRequestException('Webhook event type is required');
    }

    payment.provider = event.provider;
    payment.metadata = {
      ...(payment.metadata ?? {}),
      ...(event.metadata ?? {}),
    };

    if (event.provider === 'stripe') {
      this.applyStripeWebhookEventToPayment(payment, event);
      return;
    }

    if (event.eventType === 'payment_succeeded') {
      payment.status = PaymentStatus.PAID;
      payment.paidAt = event.occurredAt ?? new Date();
      payment.providerTransactionId = event.transactionIds[0] ?? payment.providerTransactionId;
    } else if (event.eventType === 'payment_failed') {
      payment.status = PaymentStatus.FAILED;
    } else if (event.eventType === 'payment_refunded') {
      payment.status = PaymentStatus.REFUNDED;
      payment.refundedAt = event.occurredAt ?? new Date();
      payment.providerTransactionId = event.transactionIds[0] ?? payment.providerTransactionId;
    }
  }

  private applyStripeWebhookEventToPayment(
    payment: PaymentEntity,
    event: NormalizedWebhookEvent,
  ): void {
    const stripeObject = event.stripeObject;
    const occurredAt = event.occurredAt ?? new Date();
    const primaryTransactionId = event.transactionIds[0];

    if (primaryTransactionId && !event.eventType.startsWith('customer.subscription.')) {
      payment.providerTransactionId = primaryTransactionId;
    }

    const amount = this.extractStripeAmount(stripeObject, event.eventType);
    if (amount !== undefined) {
      payment.amount = amount.toFixed(2);
    }

    const currency = this.readStringValue(stripeObject, ['currency']);
    if (currency) {
      payment.currency = currency.toUpperCase();
    }

    const subscriptionPlanCode = this.extractStripePlanCode(stripeObject);
    if (subscriptionPlanCode) {
      payment.subscriptionPlanCode = subscriptionPlanCode;
    }

    const billingInterval = this.extractStripeBillingInterval(stripeObject);
    if (billingInterval) {
      payment.billingInterval = billingInterval;
    }

    const nextBillingAt = this.extractStripeNextBillingAt(stripeObject);
    if (nextBillingAt) {
      payment.nextBillingAt = nextBillingAt;
    }

    if (
      event.eventType.includes('subscription') ||
      this.readStringValue(stripeObject, ['mode']) === 'subscription' ||
      Boolean(this.readStringValue(stripeObject, ['subscription']))
    ) {
      payment.isSubscription = true;
    }

    switch (event.eventType) {
      case 'checkout.session.completed':
        if (this.readStringValue(stripeObject, ['mode']) === 'subscription') {
          payment.isSubscription = true;
          payment.subscriptionStatus = 'ACTIVE';
        }

        if (
          this.readStringValue(stripeObject, ['payment_status']) === 'paid' ||
          this.readStringValue(stripeObject, ['mode']) === 'payment'
        ) {
          payment.status = PaymentStatus.PAID;
          payment.paidAt = occurredAt;
        }
        break;

      case 'checkout.session.expired':
        payment.status = PaymentStatus.CANCELLED;
        payment.canceledAt = occurredAt;
        break;

      case 'payment_intent.succeeded':
      case 'invoice.paid':
        payment.status = PaymentStatus.PAID;
        payment.paidAt = occurredAt;
        if (payment.isSubscription) {
          payment.subscriptionStatus = 'ACTIVE';
        }
        break;

      case 'payment_intent.payment_failed':
      case 'invoice.payment_failed':
        payment.status = PaymentStatus.FAILED;
        if (payment.isSubscription) {
          payment.subscriptionStatus = 'PAST_DUE';
        }
        break;

      case 'charge.refunded':
        payment.status = PaymentStatus.REFUNDED;
        payment.refundedAt = occurredAt;
        payment.refundedAmount = this.extractStripeRefundAmount(stripeObject)?.toFixed(2);
        break;

      case 'customer.subscription.updated': {
        payment.isSubscription = true;
        const subscriptionStatus = this.normalizeExternalStatus(
          this.readStringValue(stripeObject, ['status']),
        );
        payment.subscriptionStatus = subscriptionStatus ?? payment.subscriptionStatus;
        if (subscriptionStatus === 'CANCELED') {
          payment.status = PaymentStatus.CANCELLED;
          payment.canceledAt = this.extractStripeCancellationDate(stripeObject) ?? occurredAt;
        }
        break;
      }

      case 'customer.subscription.deleted':
        payment.isSubscription = true;
        payment.status = PaymentStatus.CANCELLED;
        payment.subscriptionStatus = 'CANCELED';
        payment.canceledAt = this.extractStripeCancellationDate(stripeObject) ?? occurredAt;
        if (!payment.providerTransactionId) {
          payment.providerTransactionId =
            this.readStringValue(stripeObject, ['id']) ?? payment.providerTransactionId;
        }
        break;

      default:
        break;
    }
  }

  private extractStripeEventObject(dto: ProviderWebhookDto): Record<string, unknown> | undefined {
    const dataObject = dto.data?.['object'];
    return dataObject && typeof dataObject === 'object'
      ? (dataObject as Record<string, unknown>)
      : undefined;
  }

  private extractStripeObjectMetadata(
    stripeObject: Record<string, unknown> | undefined,
  ): Record<string, unknown> | undefined {
    const metadata = stripeObject?.['metadata'];
    return metadata && typeof metadata === 'object'
      ? (metadata as Record<string, unknown>)
      : undefined;
  }

  private resolveWebhookOccurredAt(
    createdAtUnixSeconds: number | undefined,
    stripeObject: Record<string, unknown> | undefined,
  ): Date | undefined {
    const topLevelDate = this.toDateFromUnixSeconds(createdAtUnixSeconds);
    if (topLevelDate) {
      return topLevelDate;
    }

    const objectCreatedAt = this.readNumberValue(stripeObject, ['created']);
    return this.toDateFromUnixSeconds(objectCreatedAt);
  }

  private extractStripeAmount(
    stripeObject: Record<string, unknown> | undefined,
    eventType: string,
  ): number | undefined {
    if (!stripeObject) {
      return undefined;
    }

    const minorAmount =
      eventType === 'charge.refunded'
        ? this.readNumberValue(stripeObject, ['amount'])
        : this.readNumberValue(
            stripeObject,
            ['amount_total'],
            ['amount_received'],
            ['amount_paid'],
            ['amount_due'],
            ['amount'],
          );

    return minorAmount !== undefined ? minorAmount / 100 : undefined;
  }

  private extractStripeRefundAmount(
    stripeObject: Record<string, unknown> | undefined,
  ): number | undefined {
    const amountRefunded = this.readNumberValue(stripeObject, ['amount_refunded'], ['amount']);
    return amountRefunded !== undefined ? amountRefunded / 100 : undefined;
  }

  private extractStripePlanCode(
    stripeObject: Record<string, unknown> | undefined,
  ): string | undefined {
    return (
      this.readStringValue(stripeObject, ['metadata', 'planCode']) ??
      this.readStringValue(stripeObject, ['metadata', 'subscriptionPlanCode']) ??
      this.readStringValue(stripeObject, ['plan', 'id']) ??
      this.readStringValue(stripeObject, ['items', 'data', 0, 'plan', 'id']) ??
      this.readStringValue(stripeObject, ['items', 'data', 0, 'price', 'id'])
    );
  }

  private extractStripeBillingInterval(
    stripeObject: Record<string, unknown> | undefined,
  ): string | undefined {
    const interval =
      this.readStringValue(stripeObject, ['metadata', 'billingInterval']) ??
      this.readStringValue(stripeObject, ['plan', 'interval']) ??
      this.readStringValue(stripeObject, ['items', 'data', 0, 'plan', 'interval']) ??
      this.readStringValue(stripeObject, ['items', 'data', 0, 'price', 'recurring', 'interval']) ??
      this.readStringValue(stripeObject, ['lines', 'data', 0, 'price', 'recurring', 'interval']);

    return interval ? interval.toUpperCase() : undefined;
  }

  private extractStripeNextBillingAt(
    stripeObject: Record<string, unknown> | undefined,
  ): Date | undefined {
    const nextBillingUnixSeconds = this.readNumberValue(
      stripeObject,
      ['current_period_end'],
      ['lines', 'data', 0, 'period', 'end'],
      ['next_payment_attempt'],
    );

    return this.toDateFromUnixSeconds(nextBillingUnixSeconds);
  }

  private extractStripeCancellationDate(
    stripeObject: Record<string, unknown> | undefined,
  ): Date | undefined {
    const canceledAtUnixSeconds = this.readNumberValue(
      stripeObject,
      ['canceled_at'],
      ['ended_at'],
      ['cancel_at'],
    );

    return this.toDateFromUnixSeconds(canceledAtUnixSeconds);
  }

  private normalizeExternalStatus(status: string | undefined): string | undefined {
    return status ? status.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_') : undefined;
  }

  private compactUnique(values: Array<string | undefined>): string[] {
    return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())))]
      .map((value) => value.trim());
  }

  private compactMetadataLookups(
    lookups: Array<{ key: string; value: string | undefined }>,
  ): Array<{ key: string; value: string }> {
    return lookups.filter(
      (lookup): lookup is { key: string; value: string } =>
        Boolean(lookup.value && lookup.value.trim()),
    );
  }

  private readStringFromObject(
    input: Record<string, unknown> | undefined,
    key: string,
  ): string | undefined {
    const value = input?.[key];
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
  }

  private readStringValue(
    input: Record<string, unknown> | undefined,
    ...paths: Array<Array<string | number>>
  ): string | undefined {
    for (const path of paths) {
      const value = this.getNestedValue(input, path);
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }

    return undefined;
  }

  private readNumberValue(
    input: Record<string, unknown> | undefined,
    ...paths: Array<Array<string | number>>
  ): number | undefined {
    for (const path of paths) {
      const value = this.getNestedValue(input, path);
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
    }

    return undefined;
  }

  private getNestedValue(
    input: Record<string, unknown> | undefined,
    path: Array<string | number>,
  ): unknown {
    let current: unknown = input;

    for (const segment of path) {
      if (typeof segment === 'number') {
        if (!Array.isArray(current) || current.length <= segment) {
          return undefined;
        }
        current = current[segment];
        continue;
      }

      if (!current || typeof current !== 'object') {
        return undefined;
      }

      current = (current as Record<string, unknown>)[segment];
    }

    return current;
  }

  private toDateFromUnixSeconds(value: number | undefined): Date | undefined {
    return typeof value === 'number' && value > 0 ? new Date(value * 1000) : undefined;
  }

  private toResponse(payment: PaymentEntity): PaymentResponseDto {
    return {
      id: payment.id,
      reference: payment.reference,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      provider: payment.provider,
      providerTransactionId: payment.providerTransactionId,
      description: payment.description,
      metadata: payment.metadata,
      isSubscription: payment.isSubscription,
      subscriptionPlanCode: payment.subscriptionPlanCode,
      subscriptionStatus: payment.subscriptionStatus,
      billingInterval: payment.billingInterval,
      nextBillingAt: payment.nextBillingAt,
      canceledAt: payment.canceledAt,
      refundedAmount: payment.refundedAmount,
      refundReason: payment.refundReason,
      refundedAt: payment.refundedAt,
      paidAt: payment.paidAt,
      user: payment.user
        ? {
            id: payment.user.id,
            firstName: payment.user.firstName,
            lastName: payment.user.lastName,
            email: payment.user.email,
          }
        : undefined,
      course: payment.course
        ? {
            id: payment.course.id,
            title: payment.course.title,
            slug: payment.course.slug,
          }
        : undefined,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
