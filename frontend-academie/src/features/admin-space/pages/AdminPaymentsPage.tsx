"use client";

import { useEffect, useMemo, useState } from "react";
import {
  confirmAdminPayment,
  fetchAdminPayments,
  refundAdminPayment,
} from "../admin-space.client";
import type { AdminWorkspacePaymentRecord } from "../admin-space.types";
import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusClass(status: string) {
  if (status === "PAID") {
    return styles.statusActive;
  }
  if (status === "PENDING") {
    return styles.statusPending;
  }
  if (status === "REFUNDED") {
    return styles.roleStudent;
  }
  return styles.statusSuspended;
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrencyGroups(payments: AdminWorkspacePaymentRecord[]) {
  const totals = payments.reduce<Record<string, number>>((accumulator, payment) => {
    const key = payment.currency || "EUR";
    accumulator[key] = (accumulator[key] ?? 0) + payment.amount;
    return accumulator;
  }, {});

  const entries = Object.entries(totals);
  if (entries.length === 0) {
    return "-";
  }

  return entries
    .map(([currency, amount]) => formatCurrency(amount, currency))
    .join(" / ");
}

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminWorkspacePaymentRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [savingPaymentId, setSavingPaymentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadPayments() {
      setLoading(true);

      try {
        const nextPayments = await fetchAdminPayments();
        if (!isActive) {
          return;
        }

        setPayments(nextPayments);
        setErrorMessage(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger les paiements.",
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadPayments();

    return () => {
      isActive = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const paidRevenue = payments
      .filter((payment) => payment.status === "PAID")
      .reduce<AdminWorkspacePaymentRecord[]>((sum, payment) => [...sum, payment], []);

    return {
      activeSubscriptions: payments.filter(
        (payment) => payment.isSubscription && payment.status === "PAID",
      ).length,
      disputes: payments.filter((payment) => payment.status === "REFUNDED").length,
      paidRevenue,
      pending: payments.filter((payment) => payment.status === "PENDING").length,
    };
  }, [payments]);

  const visiblePayments = useMemo(() => {
    return payments.filter((payment) => statusFilter === "ALL" || payment.status === statusFilter);
  }, [payments, statusFilter]);

  async function handleConfirm(payment: AdminWorkspacePaymentRecord) {
    setSavingPaymentId(payment.id);
    try {
      const updatedPayment = await confirmAdminPayment(payment.id);
      setPayments((current) =>
        current.map((item) => (item.id === payment.id ? updatedPayment : item)),
      );
      setErrorMessage(null);
      setSuccessMessage(`Le paiement ${payment.reference} a ete confirme.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de confirmer ce paiement.",
      );
      setSuccessMessage(null);
    } finally {
      setSavingPaymentId(null);
    }
  }

  async function handleRefund(payment: AdminWorkspacePaymentRecord) {
    let reason: string | undefined;

    if (typeof window !== "undefined") {
      const promptedReason = window.prompt(
        `Motif de remboursement pour ${payment.reference} (optionnel)`,
        "",
      );

      if (promptedReason === null) {
        return;
      }

      reason = promptedReason.trim() || undefined;
    }

    setSavingPaymentId(payment.id);
    try {
      const updatedPayment = await refundAdminPayment(payment.id, {
        amount: payment.amount,
        reason,
      });
      setPayments((current) =>
        current.map((item) => (item.id === payment.id ? updatedPayment : item)),
      );
      setErrorMessage(null);
      setSuccessMessage(`Le paiement ${payment.reference} a ete rembourse.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de rembourser ce paiement.",
      );
      setSuccessMessage(null);
    } finally {
      setSavingPaymentId(null);
    }
  }

  return (
    <AdminShell activePath="/admin/payments" title="Payments">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>Gestion des Paiements</h1>
          <p className={styles.heroSub}>
            Vision reelle des paiements cours et packs, avec suivi des souscriptions et statuts.
          </p>
          {errorMessage ? <p className={`${styles.heroSub} ${styles.messageError}`}>{errorMessage}</p> : null}
          {successMessage ? <p className={`${styles.heroSub} ${styles.messageSuccess}`}>{successMessage}</p> : null}
        </div>
        <div className={styles.actionRow}>
          <button type="button" className={styles.ghostBtn}>
            {loading ? "Chargement..." : `${metrics.pending} paiement(s) en attente`}
          </button>
          <button type="button" className={styles.primaryBtn}>
            {loading ? "..." : formatCurrencyGroups(metrics.paidRevenue)}
          </button>
        </div>
      </section>

      <section className={styles.grid4}>
        <article className={styles.kpi}>
          <p>Abonnements Actifs</p>
          <strong>{loading ? "..." : metrics.activeSubscriptions}</strong>
          <span>Souscriptions payees</span>
        </article>
        <article className={styles.kpi}>
          <p>Revenu confirme</p>
          <strong>{loading ? "..." : formatCurrencyGroups(metrics.paidRevenue)}</strong>
          <span>Somme des paiements payes</span>
        </article>
        <article className={styles.kpi}>
          <p>En attente</p>
          <strong>{loading ? "..." : metrics.pending}</strong>
          <span>Paiements a confirmer</span>
        </article>
        <article className={styles.kpi}>
          <p>Rembourses</p>
          <strong>{loading ? "..." : metrics.disputes}</strong>
          <span>Paiements refunded</span>
        </article>
      </section>

      <section className={styles.split}>
        <article className={styles.panel}>
          <header className={styles.panelHead}>
            <h3>Grand Livre des Transactions</h3>
            <select
              className={styles.settingsInput}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="FAILED">FAILED</option>
              <option value="REFUNDED">REFUNDED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </header>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Status</th>
                  <th>Produit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visiblePayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.reference}</td>
                    <td>{payment.userName ?? payment.userEmail ?? "Compte systeme"}</td>
                    <td>{formatDate(payment.paidAt ?? payment.createdAt)}</td>
                    <td>{formatCurrency(payment.amount, payment.currency)}</td>
                    <td>
                      <span className={`${styles.badge} ${statusClass(payment.status)}`}>
                        {payment.status}
                      </span>
                      {payment.provider ? (
                        <p className={styles.tableMeta}>via {payment.provider}</p>
                      ) : null}
                    </td>
                    <td>{payment.courseTitle ?? payment.subscriptionPlanCode ?? payment.description ?? "-"}</td>
                    <td>
                      <div className={styles.tableActions}>
                        {payment.status === "PENDING" ? (
                          <button
                            type="button"
                            className={styles.primaryBtn}
                            disabled={savingPaymentId === payment.id}
                            onClick={() => void handleConfirm(payment)}
                          >
                            Confirm
                          </button>
                        ) : null}
                        {payment.status === "PAID" ? (
                          <button
                            type="button"
                            className={styles.dangerBtn}
                            disabled={savingPaymentId === payment.id}
                            onClick={() => void handleRefund(payment)}
                          >
                            Refund
                          </button>
                        ) : null}
                        {payment.status !== "PENDING" && payment.status !== "PAID" ? (
                          <span className={styles.tableMeta}>Aucune action</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && visiblePayments.length === 0 ? (
                  <tr>
                    <td colSpan={7}>Aucun paiement enregistre.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <aside className={styles.stack}>
          <article className={styles.noteCard}>
            <h3>Flux a surveiller</h3>
            <p className={styles.heroSub}>
              {loading
                ? "Analyse des transactions..."
                : `${metrics.pending} paiement(s) pending et ${metrics.disputes} remboursement(s) necessitent une surveillance prioritaire.`}
            </p>
          </article>

          <article className={styles.health}>
            <h3>Mix Paiements</h3>
            <p className={styles.metricLead}>
              {payments.filter((payment) => payment.isSubscription).length} abonnements
            </p>
            <p className={styles.metricCaption}>
              {payments.filter((payment) => !payment.isSubscription).length} achats one-shot rattaches a des formations.
            </p>
          </article>
        </aside>
      </section>
    </AdminShell>
  );
}
