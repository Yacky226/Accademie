import Link from "next/link";
import { WorkspaceLogoutButton } from "@/features/shared/components/WorkspaceLogoutButton";
import { WorkspaceSidebarToggle } from "@/features/shared/components/WorkspaceSidebarToggle";
import { studentNavItems } from "../student-space.data";
import styles from "../student-space.module.css";

interface StudentSidebarProps {
  activePath: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function StudentSidebar({
  activePath,
  isCollapsed,
  onToggleCollapse,
}: StudentSidebarProps) {
  return (
    <aside className={`${styles.sidebarPanel} ${isCollapsed ? styles.sidebarPanelCollapsed : ""}`}>
      <div className={`${styles.sidebarHeader} ${isCollapsed ? styles.sidebarHeaderCollapsed : ""}`}>
        <WorkspaceSidebarToggle
          className={styles.sidebarToggle}
          isCollapsed={isCollapsed}
          onClick={onToggleCollapse}
        />

        <Link
          className={`${styles.brandCard} ${isCollapsed ? styles.brandCardCollapsed : ""}`}
          href="/student/dashboard"
          title="Architect Academy"
        >
          <span className={styles.brandMark}>AA</span>
          <span className={`${styles.brandCopy} ${isCollapsed ? styles.brandCopyHidden : ""}`}>
            <strong>Architect Academy</strong>
            <small>Student workspace</small>
          </span>
        </Link>
      </div>

      <div className={`${styles.sidebarIntro} ${isCollapsed ? styles.sidebarIntroCollapsed : ""}`}>
        <span className={styles.sidebarEyebrow}>Learning cockpit</span>
        <p className={styles.sidebarLead}>
          Advance through courses, mentor loops and project delivery without losing context.
        </p>
        <span className={styles.sidebarHint}>Your weekly momentum is synced across every page.</span>
      </div>

      <nav className={`${styles.navPanel} ${isCollapsed ? styles.navPanelCollapsed : ""}`}>
        <div className={styles.nav}>
          {studentNavItems.map((item) => {
            const isActive = activePath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""} ${
                  isCollapsed ? styles.navItemCollapsed : ""
                }`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={`${styles.navLabel} ${isCollapsed ? styles.navLabelHidden : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className={`${styles.upgradeBox} ${isCollapsed ? styles.upgradeBoxCollapsed : ""}`}>
        <span className={styles.upgradeMeta}>Pro track</span>
        <strong>Unlock premium reviews and advanced labs.</strong>
        <p>Unlimited projects, richer mentor feedback and higher cloud capacity.</p>
        <button type="button" className={styles.upgradeButton}>
          Upgrade Now
        </button>
      </div>

      <div
        className={`${styles.sidebarFootLinks} ${
          isCollapsed ? styles.sidebarFootLinksCollapsed : ""
        }`}
      >
        <Link
          className={`${styles.sidebarFootLink} ${isCollapsed ? styles.sidebarFootLinkHidden : ""}`}
          href="/student/settings"
        >
          Preferences
        </Link>
        <Link
          className={`${styles.sidebarFootLink} ${isCollapsed ? styles.sidebarFootLinkHidden : ""}`}
          href="/student/support"
        >
          Help center
        </Link>
        <WorkspaceLogoutButton
          className={`${styles.sidebarLogoutButton} ${
            isCollapsed ? styles.sidebarLogoutButtonCollapsed : ""
          }`}
          label={isCollapsed ? "Exit" : "Logout"}
        />
      </div>
    </aside>
  );
}
