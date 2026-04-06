import { AccountSecurityPanel } from "@/features/auth/ui/components/AccountSecurityPanel";
import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

export function AdminSettingsPage() {
  return (
    <AdminShell activePath="/admin/settings" title="Parametres du Systeme">
      <section className={styles.heroRow}>
        <div>
          <p className={styles.pageEyebrow}>System governance</p>
          <h1 className={styles.heroTitle}>Configuration Globale</h1>
          <p className={styles.heroSub}>
            Gerez l identite produit, la securite, les integrations et la continute de service
            depuis un tableau de configuration unique.
          </p>
        </div>
        <div className={styles.actionRow}>
          <button type="button" className={styles.ghostBtn}>
            Export Config
          </button>
          <button type="button" className={styles.primaryBtn}>
            Enregistrer
          </button>
        </div>
      </section>

      <section className={styles.settingsOverviewGrid}>
        <article className={styles.settingsOverviewCard}>
          <span>Brand integrity</span>
          <strong>Synced</strong>
          <p>Marketing shell, onboarding and dashboards are using the same design language.</p>
        </article>
        <article className={styles.settingsOverviewCard}>
          <span>Security posture</span>
          <strong>Protected</strong>
          <p>MFA is enforced and session expiry remains locked to a 30 minute inactivity rule.</p>
        </article>
        <article className={styles.settingsOverviewCard}>
          <span>Integrations</span>
          <strong>6 active</strong>
          <p>Payments, messaging, analytics and incident tooling are all currently online.</p>
        </article>
      </section>

      <section className={styles.settingsLayoutGrid}>
        <article className={styles.settingsFormPanel}>
          <div className={styles.settingsPanelHeader}>
            <div>
              <span className={styles.ticketOpsPill}>Brand system</span>
              <h2>Platform identity and editorial rules</h2>
            </div>
            <button type="button" className={styles.ghostBtn}>
              Preview Theme
            </button>
          </div>

          <div className={styles.settingsFieldGrid}>
            <label className={styles.settingsField}>
              <span>Platform name</span>
              <input className={styles.settingsInput} defaultValue="Architect Academy" />
            </label>
            <label className={styles.settingsField}>
              <span>Primary color</span>
              <input className={styles.settingsInput} defaultValue="#004AC6" />
            </label>
            <label className={styles.settingsField}>
              <span>Support email</span>
              <input className={styles.settingsInput} defaultValue="support@architectacademy.com" />
            </label>
            <label className={styles.settingsField}>
              <span>Operational timezone</span>
              <select className={styles.settingsInput} defaultValue="Africa/Casablanca">
                <option>Africa/Casablanca</option>
                <option>Europe/Paris</option>
                <option>UTC</option>
              </select>
            </label>
          </div>

          <label className={styles.settingsField}>
            <span>Maintenance banner message</span>
            <textarea
              className={styles.settingsTextarea}
              defaultValue="No maintenance window is currently planned. Platform services are operating normally."
            />
          </label>
        </article>

        <aside className={styles.securityStack}>
          <article className={styles.securityCard}>
            <span className={styles.ticketOpsPill}>Security controls</span>
            <h3>Authentication and access policy</h3>
            <div className={styles.integrationList}>
              <div className={styles.integrationRow}>
                <div>
                  <strong>Mandatory MFA</strong>
                  <p>Required for admin and teacher roles on every sign in.</p>
                </div>
                <span className={`${styles.adminToggle} ${styles.adminToggleOn}`} />
              </div>
              <div className={styles.integrationRow}>
                <div>
                  <strong>IP anomaly alerts</strong>
                  <p>Triggers a review when a high risk access pattern is detected.</p>
                </div>
                <span className={`${styles.adminToggle} ${styles.adminToggleOn}`} />
              </div>
              <div className={styles.integrationRow}>
                <div>
                  <strong>Public API sandbox</strong>
                  <p>Keeps staging credentials isolated from production content.</p>
                </div>
                <span className={styles.adminToggle} />
              </div>
            </div>
          </article>

          <article className={styles.securityCard}>
            <span className={styles.ticketOpsPill}>Service health</span>
            <h3>Maintenance and delivery posture</h3>
            <div className={styles.integrationList}>
              <div className={styles.integrationRow}>
                <div>
                  <strong>Maintenance mode</strong>
                  <p>Currently disabled. All learner and mentor flows remain available.</p>
                </div>
                <span className={styles.adminToggle} />
              </div>
              <div className={styles.integrationRow}>
                <div>
                  <strong>Status page sync</strong>
                  <p>Public incident summaries are publishing automatically.</p>
                </div>
                <span className={`${styles.adminToggle} ${styles.adminToggleOn}`} />
              </div>
            </div>
          </article>

          <AccountSecurityPanel
            description="Protect the administrative account, confirm verification state and rotate access across every privileged device."
            eyebrow="Administrative identity security"
            title="Control privileged authentication"
          />
        </aside>
      </section>
    </AdminShell>
  );
}
