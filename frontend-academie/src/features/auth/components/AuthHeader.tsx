import Link from "next/link";
import styles from "../auth.module.css";

interface AuthHeaderProps {
  actionLabel: string;
  actionHref: string;
}

export function AuthHeader({ actionLabel, actionHref }: AuthHeaderProps) {
  return (
    <header className={styles.authHeader}>
      <div className={styles.authHeaderInner}>
        <Link className={styles.authBrand} href="/">
          <span className={styles.brandMark}>AA</span>
          <span className={styles.brandStack}>
            <strong>Architect Academy</strong>
            <small>Precision learning</small>
          </span>
        </Link>

        <div className={styles.authHeaderActions}>
          <Link className={styles.headerGhostLink} href="/pricing">
            Pricing
          </Link>
          <Link className={styles.headerPrimaryLink} href={actionHref}>
            {actionLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
