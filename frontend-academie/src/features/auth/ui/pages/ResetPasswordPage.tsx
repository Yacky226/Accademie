"use client";

import Link from "next/link";
import styles from "../auth-ui.module.css";
import { useResetPasswordFormController } from "../../model/useResetPasswordFormController";
import { AuthShell } from "../components/AuthShell";

export function ResetPasswordPage() {
  const {
    errorMessage,
    handleSubmit,
    hasToken,
    isSubmitting,
    statusMessage,
    updateField,
    values,
  } = useResetPasswordFormController();

  return (
    <AuthShell
      description="Create a new password, re-establish a secure session and return to your workspace without restarting the whole onboarding flow."
      eyebrow="Password reset"
      headerActionHref="/auth/login"
      headerActionLabel="Back to login"
      highlights={[
        "Reset links are time-bound and tied to your current account state.",
        "Active sessions are rotated after the password changes.",
        "You can continue directly into the correct workspace after the reset.",
      ]}
      metrics={[
        { label: "Reset validity", value: "30 min" },
        { label: "Session rotation", value: "Enabled" },
        { label: "Security level", value: "High" },
      ]}
      spotlightDescription="Choose a fresh password and the platform will rotate your credentials before reopening access."
      spotlightLabel="Recovery checkpoint"
      spotlightTitle="Secure your account with a new password."
      title="Reset your password and continue safely."
    >
      <article className={styles.authCard}>
        <div className={styles.formHeader}>
          <span className={styles.formEyebrow}>New password</span>
          <h2 className={styles.formTitle}>Choose a secure replacement</h2>
          <p className={styles.formLead}>
            This reset link can only be used for a short time and will reopen your account with a
            fresh session.
          </p>
        </div>

        {!hasToken ? (
          <div className={styles.previewPanel}>
            <p className={styles.previewTitle}>Reset link missing</p>
            <p className={styles.previewCopy}>
              This page needs a valid reset token. Request a fresh link to continue.
            </p>
            <Link className={styles.secondaryButton} href="/auth/forgot-password">
              Request a new reset link
            </Link>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="reset-password">
                New password
              </label>
              <input
                className={styles.input}
                id="reset-password"
                onChange={(event) => updateField("password", event.target.value)}
                placeholder="Create a strong password"
                required
                type="password"
                value={values.password}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="reset-password-confirm">
                Confirm password
              </label>
              <input
                className={styles.input}
                id="reset-password-confirm"
                onChange={(event) => updateField("confirmPassword", event.target.value)}
                placeholder="Repeat the new password"
                required
                type="password"
                value={values.confirmPassword}
              />
            </div>

            <label className={styles.checkRow}>
              <input
                checked={values.rememberSession}
                className={styles.checkbox}
                onChange={(event) => updateField("rememberSession", event.target.checked)}
                type="checkbox"
              />
              <span className={styles.checkText}>Keep me signed in on this device</span>
            </label>

            {errorMessage ? <p className={styles.formNoticeError}>{errorMessage}</p> : null}
            {statusMessage ? <p className={styles.formNoticeSuccess}>{statusMessage}</p> : null}

            <button className={styles.primaryButton} disabled={isSubmitting} type="submit">
              {isSubmitting ? "Resetting password..." : "Reset password"}
            </button>
          </form>
        )}
      </article>
    </AuthShell>
  );
}
