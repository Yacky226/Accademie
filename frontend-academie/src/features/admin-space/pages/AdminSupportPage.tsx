import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

export function AdminSupportPage() {
  return (
    <AdminShell activePath="/admin/support" title="Support Management">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>Support Command Center</h1>
          <p className={styles.heroSub}>
            Manage live tickets, article drafts and knowledge base.
          </p>
        </div>
        <div className={styles.actionRow}>
          <button type="button" className={styles.ghostBtn}>
            Article Editor
          </button>
          <button type="button" className={styles.primaryBtn}>
            New Ticket
          </button>
        </div>
      </section>

      <section className={styles.grid4}>
        <article className={styles.kpi}>
          <p>CSAT</p>
          <strong>4.82</strong>
          <span>1,204 reviews</span>
        </article>
        <article className={styles.kpi}>
          <p>Live Queue</p>
          <strong>14</strong>
          <span>3 waiting</span>
        </article>
        <article className={styles.kpi}>
          <p>Knowledge Views</p>
          <strong>42.8k</strong>
          <span>22.4% deflection</span>
        </article>
        <article className={styles.kpi}>
          <p>Critical Tickets</p>
          <strong>12</strong>
          <span>Need action now</span>
        </article>
      </section>

      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h3>Active Tickets</h3>
        </header>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Issue</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Response</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>#ARC-2094</td>
                <td>SSO Login Failure</td>
                <td>Urgent</td>
                <td>In Progress</td>
                <td>Marc S.</td>
                <td>12m</td>
              </tr>
              <tr>
                <td>#ARC-2088</td>
                <td>Refund request</td>
                <td>Medium</td>
                <td>Open</td>
                <td>Elena R.</td>
                <td>2h</td>
              </tr>
              <tr>
                <td>#ARC-2075</td>
                <td>Video stuttering</td>
                <td>Low</td>
                <td>On Hold</td>
                <td>Unassigned</td>
                <td>6h</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
