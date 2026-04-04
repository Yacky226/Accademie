import Link from "next/link";
import styles from "../home.module.css";

export function FooterSection() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.container} ${styles.footerGrid}`}>
        <div className={styles.footerLead}>
          <p className={styles.footerBrand}>Architectural Ledger EdTech</p>
          <p className={styles.footerNote}>
            Copyright 2026 Architectural Ledger EdTech. Precise Engineering for
            Minds.
          </p>
          <p className={styles.footerMeta}>
            Unified learning journeys for architecture, systems and engineering leadership.
          </p>
        </div>

        <div className={styles.footerLinks}>
          <Link href="/">Home</Link>
          <Link href="/formations">Formations</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/contact">Contact</Link>
        </div>

        <div className={styles.footerLinks}>
          <Link href="/about">About</Link>
          <Link href="/auth/login">Login</Link>
          <Link href="/student/dashboard">Dashboard</Link>
          <Link href="/onboarding">Onboarding</Link>
          <Link href="/student/notifications">Notifications</Link>
        </div>
      </div>
    </footer>
  );
}
