import Link from "next/link";
import styles from "../teacher-space.module.css";

export function TeacherFooter() {
  return (
    <footer className={styles.workspaceFooter}>
      <div className={styles.footerBrand}>
        <strong>Architect Academy Teaching Studio</strong>
        <span>Mentoring, cohorts and course delivery connected in one premium workflow.</span>
      </div>

      <div className={styles.footerLinks}>
        <Link className={styles.footerLink} href="/teacher/dashboard">
          Dashboard
        </Link>
        <Link className={styles.footerLink} href="/teacher/programs">
          Programs
        </Link>
        <Link className={styles.footerLink} href="/teacher/evaluations">
          Evaluations
        </Link>
        <Link className={styles.footerLink} href="/teacher/students">
          Students
        </Link>
      </div>
    </footer>
  );
}
