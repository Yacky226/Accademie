import { authFooterLinks } from "../auth.data";
import styles from "../auth.module.css";

export function AuthFooter() {
  return (
    <footer className={styles.authFooter}>
      <div className={styles.authFooterInner}>
        <p className={styles.authCopyright}>
          Copyright 2026 Synthetix Pro. Architectural Precision in Education.
        </p>

        <nav className={styles.authFooterLinks}>
          {authFooterLinks.map((link) => (
            <a key={link.label} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
