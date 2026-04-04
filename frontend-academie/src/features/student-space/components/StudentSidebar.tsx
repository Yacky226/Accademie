import Link from "next/link";
import { studentNavItems } from "../student-space.data";
import styles from "../student-space.module.css";

interface StudentSidebarProps {
  activePath: string;
}

export function StudentSidebar({ activePath }: StudentSidebarProps) {
  return (
    <aside className={styles.sidebarPanel}>
      <Link className={styles.brandCard} href="/student/dashboard">
        <span className={styles.brandMark}>AA</span>
        <span className={styles.brandCopy}>
          <strong>Architect Academy</strong>
          <small>Student workspace</small>
        </span>
      </Link>

      <div className={styles.sidebarIntro}>
        <span className={styles.sidebarEyebrow}>Learning cockpit</span>
        <p className={styles.sidebarLead}>
          Advance through courses, mentor loops and project delivery without losing context.
        </p>
        <span className={styles.sidebarHint}>Your weekly momentum is synced across every page.</span>
      </div>

      <nav className={styles.navPanel}>
        <div className={styles.nav}>
          {studentNavItems.map((item) => {
            const isActive = activePath === item.href;
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

      <div className={styles.upgradeBox}>
        <span className={styles.upgradeMeta}>Pro track</span>
        <strong>Unlock premium reviews and advanced labs.</strong>
        <p>Unlimited projects, richer mentor feedback and higher cloud capacity.</p>
        <button type="button" className={styles.upgradeButton}>
          Upgrade Now
        </button>
      </div>

      <div className={styles.sidebarFootLinks}>
        <Link className={styles.sidebarFootLink} href="/student/settings">
          Preferences
        </Link>
        <Link className={styles.sidebarFootLink} href="/student/support">
          Help center
        </Link>
      </div>
    </aside>
  );
}
