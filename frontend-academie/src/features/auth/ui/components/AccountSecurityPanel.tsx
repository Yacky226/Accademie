"use client";

import Link from "next/link";
import styles from "../auth-ui.module.css";
import { useAccountSecurityController } from "../../model/useAccountSecurityController";

interface AccountSecurityPanelProps {
  description?: string;
  eyebrow?: string;
  title?: string;
}

export function AccountSecurityPanel({
  description = "Keep your account verified, rotate access across devices and monitor the active security state from one place.",
  eyebrow = "Account security",
  title = "Authentication controls",
}: AccountSecurityPanelProps) {
  const {
    emailVerified,
    errorMessage,
    handleLogoutAllSessions,
    handleSendVerificationLink,
    isClosingAllSessions,
    isRequestingVerification,
    previewUrl,
    roleLabel,
    statusMessage,
    user,
    verificationHref,
  } = useAccountSecurityController();

  return (
    <article className={styles.securityPanel}>
      <div className={styles.securityPanelHeader}>
        <div className={styles.securityPanelCopy}>
          <span className={styles.authEyebrow}>{eyebrow}</span>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <span
          className={
            emailVerified ? styles.securityStatusBadgeVerified : styles.securityStatusBadgePending
          }
        >
          {emailVerified ? "Verified" : "Verification pending"}
        </span>
      </div>

      <div className={styles.securityFacts}>
        <div className={styles.securityFactCard}>
          <span>Signed in as</span>
          <strong>{user?.name ?? "Architect Academy member"}</strong>
          <p>{user?.email ?? "No authenticated email is available on this session."}</p>
        </div>
        <div className={styles.securityFactCard}>
          <span>Role access</span>
          <strong>{roleLabel ?? "Workspace member"}</strong>
          <p>
            {emailVerified
              ? "This account can access its protected workspace routes and secured data."
              : "Verify the email address to unlock protected workspace routes and sensitive actions."}
          </p>
        </div>
      </div>

      {errorMessage ? <p className={styles.formNoticeError}>{errorMessage}</p> : null}
      {statusMessage ? <p className={styles.formNoticeSuccess}>{statusMessage}</p> : null}

      {previewUrl ? (
        <div className={styles.previewPanel}>
          <p className={styles.previewTitle}>Development preview</p>
          <p className={styles.previewCopy}>
            Open the generated verification link directly while email delivery is still local-only.
          </p>
          <Link className={styles.secondaryButton} href={previewUrl}>
            Open verification preview
          </Link>
        </div>
      ) : null}

      <div className={styles.securityActionRow}>
        {emailVerified ? (
          <Link className={styles.secondaryButton} href={verificationHref}>
            Review verification state
          </Link>
        ) : (
          <button
            className={styles.secondaryButton}
            disabled={isRequestingVerification || !user?.email}
            onClick={() => void handleSendVerificationLink()}
            type="button"
          >
            {isRequestingVerification ? "Preparing verification..." : "Send verification link"}
          </button>
        )}

        <button
          className={styles.primaryButton}
          disabled={isClosingAllSessions}
          onClick={() => void handleLogoutAllSessions()}
          type="button"
        >
          {isClosingAllSessions ? "Closing sessions..." : "Sign out from all devices"}
        </button>
      </div>
    </article>
  );
}
