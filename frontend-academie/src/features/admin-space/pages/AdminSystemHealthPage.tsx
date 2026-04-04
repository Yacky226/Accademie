import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

export function AdminSystemHealthPage() {
  return (
    <AdminShell activePath="/admin/system-health" title="System Health">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>System Health Monitor</h1>
          <p className={styles.heroSub}>
            Observe infrastructure status, API latency and service availability.
          </p>
        </div>
        <div className={styles.actionRow}>
          <button type="button" className={styles.ghostBtn}>
            Export Metrics
          </button>
          <button type="button" className={styles.primaryBtn}>
            Run Diagnostic
          </button>
        </div>
      </section>

      <section className={styles.grid4}>
        <article className={styles.kpi}>
          <p>Global Uptime</p>
          <strong>99.98%</strong>
          <span>Last 30 days</span>
        </article>
        <article className={styles.kpi}>
          <p>API Latency P95</p>
          <strong>84ms</strong>
          <span>-6ms this week</span>
        </article>
        <article className={styles.kpi}>
          <p>Error Rate</p>
          <strong>0.21%</strong>
          <span>Stable</span>
        </article>
        <article className={styles.kpi}>
          <p>CPU Cluster Avg</p>
          <strong>44%</strong>
          <span>Within target</span>
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
                  <th>Latency</th>
                  <th>Region</th>
                  <th>Incidents</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>API Gateway</td>
                  <td>
                    <span className={`${styles.badge} ${styles.statusActive}`}>
                      Operational
                    </span>
                  </td>
                  <td>24ms</td>
                  <td>eu-west</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td>Auth Service</td>
                  <td>
                    <span className={`${styles.badge} ${styles.statusActive}`}>
                      Operational
                    </span>
                  </td>
                  <td>32ms</td>
                  <td>eu-west</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td>Video CDN</td>
                  <td>
                    <span className={`${styles.badge} ${styles.statusPending}`}>
                      Degraded
                    </span>
                  </td>
                  <td>182ms</td>
                  <td>global</td>
                  <td>1</td>
                </tr>
                <tr>
                  <td>Billing Processor</td>
                  <td>
                    <span className={`${styles.badge} ${styles.statusActive}`}>
                      Operational
                    </span>
                  </td>
                  <td>41ms</td>
                  <td>eu-central</td>
                  <td>0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <aside className={styles.stack}>
          <article className={styles.noteCard}>
            <h3>Open Incident</h3>
            <p className={styles.heroSub}>
              CDN edge nodes report elevated latency in two regions.
            </p>
          </article>
          <article className={styles.health}>
            <h3>Next Maintenance</h3>
            <p style={{ marginTop: 8, fontWeight: 700 }}>Sunday 02:00 UTC</p>
            <p style={{ marginTop: 6, opacity: 0.8, fontSize: "0.75rem" }}>
              Database patch and cache warm-up.
            </p>
          </article>
        </aside>
      </section>
    </AdminShell>
  );
}
