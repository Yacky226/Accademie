"use client";

import { useEffect, useState } from "react";
import {
  fetchAdminAnalyticsActivity,
  fetchAdminAnalyticsOverview,
} from "../admin-space.client";
import type {
  AdminAnalyticsActivityRecord,
  AdminAnalyticsOverviewRecord,
} from "../admin-space.types";
import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

export function AdminAnalyticsPage() {
  const [overview, setOverview] = useState<AdminAnalyticsOverviewRecord | null>(null);
  const [activity, setActivity] = useState<AdminAnalyticsActivityRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadAnalytics() {
      setLoading(true);

      try {
        const [nextOverview, nextActivity] = await Promise.all([
          fetchAdminAnalyticsOverview(),
          fetchAdminAnalyticsActivity(),
        ]);

        if (!isActive) {
          return;
        }

        setOverview(nextOverview);
        setActivity(nextActivity);
        setErrorMessage(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger les analytics.",
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadAnalytics();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <AdminShell activePath="/admin/analytics" title="Analytics">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>Institutional Performance</h1>
          <p className={styles.heroSub}>
            Les indicateurs ci-dessous sont calcules depuis les modules utilisateurs, cours,
            programmes, evaluations et notifications.
          </p>
          {errorMessage ? <p className={styles.heroSub}>{errorMessage}</p> : null}
        </div>
      </section>

      <section className={styles.grid4}>
        <article className={styles.kpi}>
          <p>User Growth</p>
          <strong>{loading ? "..." : formatNumber(overview?.usersTotal ?? 0)}</strong>
          <span>{loading ? "Chargement..." : `${formatNumber(activity?.newUsers ?? 0)} nouveaux comptes sur ${activity?.periodDays ?? 30} jours`}</span>
        </article>
        <article className={styles.kpi}>
          <p>Completion Signals</p>
          <strong>{loading ? "..." : formatNumber(overview?.gradesTotal ?? 0)}</strong>
          <span>Total des notes publiees</span>
        </article>
        <article className={styles.kpi}>
          <p>Programs + Courses</p>
          <strong>{loading ? "..." : formatNumber((overview?.programsTotal ?? 0) + (overview?.coursesTotal ?? 0))}</strong>
          <span>Programmes et formations suivis</span>
        </article>
        <article className={styles.kpi}>
          <p>Notifications Sent</p>
          <strong>{loading ? "..." : formatNumber(activity?.notificationsSent ?? 0)}</strong>
          <span>Sur la fenetre d activite courante</span>
        </article>
      </section>

      <section className={styles.split}>
        <article className={styles.panel}>
          <header className={styles.panelHead}>
            <h3>Operational activity snapshot</h3>
          </header>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Current Value</th>
                  <th>Interpretation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Nouveaux utilisateurs</td>
                  <td>{loading ? "..." : formatNumber(activity?.newUsers ?? 0)}</td>
                  <td>Comptes crees sur la periode analysee</td>
                </tr>
                <tr>
                  <td>Nouvelles inscriptions</td>
                  <td>{loading ? "..." : formatNumber(activity?.newEnrollments ?? 0)}</td>
                  <td>Inscription a des formations sur la meme periode</td>
                </tr>
                <tr>
                  <td>Soumissions code</td>
                  <td>{loading ? "..." : formatNumber(activity?.submissionsCreated ?? 0)}</td>
                  <td>Activite pratique sur les espaces apprenants</td>
                </tr>
                <tr>
                  <td>Tentatives d evaluation</td>
                  <td>{loading ? "..." : formatNumber(activity?.evaluationAttemptsStarted ?? 0)}</td>
                  <td>Signal direct d engagement pedagogique</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <aside className={styles.noteCard}>
          <h3>Acquisition Funnel</h3>
          <p className={styles.heroSub}>
            {loading
              ? "Calcul en cours..."
              : `${formatNumber(overview?.usersTotal ?? 0)} utilisateurs, ${formatNumber(overview?.enrollmentsTotal ?? 0)} inscriptions, ${formatNumber(overview?.submissionsTotal ?? 0)} soumissions et ${formatNumber(overview?.notificationsTotal ?? 0)} notifications tracees.`}
          </p>
        </aside>
      </section>
    </AdminShell>
  );
}
