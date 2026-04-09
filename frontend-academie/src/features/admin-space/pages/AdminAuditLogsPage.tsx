"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAdminAuditLogs, fetchAdminHealth } from "../admin-space.client";
import type { AdminAuditLogRecord, AdminHealthRecord } from "../admin-space.types";
import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLogRecord[]>([]);
  const [health, setHealth] = useState<AdminHealthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadAuditData() {
      setLoading(true);

      try {
        const [nextLogs, nextHealth] = await Promise.all([
          fetchAdminAuditLogs(60),
          fetchAdminHealth(),
        ]);

        if (!isActive) {
          return;
        }

        setLogs(nextLogs);
        setHealth(nextHealth);
        setErrorMessage(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger l audit.",
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadAuditData();

    return () => {
      isActive = false;
    };
  }, []);

  const metrics = useMemo(() => {
    return {
      criticalLike: logs.filter(
        (log) =>
          log.action.toLowerCase().includes("delete") ||
          log.action.toLowerCase().includes("role") ||
          log.action.toLowerCase().includes("payment"),
      ).length,
      uniqueIps: new Set(logs.map((log) => log.ipAddress).filter(Boolean)).size,
      uniqueUsers: new Set(logs.map((log) => log.userId).filter(Boolean)).size,
    };
  }, [logs]);

  return (
    <AdminShell activePath="/admin/audit-logs" title="Audit Logs">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>Audit et Journaux de Securite</h1>
          <p className={styles.heroSub}>
            Trace reelle des actions admin, role changes et operations sensibles.
          </p>
          {errorMessage ? <p className={styles.heroSub}>{errorMessage}</p> : null}
        </div>
      </section>

      <section className={styles.grid4}>
        <article className={styles.kpi}>
          <p>Evenements charges</p>
          <strong>{loading ? "..." : logs.length}</strong>
          <span>Derniers logs d audit recuperes</span>
        </article>
        <article className={styles.kpi}>
          <p>Actions sensibles</p>
          <strong>{loading ? "..." : metrics.criticalLike}</strong>
          <span>Delete, role et payment dans la fenetre</span>
        </article>
        <article className={styles.kpi}>
          <p>Connexions IP</p>
          <strong>{loading ? "..." : metrics.uniqueIps}</strong>
          <span>Adresses distinctes observees</span>
        </article>
        <article className={styles.kpi}>
          <p>Status API</p>
          <strong>{loading ? "..." : health?.backendStatus ?? "unknown"}</strong>
          <span>Base {health?.databaseStatus ?? "unknown"}</span>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>IP</th>
                <th>Resource</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.createdAt)}</td>
                  <td>{log.userId ?? "SYSTEM"}</td>
                  <td>{log.action}</td>
                  <td>{log.ipAddress ?? "-"}</td>
                  <td>{log.resource}</td>
                  <td>{log.userAgent ?? JSON.stringify(log.metadata ?? {})}</td>
                </tr>
              ))}
              {!loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6}>Aucun journal d audit disponible.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <footer className={styles.footerRow}>
          <span>Affichage de {logs.length} evenement(s)</span>
          <span>{metrics.uniqueUsers} utilisateur(s) concernes</span>
        </footer>
      </section>
    </AdminShell>
  );
}
