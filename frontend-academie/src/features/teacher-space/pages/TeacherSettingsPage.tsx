import styles from "../teacher-space.module.css";
import { TeacherShell } from "../components/TeacherShell";

export function TeacherSettingsPage() {
  return (
    <TeacherShell activePath="/teacher/settings" title="Settings">
      <section className={styles.teacherSettingsHero}>
        <div>
          <p className={styles.teacherSettingsEyebrow}>Mentor configuration</p>
          <h2 className={styles.sectionTitle}>Teacher Settings</h2>
          <p className={styles.sectionSub}>
            Manage your teaching identity, learner communication and review workflow from one
            polished workspace.
          </p>
        </div>

        <div className={styles.teacherSettingsActions}>
          <button type="button" className={styles.ghostBtn}>
            Import Preset
          </button>
          <button type="button" className={styles.primaryBtn}>
            Save Changes
          </button>
        </div>
      </section>

      <section className={styles.teacherSettingsSummaryGrid}>
        <article className={styles.teacherSettingsSummaryCard}>
          <span>Profile completeness</span>
          <strong>94%</strong>
          <p>Your mentor profile is almost ready for public program pages and live sessions.</p>
        </article>
        <article className={styles.teacherSettingsSummaryCard}>
          <span>Notification channels</span>
          <strong>4 active</strong>
          <p>Session alerts, review deadlines and learner mentions are currently enabled.</p>
        </article>
        <article className={styles.teacherSettingsSummaryCard}>
          <span>Review automation</span>
          <strong>2 rules</strong>
          <p>Auto reminders and rubric templates are supporting your weekly correction flow.</p>
        </article>
      </section>

      <section className={styles.teacherSettingsLayout}>
        <div className={styles.teacherSettingsStack}>
          <article className={styles.teacherSettingsPanel}>
            <div className={styles.teacherSettingsPanelHead}>
              <div>
                <span className={styles.teacherSettingsPill}>Public mentor profile</span>
                <h3>Identity and teaching presence</h3>
              </div>
              <button type="button" className={styles.teacherSecondaryBtn}>
                Preview Card
              </button>
            </div>

            <div className={styles.teacherSettingsFieldGrid}>
              <div className={styles.teacherSettingsFieldCard}>
                <span>Full name</span>
                <strong>Sarah Jenkins</strong>
                <p>Visible on mentor cards, review queues and live classroom sessions.</p>
              </div>
              <div className={styles.teacherSettingsFieldCard}>
                <span>Specialty</span>
                <strong>Advanced Structural Systems</strong>
                <p>Displayed on course landing pages and learner recommendations.</p>
              </div>
              <div className={styles.teacherSettingsFieldCard}>
                <span>Timezone</span>
                <strong>Africa/Casablanca</strong>
                <p>Used to schedule reviews, office hours and calendar reminders accurately.</p>
              </div>
              <div className={styles.teacherSettingsFieldCard}>
                <span>Office hours</span>
                <strong>Mon, Wed, Fri · 18:00</strong>
                <p>Shared with learners when they request mentor guidance and live support.</p>
              </div>
            </div>
          </article>

          <article className={styles.teacherSettingsPanel}>
            <div className={styles.teacherSettingsPanelHead}>
              <div>
                <span className={styles.teacherSettingsPill}>Communication routing</span>
                <h3>Notifications and learner signals</h3>
              </div>
            </div>

            <div className={styles.teacherPreferenceList}>
              <div className={styles.teacherPreferenceRow}>
                <div className={styles.teacherPreferenceCopy}>
                  <strong>Session reminders</strong>
                  <p>Receive alerts before live classes, office hours and calendar changes.</p>
                </div>
                <span className={`${styles.teacherToggle} ${styles.teacherToggleOn}`} />
              </div>
              <div className={styles.teacherPreferenceRow}>
                <div className={styles.teacherPreferenceCopy}>
                  <strong>Learner mentions</strong>
                  <p>Be notified when students mention you in comments or project feedback.</p>
                </div>
                <span className={`${styles.teacherToggle} ${styles.teacherToggleOn}`} />
              </div>
              <div className={styles.teacherPreferenceRow}>
                <div className={styles.teacherPreferenceCopy}>
                  <strong>Weekly digest</strong>
                  <p>Get a summary of cohort progress, at-risk learners and session load.</p>
                </div>
                <span className={styles.teacherToggle} />
              </div>
            </div>
          </article>
        </div>

        <aside className={styles.teacherSettingsAside}>
          <article className={styles.teacherSettingsAsideCard}>
            <span className={styles.teacherSettingsPill}>Teaching workflow</span>
            <h3>Automation that keeps delivery smooth</h3>
            <div className={styles.teacherPreferenceList}>
              <div className={styles.teacherPreferenceRow}>
                <div className={styles.teacherPreferenceCopy}>
                  <strong>Rubric autofill</strong>
                  <p>Starts each review with your default grading framework and comments.</p>
                </div>
                <span className={`${styles.teacherToggle} ${styles.teacherToggleOn}`} />
              </div>
              <div className={styles.teacherPreferenceRow}>
                <div className={styles.teacherPreferenceCopy}>
                  <strong>Late submission nudges</strong>
                  <p>Automatically remind learners before review deadlines expire.</p>
                </div>
                <span className={`${styles.teacherToggle} ${styles.teacherToggleOn}`} />
              </div>
            </div>
          </article>

          <article className={styles.teacherSettingsAsideCard}>
            <span className={styles.teacherSettingsPill}>Support line</span>
            <h3>Workspace assistance</h3>
            <div className={styles.teacherSettingsMiniList}>
              <div>
                <strong>Priority support</strong>
                <span>Mentor operations team responds in under 4 business hours.</span>
              </div>
              <div>
                <strong>Content migration help</strong>
                <span>Move legacy lessons and resource packs into the new course shell.</span>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </TeacherShell>
  );
}
