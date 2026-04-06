"use client";

import Link from "next/link";
import styles from "../auth-ui.module.css";
import { AuthShell } from "../components/AuthShell";
import { useForgotPasswordFormController } from "../../model/useForgotPasswordFormController";

export function ForgotPasswordPage() {
  const {
    email,
    errorMessage,
    handleSubmit,
    isSubmitting,
    previewUrl,
    statusMessage,
    updateEmail,
  } = useForgotPasswordFormController();

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

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="forgot-email">
              Email address
            </label>
            <input
              className={styles.input}
              id="forgot-email"
              onChange={(event) => updateEmail(event.target.value)}
              placeholder="name@academy.com"
              required
              type="email"
              value={email}
            />
          </div>

          {errorMessage ? <p className={styles.formNoticeError}>{errorMessage}</p> : null}
          {statusMessage ? <p className={styles.formNoticeSuccess}>{statusMessage}</p> : null}

          {previewUrl ? (
            <div className={styles.previewPanel}>
              <p className={styles.previewTitle}>Development preview</p>
              <p className={styles.previewCopy}>
                Open the generated reset link directly while the mailer is still local-only.
              </p>
              <Link className={styles.secondaryButton} href={previewUrl}>
                Open reset preview
              </Link>
            </div>
          ) : null}

          <button className={styles.primaryButton} disabled={isSubmitting} type="submit">
            {isSubmitting ? "Preparing link..." : "Send reset link"}
          </button>

          <Link className={styles.secondaryButton} href="/auth/login">
            Return to sign in
          </Link>
        </form>
      </article>
    </AuthShell>
  );
}
