import { adminDashboardKpis } from "../admin-space.data";
import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

const projectionBars = [40, 55, 45, 65, 75, 60, 85, 70, 75, 80, 90, 85];

export function AdminDashboardPage() {
  return (
    <AdminShell
      activePath="/admin/dashboard"
      title="Console de Gestion Globale"
    >
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>Console de Gestion Globale</h1>
          <p className={styles.heroSub}>
            Vue d ensemble de la performance operationnelle et de l integrite
            systemique.
          </p>
        </div>
        <div className={styles.actionRow}>
          <button type="button" className={styles.ghostBtn}>
            Exporter les donnees
          </button>
          <button type="button" className={styles.primaryBtn}>
            Nouvelle Analyse
          </button>
        </div>
      </section>

      <section className={styles.grid4}>
        {adminDashboardKpis.map((kpi) => (
          <article key={kpi.label} className={styles.kpi}>
            <p>{kpi.label}</p>
            <strong>{kpi.value}</strong>
            <span>{kpi.detail}</span>
          </article>
        ))}
      </section>

      <section className={styles.split}>
        <article className={styles.panel}>
          <header className={styles.panelHead}>
            <h3>Projections de Revenus</h3>
          </header>
          <div style={{ padding: "14px" }}>
            <div className={styles.bars}>
              {projectionBars.map((v, i) => (
                <span key={`${i + 1}-${v}`} style={{ height: `${v}%` }} />
              ))}
            </div>
          </div>
        </article>

        <aside className={styles.stack}>
          <article className={styles.health}>
            <h3>Moniteur de Sante</h3>
            <ul>
              <li>
                <span>API Gateway</span>
                <strong>24ms</strong>
              </li>
              <li>
                <span>Postgres</span>
                <strong>4.2k conn.</strong>
              </li>
              <li>
                <span>CDN S3</span>
                <strong>89.2%</strong>
              </li>
            </ul>
          </article>

          <article className={styles.noteCard}>
            <h3>Taches Urgentes</h3>
            <p className={styles.heroSub}>
              8 alertes critiques a traiter aujourd hui.
            </p>
          </article>
        </aside>
      </section>
    </AdminShell>
  );
}
