"use client";

import Link from "next/link";
import { useState } from "react";
import { useRegisterFormController } from "../../model/useRegisterFormController";
import { authSocialProviders } from "../auth-ui.content";
import styles from "../auth-ui.module.css";
import { SocialIcon } from "./SocialIcon";

const passwordStrengthToneClassMap = {
  idle: "",
  medium: styles.passwordStrengthBarMedium,
  strong: styles.passwordStrengthBarStrong,
  weak: styles.passwordStrengthBarWeak,
} as const;

export function RegisterFormCard() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { errorMessage, handleSubmit, isSubmitting, passwordStrength, updateField, values } =
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
          <div className={styles.fieldHeader}>
            <label className={styles.label} htmlFor="signup-password">
              Password
            </label>
            <button
              aria-controls="signup-password"
              aria-pressed={isPasswordVisible}
              className={styles.textLinkButton}
              onClick={() => setIsPasswordVisible((current) => !current)}
              type="button"
            >
              {isPasswordVisible ? "Hide password" : "Show password"}
            </button>
          </div>

          <div className={styles.passwordInputWrap}>
            <input
              className={styles.input}
              id="signup-password"
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Create a strong password"
              required
              type={isPasswordVisible ? "text" : "password"}
              value={values.password}
            />
          </div>

          <div
            aria-live="polite"
            className={styles.passwordStrength}
            role="status"
          >
            <div className={styles.passwordStrengthBars}>
              {Array.from({ length: 4 }, (_, index) => {
                const isActive = index < passwordStrength.activeBars;

                return (
                  <span
                    key={index}
                    className={[
                      styles.passwordStrengthBar,
                      isActive ? styles.passwordStrengthBarActive : "",
                      isActive ? passwordStrengthToneClassMap[passwordStrength.tone] : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                );
              })}
            </div>
            <span className={styles.passwordStrengthLabel}>{passwordStrength.label}</span>
          </div>
          <p className={styles.passwordStrengthHint}>{passwordStrength.hint}</p>
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
