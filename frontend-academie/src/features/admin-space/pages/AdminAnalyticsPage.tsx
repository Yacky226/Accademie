import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

const retentionRows = [
  ["Jan 01", "2,410", "100%", "82%", "65%", "44%", "22%"],
  ["Jan 08", "2,150", "100%", "88%", "71%", "52%", "-"],
  ["Jan 15", "3,022", "100%", "91%", "74%", "-", "-"],
];

export function AdminAnalyticsPage() {
  return (
    <AdminShell activePath="/admin/analytics" title="Analytics">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>Institutional Performance</h1>
          <p className={styles.heroSub}>
            Real-time analytical ledger for Architect Academy.
          </p>
        </div>
      </section>

      <section className={styles.grid4}>
        <article className={styles.kpi}>
          <p>User Growth</p>
          <strong>124,802</strong>
          <span>+12.4% vs last month</span>
        </article>
        <article className={styles.kpi}>
          <p>Completion Rate</p>
          <strong>78.2%</strong>
          <span>+4.1% benchmark</span>
        </article>
        <article className={styles.kpi}>
          <p>Revenue / Course</p>
          <strong>$2,410</strong>
          <span>+$140 lift</span>
        </article>
        <article className={styles.kpi}>
          <p>Funnel Paid Tier</p>
          <strong>18%</strong>
          <span>Optimization needed</span>
        </article>
      </section>

      <section className={styles.split}>
        <article className={styles.panel}>
          <header className={styles.panelHead}>
            <h3>Cohort Retention Analysis</h3>
          </header>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cohort</th>
                  <th>Size</th>
                  <th>W1</th>
                  <th>W2</th>
                  <th>W4</th>
                  <th>W8</th>
                  <th>W12</th>
                </tr>
              </thead>
              <tbody>
                {retentionRows.map((r) => (
                  <tr key={r[0]}>
                    {r.map((c) => (
                      <td key={`${r[0]}-${c}`}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className={styles.noteCard}>
          <h3>Acquisition Funnel</h3>
          <p className={styles.heroSub}>
            14.2k signups to 7.6k trial to 1.4k paid.
          </p>
        </aside>
      </section>
    </AdminShell>
  );
}
