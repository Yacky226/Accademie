import styles from "../student-space.module.css";
import { StudentShell } from "../components/StudentShell";

export function StudentSupportPage() {
  return (
    <StudentShell activePath="/student/support" topbarTitle="Support">
      <header>
        <h1 className={styles.heroTitle}>Submit a Support Ticket</h1>
        <p className={styles.heroSub}>
          Notre equipe support repond en general sous 2 a 4 heures ouvrees.
        </p>
      </header>

      <article className={styles.card} style={{ marginTop: 16 }}>
        <form className={styles.supportForm}>
          <label>
            <span className={styles.label}>Issue Subject</span>
            <input
              className={styles.input}
              placeholder="BIM Model Sync Error"
            />
          </label>

          <div className={styles.infoGrid}>
            <label>
              <span className={styles.label}>Category</span>
              <select className={styles.input} defaultValue="">
                <option value="" disabled>
                  Select an area of concern
                </option>
                <option>Technical Platform Issue</option>
                <option>Billing and Subscription</option>
                <option>Course Content</option>
              </select>
            </label>
            <div className={styles.infoItem}>
              <strong>Issue Reference ID</strong>
              <p style={{ marginTop: 6, color: "#004ac6", fontWeight: 700 }}>
                TICKET-AUTH-GEN
              </p>
            </div>
          </div>

          <label>
            <span className={styles.label}>Description</span>
            <textarea
              className={styles.textarea}
              placeholder="Please provide details..."
            />
          </label>

          <div className={styles.uploadZone}>
            Click to upload or drag and drop PNG, JPG or PDF.
          </div>

          <div className={styles.actionRow}>
            <button type="button" className={styles.ghostBtn}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryBtn}>
              Submit Ticket
            </button>
          </div>
        </form>
      </article>
    </StudentShell>
  );
}
