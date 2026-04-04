import { PaymentStatus } from '../../../core/enums';

export class PaymentResponseDto {
  id!: string;
  reference!: string;
  amount!: string;
  currency!: string;
  status!: PaymentStatus;
  provider?: string;
  providerTransactionId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  isSubscription!: boolean;
  subscriptionPlanCode?: string;
  subscriptionStatus?: string;
  billingInterval?: string;
  nextBillingAt?: Date;
  canceledAt?: Date;
  refundedAmount?: string;
  refundReason?: string;
  refundedAt?: Date;
  paidAt?: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
    slug: string;
  };
  createdAt!: Date;
  updatedAt!: Date;
}
