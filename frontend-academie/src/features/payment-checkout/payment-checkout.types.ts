export interface CheckoutBenefit {
  icon: string;
  label: string;
}

export interface CheckoutSummaryLine {
  label: string;
  detail?: string;
  amount: string;
}

export interface CheckoutPlanRecord {
  code: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: string;
  benefits: CheckoutBenefit[];
}

export interface CheckoutPaymentRecord {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  isSubscription: boolean;
  subscriptionPlanCode: string | null;
  subscriptionStatus: string | null;
  description: string | null;
  paidAt: string | null;
  createdAt: string | null;
  course: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

export interface StripeCheckoutSessionRecord {
  sessionId: string;
  checkoutUrl: string;
}
