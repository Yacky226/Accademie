"use client";

import { useEffect, useState } from "react";
import {
  fetchAdminAnalyticsOverview,
  fetchAdminHealth,
  fetchAdminSupportTickets,
} from "../admin-space.client";
import type {
  AdminAnalyticsOverviewRecord,
  AdminHealthRecord,
  AdminWorkspaceSupportTicketRecord,
} from "../admin-space.types";
import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

function healthBadgeClass(status: string) {
  if (status === "ok" || status === "up") {
    return styles.statusActive;
  }
  if (status === "degraded") {
    return styles.statusPending;
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

export function AdminSystemHealthPage() {
  const [health, setHealth] = useState<AdminHealthRecord | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalyticsOverviewRecord | null>(null);
  const [tickets, setTickets] = useState<AdminWorkspaceSupportTicketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadHealth() {
      setLoading(true);

      try {
        const [nextHealth, nextAnalytics, nextTickets] = await Promise.all([
          fetchAdminHealth(),
          fetchAdminAnalyticsOverview(),
          fetchAdminSupportTickets(),
        ]);

        if (!isActive) {
          return;
        }

        setHealth(nextHealth);
        setAnalytics(nextAnalytics);
        setTickets(nextTickets);
        setErrorMessage(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de verifier la sante du systeme.",
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadHealth();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <AdminShell activePath="/admin/system-health" title="System Health">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>System Health Monitor</h1>
          <p className={styles.heroSub}>
            Observation reelle de l etat frontend, backend, base de donnees et charge
            operationnelle.
          </p>
          {errorMessage ? <p className={`${styles.heroSub} ${styles.messageError}`}>{errorMessage}</p> : null}
        </div>
      </section>

      <section className={styles.grid4}>
        <article className={styles.kpi}>
          <p>Frontend</p>
          <strong>{loading ? "..." : health?.frontendStatus ?? "unknown"}</strong>
          <span>Route de sante Next.js</span>
        </article>
        <article className={styles.kpi}>
          <p>Backend</p>
          <strong>{loading ? "..." : health?.backendStatus ?? "unknown"}</strong>
          <span>API principale et endpoints admin</span>
        </article>
        <article className={styles.kpi}>
          <p>Database</p>
          <strong>{loading ? "..." : health?.databaseStatus ?? "unknown"}</strong>
          <span>Verification SQL directe</span>
        </article>
        <article className={styles.kpi}>
          <p>Last check</p>
          <strong>{loading ? "..." : formatDate(health?.checkedAt ?? null)}</strong>
          <span>Derniere verification centralisee</span>
        </article>
      </section>

      <section className={styles.split}>
        <article className={styles.panel}>
          <header className={styles.panelHead}>
            <h3>Service Status</h3>
          </header>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Signal</th>
                  <th>Region</th>
                  <th>Incidents</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Frontend shell</td>
                  <td>
                    <span className={`${styles.badge} ${healthBadgeClass(health?.frontendStatus ?? "unknown")}`}>
                      {health?.frontendStatus ?? "unknown"}
                    </span>
                  </td>
                  <td>Route /api/health</td>
                  <td>web</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td>Backend API</td>
                  <td>
                    <span className={`${styles.badge} ${healthBadgeClass(health?.backendStatus ?? "unknown")}`}>
                      {health?.backendStatus ?? "unknown"}
                    </span>
                  </td>
                  <td>Route /health</td>
                  <td>api</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td>Database</td>
                  <td>
                    <span className={`${styles.badge} ${healthBadgeClass(health?.databaseStatus ?? "unknown")}`}>
                      {health?.databaseStatus ?? "unknown"}
                    </span>
                  </td>
                  <td>SQL ping</td>
                  <td>db</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td>Support queue</td>
                  <td>
                    <span
                      className={`${styles.badge} ${healthBadgeClass(
                        tickets.filter((ticket) => ticket.status === "OPEN").length > 10
                          ? "degraded"
                          : "ok",
                      )}`}
                    >
                      {tickets.filter((ticket) => ticket.status === "OPEN").length > 10
                        ? "degraded"
                        : "ok"}
                    </span>
                  </td>
                  <td>{tickets.length} tickets</td>
                  <td>ops</td>
                  <td>{tickets.filter((ticket) => ticket.status === "OPEN").length}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <aside className={styles.stack}>
          <article className={styles.noteCard}>
            <h3>Open Incident</h3>
            <p className={styles.heroSub}>
              {loading
                ? "Analyse en cours..."
                : `La plateforme compte ${analytics?.usersActive ?? 0} utilisateur(s) actifs, ${analytics?.notificationsTotal ?? 0} notifications et ${tickets.filter((ticket) => ticket.status === "OPEN").length} ticket(s) ouverts a surveiller.`}
            </p>
          </article>
          <article className={styles.health}>
            <h3>Operational load</h3>
            <p className={styles.metricLead}>
              {loading ? "..." : `${analytics?.coursesPublished ?? 0} cours publies`}
            </p>
            <p className={styles.metricCaption}>
              {loading ? "..." : `${analytics?.enrollmentsTotal ?? 0} inscriptions et ${analytics?.submissionsTotal ?? 0} soumissions suivent actuellement l activite.`}
            </p>
          </article>
        </aside>
      </section>
    </AdminShell>
  );
}
