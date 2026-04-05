import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

export function AdminSupportPage() {
  return (
    <AdminShell activePath="/admin/support" title="Support Management">
      <section className={styles.heroRow}>
        <div>
          <p className={styles.pageEyebrow}>Support operations</p>
          <h1 className={styles.heroTitle}>Support Command Center</h1>
          <p className={styles.heroSub}>
            Supervisez la file de tickets, la qualite de service et les parcours de resolution
            depuis un seul poste de pilotage.
          </p>
        </div>
        <div className={styles.actionRow}>
          <button type="button" className={styles.ghostBtn}>
            Knowledge Base
          </button>
          <button type="button" className={styles.primaryBtn}>
            Escalate Incident
          </button>
        </div>
      </section>

      <section className={styles.commandSummaryGrid}>
        <article className={styles.commandMetricCard}>
          <span>CSAT</span>
          <strong>4.82</strong>
          <p>1,204 reviews on the last 30 days with a stable upward trend.</p>
        </article>
        <article className={styles.commandMetricCard}>
          <span>Live queue</span>
          <strong>14</strong>
          <p>3 tickets are waiting and 11 are actively being processed now.</p>
        </article>
        <article className={styles.commandMetricCard}>
          <span>Knowledge views</span>
          <strong>42.8k</strong>
          <p>Self-service deflection is up 22.4% thanks to the new article flows.</p>
        </article>
        <article className={styles.commandMetricCard}>
          <span>Critical tickets</span>
          <strong>12</strong>
          <p>4 require platform coordination and 2 need executive visibility.</p>
        </article>
      </section>

      <section className={styles.ticketOpsLayout}>
        <article className={styles.ticketOpsPanel}>
          <div className={styles.ticketOpsHeader}>
            <div>
              <span className={styles.ticketOpsPill}>Live triage board</span>
              <h2>Active tickets by urgency and assignee</h2>
              <p>
                Watch response times, rebalance ownership and keep the escalation path visible for
                the most sensitive cases.
              </p>
            </div>
            <div className={styles.ticketStatusStrip}>
              <div>
                <strong>12m</strong>
                <span>fastest first reply</span>
              </div>
              <div>
                <strong>96.4%</strong>
                <span>SLA compliance</span>
              </div>
            </div>
          </div>

          <div className={styles.ticketTableCard}>
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
                  <tr>
                    <td>#ARC-2068</td>
                    <td>Mentor review not visible</td>
                    <td>High</td>
                    <td>Escalated</td>
                    <td>Ops Team</td>
                    <td>28m</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <aside className={styles.ticketQueue}>
          <article className={styles.ticketQueueCard}>
            <span className={styles.ticketOpsPill}>Escalation lane</span>
            <h3>Cases that need immediate attention</h3>
            <div className={styles.ticketQueueMeta}>
              <div>
                <strong>Billing outage</strong>
                <span>7 affected accounts · 18m ago</span>
              </div>
              <div>
                <strong>SSO degradation</strong>
                <span>Authentication team engaged · 24m ago</span>
              </div>
              <div>
                <strong>Content CDN lag</strong>
                <span>Video streaming variance detected · 39m ago</span>
              </div>
            </div>
          </article>

          <article className={styles.ticketQueueCard}>
            <span className={styles.ticketOpsPill}>Playbooks</span>
            <h3>Response templates currently recommended</h3>
            <div className={styles.ticketQueueMeta}>
              <div>
                <strong>Critical login issue</strong>
                <span>Use the security verification flow before reset.</span>
              </div>
              <div>
                <strong>Refund + billing complaint</strong>
                <span>Route through finance with premium retention note.</span>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </AdminShell>
  );
}
