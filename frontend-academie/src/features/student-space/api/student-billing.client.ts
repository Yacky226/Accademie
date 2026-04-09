import { requestAuthenticatedApiJson } from "@/features/auth/api/authenticated-api.client";
import type { CheckoutPaymentRecord } from "@/features/payment-checkout/payment-checkout.types";

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

type BackendInvoice = {
  id: string;
  number: string;
  amount: string;
  subtotalHt: string;
  taxAmount: string;
  totalTtc: string;
  currency: string;
  status: string;
  fiscalStatus: string;
  issuedAt?: string;
  dueAt?: string;
  paidAt?: string;
  createdAt: string;
  payment?: {
    id: string;
    reference: string;
    status: string;
  };
};

export interface StudentInvoiceRecord {
  id: string;
  number: string;
  amount: number;
  subtotalHt: number;
  taxAmount: number;
  totalTtc: number;
  currency: string;
  status: string;
  fiscalStatus: string;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  createdAt: string;
  payment: {
    id: string;
    reference: string;
    status: string;
  } | null;
}

function readNumber(value: string | number | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number.parseFloat(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
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

function mapInvoice(value: BackendInvoice): StudentInvoiceRecord {
  return {
    id: value.id,
    number: value.number,
    amount: readNumber(value.amount),
    subtotalHt: readNumber(value.subtotalHt),
    taxAmount: readNumber(value.taxAmount),
    totalTtc: readNumber(value.totalTtc),
    currency: value.currency,
    status: value.status,
    fiscalStatus: value.fiscalStatus,
    issuedAt: value.issuedAt ?? null,
    dueAt: value.dueAt ?? null,
    paidAt: value.paidAt ?? null,
    createdAt: value.createdAt,
    payment: value.payment
      ? {
          id: value.payment.id,
          reference: value.payment.reference,
          status: value.payment.status,
        }
      : null,
  };
}

export async function fetchStudentPayments() {
  const response = await requestAuthenticatedApiJson<BackendPayment[]>(
    "/api/payments/me",
    { method: "GET" },
    "Impossible de charger votre historique de paiements.",
  );

  return response.map(mapPayment);
}

export async function fetchStudentInvoices() {
  const response = await requestAuthenticatedApiJson<BackendInvoice[]>(
    "/api/invoices/me",
    { method: "GET" },
    "Impossible de charger vos factures.",
  );

  return response.map(mapInvoice);
}
