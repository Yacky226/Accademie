import Link from "next/link";
import styles from "./auth.module.css";
import { AuthShell } from "./components/AuthShell";

export function VerificationPage() {
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
            A six-digit code has been sent to your email address. Enter it below to continue.
          </p>
        </div>

        <form className={styles.form}>
          <div className={styles.otpRow}>
            {Array.from({ length: 6 }).map((_, index) => (
              <input
                key={`otp-${index}`}
                aria-label={`Digit ${index + 1}`}
                className={styles.otpInput}
                inputMode="numeric"
                maxLength={1}
              />
            ))}
          </div>

          <button className={styles.primaryButton} type="submit">
            Verify account
          </button>
        </form>

        <div className={styles.resendWrap}>
          <p className={styles.resendCopy}>Did not receive a code?</p>
          <div className={styles.resendRow}>
            <button className={styles.textLinkButton} type="button">
              Resend code
            </button>
            <span className={styles.timerPill}>01:59</span>
          </div>
        </div>

        <p className={styles.pageHint}>
          Wrong email? <Link href="/auth/register">Start again</Link>
        </p>
      </article>
    </AuthShell>
  );
}
