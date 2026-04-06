"use client";

import Link from "next/link";
import styles from "../auth-ui.module.css";
import { AuthShell } from "../components/AuthShell";
import { useEmailVerificationController } from "../../model/useEmailVerificationController";

export function VerificationPage() {
  const {
    email,
    emailVerified,
    errorMessage,
    handleRequestLink,
    handleVerify,
    hasToken,
    isAuthenticated,
    isRequestingLink,
    isVerifying,
    previewUrl,
    redirectTarget,
    statusMessage,
    updateEmail,
  } = useEmailVerificationController();

  return (
    <AuthShell
      description="Complete the secure handoff, verify your account and unlock the full academy experience."
      eyebrow="Verification checkpoint"
      headerActionHref="/contact"
      headerActionLabel="Need help?"
      highlights={[
        "Verification protects access to course history, review queues and payment controls.",
        "Codes expire quickly to keep your identity layer secure.",
        "Support can help if your inbox delays or filters the message.",
      ]}
      metrics={[
        { label: "Verification window", value: "2 min" },
        { label: "Protection level", value: "High" },
        { label: "Delivery status", value: "Sent" },
      ]}
      spotlightDescription="Enter the six-digit code sent to your inbox and continue directly into the correct workspace for your role."
      spotlightLabel="Final secure step"
      spotlightTitle="Confirm your account before entering the platform."
      title="Verify your identity and unlock the next stage."
    >
      <article className={styles.authCard}>
        <div className={styles.formHeader}>
          <span className={styles.formEyebrow}>Email verification</span>
          <h2 className={styles.formTitle}>Verify your account</h2>
          <p className={styles.formLead}>
            Confirm the verification link sent to your email address, then continue into the
            protected workspace that was waiting for you.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleRequestLink}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="verification-email">
              Email address
            </label>
            <input
              className={styles.input}
              id="verification-email"
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
                Open the preview verification link directly while email delivery is local-only.
              </p>
              <Link className={styles.secondaryButton} href={previewUrl}>
                Open verification preview
              </Link>
            </div>
          ) : null}

          {hasToken ? (
            <button
              className={styles.primaryButton}
              disabled={isVerifying}
              onClick={() => void handleVerify()}
              type="button"
            >
              {isVerifying ? "Verifying..." : "Verify account"}
            </button>
          ) : (
            <button className={styles.primaryButton} disabled={isRequestingLink} type="submit">
              {isRequestingLink ? "Preparing link..." : "Send verification link"}
            </button>
          )}
        </form>

        <div className={styles.resendWrap}>
          <p className={styles.resendCopy}>
            {emailVerified
              ? "This account is already verified."
              : "Need a fresh verification link?"}
          </p>
          <div className={styles.resendRow}>
            <button
              className={styles.textLinkButton}
              disabled={isRequestingLink}
              onClick={() => void handleRequestLink()}
              type="button"
            >
              {isRequestingLink ? "Preparing..." : "Resend verification link"}
            </button>
            <span className={styles.timerPill}>
              {isAuthenticated ? "Session active" : "Login may be required"}
            </span>
          </div>
        </div>

        <p className={styles.pageHint}>
          {statusMessage && !isAuthenticated ? (
            <>
              Verification complete. <Link href="/auth/login">Sign in to continue</Link>
            </>
          ) : hasToken ? (
            <>
              After verification you will continue to{" "}
              <Link href={redirectTarget}>your next secured step</Link>.
            </>
          ) : (
            <>
              Wrong email? <Link href="/auth/register">Start again</Link>
            </>
          )}
        </p>
      </article>
    </AuthShell>
  );
}
