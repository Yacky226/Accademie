import Link from "next/link";
import styles from "../student-space.module.css";

export function StudentFooter() {
  return (
    <footer className={styles.workspaceFooter}>
      <div className={styles.footerBrand}>
        <strong>Architect Academy Student Space</strong>
        <span>Course flow, mentoring and progress tracking aligned in one workspace.</span>
      </div>

      <div className={styles.footerLinks}>
        <Link className={styles.footerLink} href="/student/dashboard">
          Dashboard
        </Link>
        <Link className={styles.footerLink} href="/student/courses">
          My Courses
        </Link>
        <Link className={styles.footerLink} href="/student/notifications">
          Notifications
        </Link>
        <Link className={styles.footerLink} href="/student/support">
          Support
        </Link>
      </div>
    </footer>
  );
}
