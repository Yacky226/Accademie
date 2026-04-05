"use client";

import Link from "next/link";
import { authSocialProviders } from "../auth.data";
import styles from "../auth.module.css";
import { SocialIcon } from "./SocialIcon";
import { useRegisterFormController } from "../model/useRegisterFormController";

export function RegisterFormCard() {
  const { errorMessage, handleSubmit, isSubmitting, updateField, values } =
    useRegisterFormController();

  return (
    <article className={styles.authCard}>
      <div className={styles.formHeader}>
        <span className={styles.formEyebrow}>Fast account setup</span>
        <h2 className={styles.formTitle}>Create your account</h2>
        <p className={styles.formLead}>
          Start with a secure identity, then move directly into onboarding and workspace setup.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="signup-fullname">
              Full name
            </label>
            <input
              className={styles.input}
              id="signup-fullname"
              onChange={(event) => updateField("fullName", event.target.value)}
              placeholder="Alex Martin"
              required
              type="text"
              value={values.fullName}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="signup-role">
              Role
            </label>
            <select
              className={styles.input}
              id="signup-role"
              onChange={(event) => updateField("role", event.target.value as typeof values.role)}
              value={values.role}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="signup-email">
            Professional email
          </label>
          <input
            className={styles.input}
            id="signup-email"
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="contact@studio.com"
            required
            type="email"
            value={values.email}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="signup-password">
            Password
          </label>
          <input
            className={styles.input}
            id="signup-password"
            onChange={(event) => updateField("password", event.target.value)}
            placeholder="Create a strong password"
            required
            type="password"
            value={values.password}
          />

          <div className={styles.passwordStrength}>
            <span className={`${styles.passwordStrengthBar} ${styles.passwordStrengthBarActive}`} />
            <span className={`${styles.passwordStrengthBar} ${styles.passwordStrengthBarActive}`} />
            <span className={`${styles.passwordStrengthBar} ${styles.passwordStrengthBarActive}`} />
            <span className={styles.passwordStrengthBar} />
            <span className={styles.passwordStrengthLabel}>Strong</span>
          </div>
        </div>

        <label className={styles.checkRow}>
          <input
            checked={values.acceptTerms}
            className={styles.checkbox}
            onChange={(event) => updateField("acceptTerms", event.target.checked)}
            type="checkbox"
          />
          <span className={styles.checkText}>
            I agree to the <Link href="/about">platform terms</Link> and acknowledge the privacy
            guidelines.
          </span>
        </label>

        {errorMessage ? <p className={styles.formNoticeError}>{errorMessage}</p> : null}

        <button className={styles.primaryButton} disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating your account..." : "Create my account"}
        </button>
      </form>

      <div className={styles.divider}>
        <span>Or sign up with</span>
      </div>

      <div className={styles.socialGrid}>
        {authSocialProviders.map((provider) => (
          <button key={provider.label} className={styles.socialButton} type="button">
            <span className={styles.socialIcon}>
              <SocialIcon icon={provider.icon} />
            </span>
            <span>{provider.label}</span>
          </button>
        ))}
      </div>

      <p className={styles.pageHint}>
        Already have an account? <Link href="/auth/login">Sign in</Link>
      </p>
    </article>
  );
}
