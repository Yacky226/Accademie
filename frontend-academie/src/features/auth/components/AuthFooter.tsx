import Link from "next/link";
import { authFooterLinks } from "../auth.data";
import styles from "../auth.module.css";

export function AuthFooter() {
  return (
    <footer className={styles.authFooter}>
      <div className={styles.authFooterInner}>
        <div className={styles.authFooterBrand}>
          <strong>Architect Academy</strong>
          <p className={styles.authCopyright}>
            Connected access for students, mentors and admins across one premium learning system.
          </p>
        </div>

        <nav className={styles.authFooterLinks}>
          {authFooterLinks.map((link) => (
            <Link key={link.label} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
