import Link from "next/link";
import { teacherNavItems } from "../teacher-space.data";
import styles from "../teacher-space.module.css";

interface TeacherSidebarProps {
  activePath: string;
}

export function TeacherSidebar({ activePath }: TeacherSidebarProps) {
  return (
    <aside className={styles.sidebarPanel}>
      <Link className={styles.brandCard} href="/teacher/dashboard">
        <span className={styles.brandMark}>AA</span>
        <span className={styles.brandCopy}>
          <strong>Architect Academy</strong>
          <small>Teaching studio</small>
        </span>
      </Link>

      <div className={styles.sidebarIntro}>
        <span className={styles.sidebarEyebrow}>Mentor cockpit</span>
        <p className={styles.sidebarLead}>
          Pilot cohorts, content quality and reviews from a workspace built for delivery.
        </p>
        <span className={styles.sidebarHint}>Weekly teaching signals stay visible across every page.</span>
      </div>

      <nav className={styles.navPanel}>
        <div className={styles.nav}>
          {teacherNavItems.map((item) => {
            const isActive = item.href === activePath;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className={styles.upgradeCard}>
        <span className={styles.upgradeMeta}>Mentor Pro</span>
        <strong>Activate deeper cohort analytics.</strong>
        <p>Track at-risk learners, richer feedback loops and teaching health in one layer.</p>
        <button type="button" className={styles.upgradeButton}>
          Upgrade
        </button>
      </div>

      <div className={styles.sidebarFootLinks}>
        <Link className={styles.sidebarFootLink} href="/teacher/calendar">
          Live schedule
        </Link>
        <Link className={styles.sidebarFootLink} href="/teacher/evaluations">
          Review queue
        </Link>
      </div>
    </aside>
  );
}
