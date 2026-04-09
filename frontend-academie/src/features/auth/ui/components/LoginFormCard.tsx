"use client";

import Link from "next/link";
import { useLoginFormController } from "../../model/useLoginFormController";
import { authSocialProviders } from "../auth-ui.content";
import styles from "../auth-ui.module.css";
import { SocialIcon } from "./SocialIcon";

export function LoginFormCard() {
  const {
    errorMessage,
    handleSubmit,
    isSubmitting,
    startSocialAuth,
    updateField,
    values,
  } =
    useLoginFormController();

  return (
    <article className={styles.authCard}>
      <div className={styles.formHeader}>
        <span className={styles.formEyebrow}>Student, mentor or admin</span>
        <h2 className={styles.formTitle}>Sign in to continue</h2>
        <p className={styles.formLead}>
          Access your dashboard, notifications, programs and settings from one secure entry.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-email">
            Email address
          </label>
          <input
            className={styles.input}
            id="login-email"
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="name@studio.com"
            required
            type="email"
            value={values.email}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHeader}>
            <label className={styles.label} htmlFor="login-password">
              Password
            </label>
            <Link className={styles.textLink} href="/auth/forgot-password">
              Forgot password?
            </Link>
          </div>
          <input
            className={styles.input}
            id="login-password"
            onChange={(event) => updateField("password", event.target.value)}
            placeholder="Enter your password"
            required
            type="password"
            value={values.password}
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

        <button className={styles.primaryButton} disabled={isSubmitting} type="submit">
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className={styles.divider}>
        <span>Or continue with</span>
      </div>

      <div className={styles.socialGrid}>
        {authSocialProviders.map((provider) => (
          <button
            key={provider.label}
            className={styles.socialButton}
            onClick={() => startSocialAuth(provider.provider)}
            type="button"
          >
            <span className={styles.socialIcon}>
              <SocialIcon icon={provider.icon} />
            </span>
            <span>{provider.label}</span>
          </button>
        ))}
      </div>

      <p className={styles.pageHint}>
        New here? <Link href="/auth/register">Create your account</Link>
      </p>
    </article>
  );
}
