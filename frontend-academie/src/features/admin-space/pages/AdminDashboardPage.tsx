"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminAnalyticsActivity,
  fetchAdminAnalyticsOverview,
  fetchAdminHealth,
  fetchAdminOverview,
} from "../admin-space.client";
import type {
  AdminAnalyticsActivityRecord,
  AdminAnalyticsOverviewRecord,
  AdminHealthRecord,
  AdminOverviewRecord,
} from "../admin-space.types";
import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

export function AdminDashboardPage() {
  const [overview, setOverview] = useState<AdminOverviewRecord | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalyticsOverviewRecord | null>(null);
  const [activity, setActivity] = useState<AdminAnalyticsActivityRecord | null>(null);
  const [health, setHealth] = useState<AdminHealthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      setLoading(true);

      try {
        const [nextOverview, nextAnalytics, nextActivity, nextHealth] = await Promise.all([
          fetchAdminOverview(),
          fetchAdminAnalyticsOverview(),
          fetchAdminAnalyticsActivity(),
          fetchAdminHealth(),
        ]);

        if (!isActive) {
          return;
        }

        setOverview(nextOverview);
        setAnalytics(nextAnalytics);
        setActivity(nextActivity);
        setHealth(nextHealth);
        setErrorMessage(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger le dashboard admin.",
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isActive = false;
    };
  }, []);

  const projectionBars = useMemo(() => {
    if (!activity) {
      return [20, 35, 30, 45, 40, 50];
    }

    const source = [
      activity.newUsers,
      activity.newEnrollments,
      activity.submissionsCreated,
      activity.evaluationAttemptsStarted,
      activity.notificationsSent,
      activity.newUsers + activity.newEnrollments,
    ];
    const max = Math.max(...source, 1);

    return source.map((value) => Math.max(18, Math.round((value / max) * 100)));
  }, [activity]);

  return (
    <AdminShell activePath="/admin/dashboard" title="Console de Gestion Globale">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>Console de Gestion Globale</h1>
          <p className={styles.heroSub}>
            Le pilotage admin est maintenant branche sur les vraies donnees utilisateurs, cours,
            paiements et activite produit.
          </p>
          {errorMessage ? <p className={`${styles.heroSub} ${styles.messageError}`}>{errorMessage}</p> : null}
        </div>
        <div className={styles.actionRow}>
          <button type="button" className={styles.ghostBtn}>
            {loading ? "Chargement..." : "Vue synchronisee"}
          </button>
          <button type="button" className={styles.primaryBtn}>
            Supervision active
          </button>
        </div>
      </section>

      <section className={styles.grid4}>
        <article className={styles.kpi}>
          <p>Utilisateurs actifs</p>
          <strong>{loading ? "..." : formatNumber(analytics?.usersActive ?? 0)}</strong>
          <span>{loading ? "Calcul en cours" : `${formatNumber(analytics?.usersTotal ?? 0)} comptes au total`}</span>
        </article>
        <article className={styles.kpi}>
          <p>Inscriptions cours</p>
          <strong>{loading ? "..." : formatNumber(analytics?.enrollmentsTotal ?? 0)}</strong>
          <span>{loading ? "Calcul en cours" : `${formatNumber(analytics?.coursesPublished ?? 0)} cours publies`}</span>
        </article>
        <article className={styles.kpi}>
          <p>Validations en attente</p>
          <strong>{loading ? "..." : formatNumber(overview?.usersPendingApproval ?? 0)}</strong>
          <span>{loading ? "Calcul en cours" : `${formatNumber(overview?.coursesDraft ?? 0)} cours en brouillon`}</span>
        </article>
        <article className={styles.kpi}>
          <p>Sante plateforme</p>
          <strong>{loading ? "..." : health?.backendStatus ?? "unknown"}</strong>
          <span>
            {loading
              ? "Verification en cours"
              : `frontend ${health?.frontendStatus ?? "unknown"} - db ${health?.databaseStatus ?? "unknown"}`}
          </span>
        </article>
      </section>

      <section className={styles.split}>
        <article className={styles.panel}>
          <header className={styles.panelHead}>
            <h3>Projection d activite recente</h3>
          </header>
          <div className={styles.panelBody}>
            <div className={styles.bars}>
              {projectionBars.map((value, index) => (
                <span key={`${index + 1}-${value}`} style={{ height: `${value}%` }} />
              ))}
            </div>
            {activity ? (
              <p className={`${styles.heroSub} ${styles.chartCaption}`}>
                Sur {activity.periodDays} jours: {formatNumber(activity.newUsers)} nouveaux comptes,{" "}
                {formatNumber(activity.newEnrollments)} nouvelles inscriptions et{" "}
                {formatNumber(activity.notificationsSent)} notifications envoyees.
              </p>
            ) : null}
          </div>
        </article>

        <aside className={styles.stack}>
          <article className={styles.health}>
            <h3>Moniteur de Sante</h3>
            <ul>
              <li>
                <span>Frontend</span>
                <strong>{health?.frontendStatus ?? "..."}</strong>
              </li>
              <li>
                <span>Backend API</span>
                <strong>{health?.backendStatus ?? "..."}</strong>
              </li>
              <li>
                <span>Base de donnees</span>
                <strong>{health?.databaseStatus ?? "..."}</strong>
              </li>
            </ul>
          </article>

          <article className={styles.noteCard}>
            <h3>Taches Urgentes</h3>
            <p className={styles.heroSub}>
              {loading
                ? "Analyse des signaux..."
                : `${formatNumber(overview?.usersSuspended ?? 0)} comptes suspendus, ${formatNumber(overview?.evaluationsDraft ?? 0)} evaluations en brouillon et ${formatNumber(overview?.announcementsDraft ?? 0)} annonces non publiees.`}
            </p>
          </article>
        </aside>
      </section>
    </AdminShell>
  );
}
