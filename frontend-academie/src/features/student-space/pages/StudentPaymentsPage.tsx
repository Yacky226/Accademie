"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CheckoutPaymentRecord } from "@/features/payment-checkout/payment-checkout.types";
import {
  fetchStudentInvoices,
  fetchStudentPayments,
  type StudentInvoiceRecord,
} from "../api/student-billing.client";
import { StudentShell } from "../components/StudentShell";
import styles from "../student-space.module.css";

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function formatDateLabel(value: string | null) {
  if (!value) {
    return "Non disponible";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Non disponible";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatStatusLabel(value: string | null | undefined) {
  if (!value?.trim()) {
    return "Inconnu";
  }

  return value
    .trim()
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getPaymentStatusClassName(status: string) {
  const normalizedStatus = status.trim().toUpperCase();

  if (normalizedStatus === "PAID") {
    return styles.billingStatusPaid;
  }

  if (normalizedStatus === "PENDING") {
    return styles.billingStatusPending;
  }

  return styles.billingStatusMuted;
}

export function StudentPaymentsPage() {
  const [payments, setPayments] = useState<CheckoutPaymentRecord[]>([]);
  const [invoices, setInvoices] = useState<StudentInvoiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadBilling() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [currentPayments, currentInvoices] = await Promise.all([
          fetchStudentPayments(),
          fetchStudentInvoices(),
        ]);

        if (!isActive) {
          return;
        }

        setPayments(currentPayments);
        setInvoices(currentInvoices);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger votre espace de facturation.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadBilling();

    return () => {
      isActive = false;
    };
  }, []);

  const paidPayments = useMemo(
    () => payments.filter((payment) => payment.status.trim().toUpperCase() === "PAID"),
    [payments],
  );
  const activeSubscriptions = useMemo(
    () =>
      payments.filter(
        (payment) =>
          payment.isSubscription &&
          payment.subscriptionStatus?.trim().toUpperCase() === "ACTIVE",
      ),
    [payments],
  );
  const totalPaid = useMemo(
    () => paidPayments.reduce((sum, payment) => sum + payment.amount, 0),
    [paidPayments],
  );

  return (
    <StudentShell activePath="/student/payments" topbarTitle="Payments">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>Paiements et factures</h1>
          <p className={styles.heroSub}>
            Suivez vos achats de formations, vos souscriptions actives et les
            factures generees par le backend.
          </p>
          {errorMessage ? (
            <p className={`${styles.heroSub} ${styles.messageError}`}>{errorMessage}</p>
          ) : null}
        </div>

        <div className={styles.actionRow}>
          <Link className={styles.ghostBtn} href="/formations">
            Voir les formations
          </Link>
          <Link className={styles.primaryBtn} href="/pricing">
            Gerer les packs
          </Link>
        </div>
      </section>

      <section className={styles.billingStatsGrid}>
        <article className={styles.billingCard}>
          <span className={styles.billingLabel}>Paiements total</span>
          <strong className={styles.billingValue}>{payments.length}</strong>
          <p className={styles.heroSub}>Toutes les transactions visibles dans votre espace.</p>
        </article>

        <article className={styles.billingCard}>
          <span className={styles.billingLabel}>Montant confirme</span>
          <strong className={styles.billingValue}>
            {formatCurrency(totalPaid, paidPayments[0]?.currency ?? "EUR")}
          </strong>
          <p className={styles.heroSub}>Somme des paiements confirmes et actives.</p>
        </article>

        <article className={styles.billingCard}>
          <span className={styles.billingLabel}>Souscriptions actives</span>
          <strong className={styles.billingValue}>{activeSubscriptions.length}</strong>
          <p className={styles.heroSub}>Packs recurrents actuellement actifs.</p>
        </article>

        <article className={styles.billingCard}>
          <span className={styles.billingLabel}>Factures</span>
          <strong className={styles.billingValue}>{invoices.length}</strong>
          <p className={styles.heroSub}>Documents comptables synchronises depuis les paiements.</p>
        </article>
      </section>

      <section className={styles.billingSplit}>
        <article className={styles.billingCard}>
          <div className={styles.billingHeader}>
            <div>
              <h2 className={styles.billingSectionTitle}>Historique des paiements</h2>
              <p className={styles.heroSub}>
                Chaque ligne correspond a une commande ou une souscription.
              </p>
            </div>
            <span className={styles.billingPill}>{payments.length} element(s)</span>
          </div>

          {isLoading ? (
            <p className={styles.heroSub}>Chargement de vos paiements...</p>
          ) : payments.length === 0 ? (
            <div className={styles.billingEmptyState}>
              <h3>Aucun paiement pour le moment</h3>
              <p>
                Lancez votre premiere souscription depuis le catalogue ou la page
                pricing pour voir l historique ici.
              </p>
            </div>
          ) : (
            <div className={styles.billingList}>
              {payments.map((payment) => (
                <article key={payment.id} className={styles.billingListItem}>
                  <div className={styles.billingListHeader}>
                    <div>
                      <strong>{payment.description ?? payment.reference}</strong>
                      <p className={styles.billingMeta}>
                        Reference {payment.reference} · Cree le{" "}
                        {formatDateLabel(payment.createdAt)}
                      </p>
                    </div>
                    <div className={styles.billingAmountWrap}>
                      <strong className={styles.billingAmount}>
                        {formatCurrency(payment.amount, payment.currency)}
                      </strong>
                      <span
                        className={`${styles.billingStatus} ${getPaymentStatusClassName(
                          payment.status,
                        )}`}
                      >
                        {formatStatusLabel(payment.status)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.billingMetaRow}>
                    <span>
                      Type:{" "}
                      {payment.isSubscription
                        ? `Pack ${payment.subscriptionPlanCode ?? "Premium"}`
                        : payment.course
                          ? `Formation ${payment.course.title}`
                          : "Paiement ponctuel"}
                    </span>
                    <span>
                      Confirme le {formatDateLabel(payment.paidAt)}
                    </span>
                    {payment.subscriptionStatus ? (
                      <span>
                        Statut abonnement: {formatStatusLabel(payment.subscriptionStatus)}
                      </span>
                    ) : null}
                  </div>

                  <div className={styles.actionRow}>
                    {payment.course ? (
                      <Link
                        className={styles.ghostBtn}
                        href={`/student/courses/${payment.course.slug}`}
                      >
                        Ouvrir la formation
                      </Link>
                    ) : (
                      <Link className={styles.ghostBtn} href="/pricing">
                        Voir le pack
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className={styles.billingCard}>
          <div className={styles.billingHeader}>
            <div>
              <h2 className={styles.billingSectionTitle}>Factures synchronisees</h2>
              <p className={styles.heroSub}>
                Les factures sont creees et mises a jour a partir des paiements backend.
              </p>
            </div>
            <span className={styles.billingPill}>{invoices.length} facture(s)</span>
          </div>

          {isLoading ? (
            <p className={styles.heroSub}>Chargement des factures...</p>
          ) : invoices.length === 0 ? (
            <div className={styles.billingEmptyState}>
              <h3>Aucune facture disponible</h3>
              <p>Les prochaines factures apparaitront ici des que vos paiements seront generes.</p>
            </div>
          ) : (
            <div className={styles.billingList}>
              {invoices.map((invoice) => (
                <article key={invoice.id} className={styles.billingListItem}>
                  <div className={styles.billingListHeader}>
                    <div>
                      <strong>Facture {invoice.number}</strong>
                      <p className={styles.billingMeta}>
                        Emise le {formatDateLabel(invoice.issuedAt ?? invoice.createdAt)}
                      </p>
                    </div>

                    <div className={styles.billingAmountWrap}>
                      <strong className={styles.billingAmount}>
                        {formatCurrency(invoice.totalTtc, invoice.currency)}
                      </strong>
                      <span
                        className={`${styles.billingStatus} ${getPaymentStatusClassName(
                          invoice.status,
                        )}`}
                      >
                        {formatStatusLabel(invoice.status)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.billingMetaRow}>
                    <span>HT: {formatCurrency(invoice.subtotalHt, invoice.currency)}</span>
                    <span>TVA: {formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                    <span>Fiscal: {formatStatusLabel(invoice.fiscalStatus)}</span>
                    {invoice.payment ? (
                      <span>Associe a {invoice.payment.reference}</span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
    </StudentShell>
  );
}
