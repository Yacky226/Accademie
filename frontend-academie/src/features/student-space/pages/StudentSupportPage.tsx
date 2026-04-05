import styles from "../student-space.module.css";
import { StudentShell } from "../components/StudentShell";

export function StudentSupportPage() {
  return (
    <StudentShell activePath="/student/support" topbarTitle="Support">
      <section className={styles.heroRow}>
        <div>
          <p className={styles.pageEyebrow}>Student support</p>
          <h1 className={styles.heroTitle}>Submit a Support Ticket</h1>
          <p className={styles.heroSub}>
            Notre equipe support repond en general sous 2 a 4 heures ouvrees avec un suivi clair
            jusqu a resolution.
          </p>
        </div>

        <div className={styles.actionRow}>
          <button type="button" className={styles.ghostBtn}>
            Help Center
          </button>
          <button type="button" className={styles.primaryBtn}>
            Start Live Chat
          </button>
        </div>
      </section>

      <section className={styles.supportLayout}>
        <article className={styles.supportPanel}>
          <div className={styles.supportPanelHead}>
            <div>
              <span className={styles.supportPill}>Ticket composer</span>
              <h2>Describe the issue with enough context for a fast resolution.</h2>
              <p>
                Add the right category, attach context if needed and we will route the ticket to
                the best team immediately.
              </p>
            </div>
            <div className={styles.supportStatusCard}>
              <span>Average first reply</span>
              <strong>2h 14m</strong>
              <small>Priority support active for your current program.</small>
            </div>
          </div>

          <form className={styles.supportFormModern}>
            <div className={styles.supportFieldGrid}>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Issue Subject</span>
                <input
                  className={styles.input}
                  placeholder="BIM Model Sync Error"
                />
              </label>

              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Category</span>
                <select className={styles.input} defaultValue="">
                  <option value="" disabled>
                    Select an area of concern
                  </option>
                  <option>Technical Platform Issue</option>
                  <option>Billing and Subscription</option>
                  <option>Course Content</option>
                </select>
              </label>
            </div>

            <div className={styles.supportInsightGrid}>
              <article className={styles.supportInsightCard}>
                <span className={styles.supportInsightLabel}>Reference ID</span>
                <strong>TICKET-AUTH-GEN</strong>
                <p>Use this ID when following up with the mentor or billing team.</p>
              </article>
              <article className={styles.supportInsightCard}>
                <span className={styles.supportInsightLabel}>Routing</span>
                <strong>Platform Operations</strong>
                <p>Your current selection sends this request to the technical squad first.</p>
              </article>
            </div>

            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Description</span>
              <textarea
                className={styles.textarea}
                placeholder="Explain what happened, what you expected and how we can reproduce the issue."
              />
            </label>

            <div className={styles.supportUploadPanel}>
              <div>
                <span className={styles.supportInsightLabel}>Attachments</span>
                <h3>Add screenshots or error exports</h3>
                <p>PNG, JPG or PDF. Add logs, receipts or a screen capture if it speeds things up.</p>
              </div>
              <div className={styles.uploadZone}>
                Click to upload or drag and drop PNG, JPG or PDF.
              </div>
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

        <aside className={styles.supportAside}>
          <article className={styles.supportAsideCard}>
            <span className={styles.supportInsightLabel}>Priority lane</span>
            <h3>What helps us solve your ticket faster</h3>
            <ul className={styles.supportChecklist}>
              <li>State the exact course, lesson or screen where the issue appears.</li>
              <li>Mention whether the issue blocks your progression or only slows it down.</li>
              <li>Attach any message, screenshot or payment reference you already have.</li>
            </ul>
          </article>

          <article className={styles.supportAsideCard}>
            <span className={styles.supportInsightLabel}>Service level</span>
            <h3>Current response commitments</h3>
            <div className={styles.supportMetricList}>
              <div>
                <strong>&lt; 4h</strong>
                <span>Billing and account access</span>
              </div>
              <div>
                <strong>&lt; 8h</strong>
                <span>Learning content and module issues</span>
              </div>
              <div>
                <strong>&lt; 2h</strong>
                <span>Critical platform incidents</span>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </StudentShell>
  );
}
