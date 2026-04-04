import { adminTransactions } from "../admin-space.data";
import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

function statusClass(status: string) {
  if (status === "Paid") return styles.statusActive;
  if (status === "Pending") return styles.statusPending;
  if (status === "Refunded") return styles.roleStudent;
  return styles.statusSuspended;
}

export function AdminPaymentsPage() {
  return (
    <AdminShell activePath="/admin/payments" title="Payments">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>Gestion des Paiements</h1>
          <p className={styles.heroSub}>
            Surveillez les flux de tresorerie et les litiges.
          </p>
        </div>
        <div className={styles.actionRow}>
          <button type="button" className={styles.ghostBtn}>
            Exporter CSV
          </button>
          <button type="button" className={styles.primaryBtn}>
            Nouvelle Facture
          </button>
        </div>
      </section>

      <section className={styles.grid4}>
        <article className={styles.kpi}>
          <p>Abonnements Actifs</p>
          <strong>14,282</strong>
          <span>+12.4%</span>
        </article>
        <article className={styles.kpi}>
          <p>MRR</p>
          <strong>428,500 EUR</strong>
          <span>+8.2%</span>
        </article>
        <article className={styles.kpi}>
          <p>Churn</p>
          <strong>1.8%</strong>
          <span>Derniers 30 jours</span>
        </article>
        <article className={styles.kpi}>
          <p>Litiges Ouverts</p>
          <strong>3</strong>
          <span>Action requise</span>
        </article>
      </section>

      <section className={styles.split}>
        <article className={styles.panel}>
          <header className={styles.panelHead}>
            <h3>Grand Livre des Transactions</h3>
          </header>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {adminTransactions.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.client}</td>
                    <td>{row.date}</td>
                    <td>{row.amount}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${statusClass(row.status)}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <button type="button" className={styles.ghostBtn}>
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className={styles.stack}>
          <article className={styles.noteCard}>
            <h3>Litiges et Remboursements</h3>
            <p className={styles.heroSub}>3 actions en attente.</p>
            <div className={styles.actionRow} style={{ marginTop: 10 }}>
              <button type="button" className={styles.ghostBtn}>
                Voir preuves
              </button>
              <button type="button" className={styles.primaryBtn}>
                Accepter
              </button>
            </div>
          </article>

          <article className={styles.health}>
            <h3>Provision de Risque</h3>
            <p
              style={{ margin: "8px 0 0", fontSize: "1.4rem", fontWeight: 800 }}
            >
              12,400.00 EUR
            </p>
            <p style={{ marginTop: 8, opacity: 0.75, fontSize: "0.75rem" }}>
              75% reserve pour litiges potentiels.
            </p>
          </article>
        </aside>
      </section>
    </AdminShell>
  );
}
