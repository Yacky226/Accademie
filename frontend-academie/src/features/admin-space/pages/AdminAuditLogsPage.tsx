import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

export function AdminAuditLogsPage() {
  return (
    <AdminShell activePath="/admin/audit-logs" title="Audit Logs">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>Audit et Journaux de Securite</h1>
          <p className={styles.heroSub}>
            Surveillance des acces, privileges et transactions critiques.
          </p>
        </div>
        <div className={styles.actionRow}>
          <button type="button" className={styles.ghostBtn}>
            Exporter
          </button>
          <button type="button" className={styles.primaryBtn}>
            Filtres avances
          </button>
        </div>
      </section>

      <section className={styles.grid4}>
        <article className={styles.kpi}>
          <p>Alertes Critiques</p>
          <strong>12</strong>
          <span>+4% vs hier</span>
        </article>
        <article className={styles.kpi}>
          <p>Actions Systeme</p>
          <strong>1,482</strong>
          <span>24h</span>
        </article>
        <article className={styles.kpi}>
          <p>Connexions Uniques</p>
          <strong>89</strong>
          <span>Session secure</span>
        </article>
        <article className={styles.kpi}>
          <p>Status API</p>
          <strong>OPERATIONNEL</strong>
          <span>Live</span>
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
                <th>Severity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2023-11-24 14:32:01</td>
                <td>Jean Dupont</td>
                <td>User Role Changed</td>
                <td>192.168.1.45</td>
                <td>WARNING</td>
                <td>Examiner</td>
              </tr>
              <tr>
                <td>2023-11-24 14:30:44</td>
                <td>SYSTEM</td>
                <td>API Key Generated</td>
                <td>127.0.0.1</td>
                <td>INFO</td>
                <td>Examiner</td>
              </tr>
              <tr>
                <td>2023-11-24 14:28:12</td>
                <td>Marie Leroy</td>
                <td>Manual Payment Override</td>
                <td>45.22.10.192</td>
                <td>CRITICAL</td>
                <td>ALERTE</td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer className={styles.footerRow}>
          <span>Affichage de 1-3 sur 14,821</span>
          <span>Page 1 / 296</span>
        </footer>
      </section>
    </AdminShell>
  );
}
