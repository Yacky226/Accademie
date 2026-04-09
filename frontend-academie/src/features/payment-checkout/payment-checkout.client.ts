import { requestAuthenticatedApiJson } from "@/features/auth/api/authenticated-api.client";
import type { CatalogCourseDetailRecord } from "@/features/course-catalog/course-catalog.types";
import { fetchCatalogCourseBySlug } from "@/features/course-catalog/course-catalog.client";
import type {
  CheckoutPaymentRecord,
  StripeCheckoutSessionRecord,
} from "./payment-checkout.types";

type BackendPayment = {
  id: string;
  reference: string;
  amount: string;
  currency: string;
  status: string;
  isSubscription: boolean;
  subscriptionPlanCode?: string;
  subscriptionStatus?: string;
  description?: string;
  paidAt?: string;
  createdAt?: string;
  course?: {
    id: string;
    title: string;
    slug: string;
  };
};

function readNumber(value: string | number | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function mapPayment(value: BackendPayment): CheckoutPaymentRecord {
  return {
    id: value.id,
    reference: value.reference,
    amount: readNumber(value.amount),
    currency: value.currency,
    status: value.status,
    isSubscription: value.isSubscription,
    subscriptionPlanCode: value.subscriptionPlanCode ?? null,
    subscriptionStatus: value.subscriptionStatus ?? null,
    description: value.description ?? null,
    paidAt: value.paidAt ?? null,
    createdAt: value.createdAt ?? null,
    course: value.course
      ? {
          id: value.course.id,
          title: value.course.title,
          slug: value.course.slug,
        }
      : null,
  };
}

export function fetchCheckoutCourse(slug: string) {
  return fetchCatalogCourseBySlug(slug);
}

export async function fetchMyPayments() {
  const response = await requestAuthenticatedApiJson<BackendPayment[]>(
    "/api/payments/me",
    { method: "GET" },
    "Impossible de charger vos paiements.",
  );

  return response.map(mapPayment);
}

export async function createCourseCheckoutPayment(course: CatalogCourseDetailRecord) {
  const response = await requestAuthenticatedApiJson<BackendPayment>(
    "/api/payments",
    {
      method: "POST",
      body: JSON.stringify({
        amount: course.price,
        currency: course.currency,
        description: `Souscription au cours ${course.title}`,
        courseId: course.id,
        metadata: {
          checkoutType: "course",
          courseSlug: course.slug,
        },
      }),
    },
    "Impossible de preparer le paiement du cours.",
  );

  return mapPayment(response);
}

export async function createPackCheckoutPayment(input: {
  amount: number;
  billingInterval: string;
  currency: string;
  description: string;
  planCode: string;
}) {
  const response = await requestAuthenticatedApiJson<BackendPayment>(
    "/api/payments/subscriptions",
    {
      method: "POST",
      body: JSON.stringify({
        amount: input.amount,
        billingInterval: input.billingInterval,
        currency: input.currency,
        description: input.description,
        planCode: input.planCode,
      }),
    },
    "Impossible de preparer la souscription au pack.",
  );

  return mapPayment(response);
}

export async function createStripeCheckoutSession(paymentId: string) {
  return requestAuthenticatedApiJson<StripeCheckoutSessionRecord>(
    `/api/payments/${paymentId}/stripe/checkout-session`,
    {
      method: "POST",
    },
    "Impossible de lancer Stripe Checkout.",
  );
}

export async function syncStripeCheckoutSession(paymentId: string, sessionId: string) {
  const response = await requestAuthenticatedApiJson<BackendPayment>(
    `/api/payments/${paymentId}/stripe/sync`,
    {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    },
    "Impossible de synchroniser le paiement Stripe.",
  );

  return mapPayment(response);
}
