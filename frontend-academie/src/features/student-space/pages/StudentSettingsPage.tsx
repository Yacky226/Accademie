import styles from "../student-space.module.css";
import { StudentShell } from "../components/StudentShell";

export function StudentSettingsPage() {
  return (
    <StudentShell activePath="/student/settings" topbarTitle="Parametres">
      <header>
        <h1 className={styles.heroTitle}>Parametres de Compte</h1>
        <p className={styles.heroSub}>
          Gerez vos preferences personnelles, notifications et accessibilite.
        </p>
      </header>

      <div className={styles.settingsGrid}>
        <article className={styles.card}>
          <h3>Mon Profil</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <strong>Nom Complet</strong>
              <p>Marc-Antoine Lefebvre</p>
            </div>
            <div className={styles.infoItem}>
              <strong>Specialite</strong>
              <p>Architecture Systemes et Cloud</p>
            </div>
            <div className={styles.infoItem}>
              <strong>Email</strong>
              <p>m.lefebvre@architect.edu</p>
            </div>
            <div className={styles.infoItem}>
              <strong>ID Etudiant</strong>
              <p>#ARCH-2024-9982</p>
            </div>
          </div>
        </article>

        <article className={styles.card}>
          <h3>Notifications</h3>
          <div className={styles.timeline}>
            <div className={styles.timelineItem}>
              <span>Alertes de cours</span>
              <span className={`${styles.toggle} ${styles.toggleOn}`} />
            </div>
            <div className={styles.timelineItem}>
              <span>Mises a jour mentors</span>
              <span className={`${styles.toggle} ${styles.toggleOn}`} />
            </div>
            <div className={styles.timelineItem}>
              <span>Newsletter</span>
              <span className={styles.toggle} />
            </div>
          </div>
        </article>
      </div>

      <article className={styles.card} style={{ marginTop: 18 }}>
        <h3>Accessibilite</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <strong>Mode sombre</strong>
            <div className={styles.toggle} />
          </div>
          <div className={styles.infoItem}>
            <strong>Contraste eleve</strong>
            <div className={styles.toggle} />
          </div>
          <div className={styles.infoItem}>
            <strong>Mouvement reduit</strong>
            <div className={`${styles.toggle} ${styles.toggleOn}`} />
          </div>
          <div className={styles.infoItem}>
            <strong>Lecteur d ecran</strong>
            <div className={styles.toggle} />
          </div>
        </div>
      </article>
    </StudentShell>
  );
}
