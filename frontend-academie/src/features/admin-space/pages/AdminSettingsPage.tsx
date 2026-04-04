import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

export function AdminSettingsPage() {
  return (
    <AdminShell activePath="/admin/settings" title="Parametres du Systeme">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>Configuration Globale</h1>
          <p className={styles.heroSub}>
            Gerez l identite visuelle, la securite et les integrations.
          </p>
        </div>
        <div className={styles.actionRow}>
          <button type="button" className={styles.ghostBtn}>
            Reinitialiser
          </button>
          <button type="button" className={styles.primaryBtn}>
            Enregistrer
          </button>
        </div>
      </section>

      <section className={styles.split}>
        <article className={styles.panel}>
          <header className={styles.panelHead}>
            <h3>Personnalisation</h3>
          </header>
          <div style={{ padding: "14px", display: "grid", gap: "12px" }}>
            <div className={styles.filterCard}>
              <label>Nom de la plateforme</label>
              <input defaultValue="Architect Academy" />
            </div>
            <div className={styles.filterCard}>
              <label>Couleur primaire</label>
              <input defaultValue="#004AC6" />
            </div>
          </div>
        </article>

        <aside className={styles.stack}>
          <article className={styles.noteCard}>
            <h3>Securite</h3>
            <p className={styles.heroSub}>
              MFA obligatoire et expiration session 30 min.
            </p>
          </article>
          <article className={styles.health}>
            <h3>Mode Maintenance</h3>
            <p style={{ marginTop: 8, opacity: 0.8, fontSize: "0.76rem" }}>
              Systeme en ligne.
            </p>
          </article>
        </aside>
      </section>
    </AdminShell>
  );
}
