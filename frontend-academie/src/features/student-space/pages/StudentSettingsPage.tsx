import styles from "../student-space.module.css";
import { StudentShell } from "../components/StudentShell";

export function StudentSettingsPage() {
  return (
    <StudentShell activePath="/student/settings" topbarTitle="Parametres">
      <section className={styles.heroRow}>
        <div>
          <p className={styles.pageEyebrow}>Personal configuration</p>
          <h1 className={styles.heroTitle}>Parametres de Compte</h1>
          <p className={styles.heroSub}>
            Gerez vos preferences personnelles, notifications, accessibilite et signaux de
            progression depuis un seul espace.
          </p>
        </div>

        <div className={styles.actionRow}>
          <button type="button" className={styles.ghostBtn}>
            Reset Preferences
          </button>
          <button type="button" className={styles.primaryBtn}>
            Save Changes
          </button>
        </div>
      </section>

      <section className={styles.settingsSummaryGrid}>
        <article className={styles.settingsSummaryCard}>
          <span>Profile completion</span>
          <strong>92%</strong>
          <p>Your public student profile is almost fully configured.</p>
        </article>
        <article className={styles.settingsSummaryCard}>
          <span>Notification channels</span>
          <strong>3 active</strong>
          <p>Course alerts and mentor updates are enabled.</p>
        </article>
        <article className={styles.settingsSummaryCard}>
          <span>Accessibility</span>
          <strong>1 adaptation</strong>
          <p>Reduced motion is currently active on this workspace.</p>
        </article>
      </section>

      <div className={styles.settingsGrid}>
        <article className={styles.settingsSectionCard}>
          <div className={styles.settingsSectionHead}>
            <div>
              <span className={styles.supportInsightLabel}>Profile data</span>
              <h2>Mon Profil</h2>
            </div>
            <button type="button" className={styles.ghostBtn}>
              Edit Profile
            </button>
          </div>

          <div className={styles.settingsProfileGrid}>
            <div className={styles.settingsFieldCard}>
              <span>Nom complet</span>
              <strong>Marc-Antoine Lefebvre</strong>
            </div>
            <div className={styles.settingsFieldCard}>
              <span>Specialite</span>
              <strong>Architecture Systemes et Cloud</strong>
            </div>
            <div className={styles.settingsFieldCard}>
              <span>Email</span>
              <strong>m.lefebvre@architect.edu</strong>
            </div>
            <div className={styles.settingsFieldCard}>
              <span>ID Etudiant</span>
              <strong>#ARCH-2024-9982</strong>
            </div>
          </div>
        </article>

        <article className={styles.settingsSectionCard}>
          <div className={styles.settingsSectionHead}>
            <div>
              <span className={styles.supportInsightLabel}>Notification routing</span>
              <h2>Notifications</h2>
            </div>
          </div>

          <div className={styles.preferenceList}>
            <div className={styles.preferenceRow}>
              <div className={styles.preferenceCopy}>
                <strong>Alertes de cours</strong>
                <p>Deadlines, module unlocks and important curriculum updates.</p>
              </div>
              <span className={`${styles.toggle} ${styles.toggleOn}`} />
            </div>
            <div className={styles.preferenceRow}>
              <div className={styles.preferenceCopy}>
                <strong>Mises a jour mentors</strong>
                <p>Feedback, review windows and mentor availability signals.</p>
              </div>
              <span className={`${styles.toggle} ${styles.toggleOn}`} />
            </div>
            <div className={styles.preferenceRow}>
              <div className={styles.preferenceCopy}>
                <strong>Newsletter</strong>
                <p>Monthly academy highlights, launches and editorial updates.</p>
              </div>
              <span className={styles.toggle} />
            </div>
          </div>
        </article>
      </div>

      <article className={styles.settingsSectionCard}>
        <div className={styles.settingsSectionHead}>
          <div>
            <span className={styles.supportInsightLabel}>Accessibility layer</span>
            <h2>Accessibilite</h2>
          </div>
        </div>

        <div className={styles.preferenceGrid}>
          <div className={styles.preferenceRowCard}>
            <div className={styles.preferenceCopy}>
              <strong>Mode sombre</strong>
              <p>Adjusts surfaces and contrast for low-light environments.</p>
            </div>
            <div className={styles.toggle} />
          </div>
          <div className={styles.preferenceRowCard}>
            <div className={styles.preferenceCopy}>
              <strong>Contraste eleve</strong>
              <p>Improves readability on controls, cards and text elements.</p>
            </div>
            <div className={styles.toggle} />
          </div>
          <div className={styles.preferenceRowCard}>
            <div className={styles.preferenceCopy}>
              <strong>Mouvement reduit</strong>
              <p>Softens transitions and removes distracting motion where possible.</p>
            </div>
            <div className={`${styles.toggle} ${styles.toggleOn}`} />
          </div>
          <div className={styles.preferenceRowCard}>
            <div className={styles.preferenceCopy}>
              <strong>Lecteur d ecran</strong>
              <p>Prioritises semantic reading support and clearer interface cues.</p>
            </div>
            <div className={styles.toggle} />
          </div>
        </div>
      </article>
    </StudentShell>
  );
}
