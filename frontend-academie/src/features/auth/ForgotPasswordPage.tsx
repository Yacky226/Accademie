import Link from "next/link";
import styles from "./auth.module.css";
import { AuthShell } from "./components/AuthShell";

export function ForgotPasswordPage() {
  return (
    <AuthShell
      description="Recover access without friction and get back to your courses, reviews and live sessions quickly."
      eyebrow="Account recovery"
      headerActionHref="/auth/login"
      headerActionLabel="Back to login"
      highlights={[
        "Password resets are routed through your verified email address.",
        "Security controls protect access to dashboards, payments and review data.",
        "Recovery links are time-bound to keep your account protected.",
      ]}
      metrics={[
        { label: "Recovery success", value: "98.7%" },
        { label: "Average wait", value: "2 min" },
        { label: "Security checks", value: "2-step" },
      ]}
      spotlightDescription="Send a reset link to your inbox and continue from the same secure account once you are ready."
      spotlightLabel="Secure recovery lane"
      spotlightTitle="Reset your password without losing your progress."
      title="Get back into your workspace fast and safely."
    >
      <article className={styles.authCard}>
        <div className={styles.formHeader}>
          <span className={styles.formEyebrow}>Recovery flow</span>
          <h2 className={styles.formTitle}>Forgot your password?</h2>
          <p className={styles.formLead}>
            Enter your email and we will send a secure reset link to continue the session safely.
          </p>
        </div>

        <form className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="forgot-email">
              Email address
            </label>
            <input
              className={styles.input}
              id="forgot-email"
              placeholder="name@academy.com"
              required
              type="email"
            />
          </div>

          <button className={styles.primaryButton} type="submit">
            Send reset link
          </button>

          <Link className={styles.secondaryButton} href="/auth/login">
            Return to sign in
          </Link>
        </form>
      </article>
    </AuthShell>
  );
}
