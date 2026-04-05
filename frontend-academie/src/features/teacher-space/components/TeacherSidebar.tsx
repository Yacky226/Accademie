import Link from "next/link";
import { WorkspaceLogoutButton } from "@/features/shared/components/WorkspaceLogoutButton";
import { WorkspaceSidebarToggle } from "@/features/shared/components/WorkspaceSidebarToggle";
import { teacherNavItems } from "../teacher-space.data";
import styles from "../teacher-space.module.css";

interface TeacherSidebarProps {
  activePath: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function TeacherSidebar({
  activePath,
  isCollapsed,
  onToggleCollapse,
}: TeacherSidebarProps) {
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
          href="/teacher/dashboard"
          title="Architect Academy"
        >
          <span className={styles.brandMark}>AA</span>
          <span className={`${styles.brandCopy} ${isCollapsed ? styles.brandCopyHidden : ""}`}>
            <strong>Architect Academy</strong>
            <small>Teaching studio</small>
          </span>
        </Link>
      </div>

      <div className={`${styles.sidebarIntro} ${isCollapsed ? styles.sidebarIntroCollapsed : ""}`}>
        <span className={styles.sidebarEyebrow}>Mentor cockpit</span>
        <p className={styles.sidebarLead}>
          Pilot cohorts, content quality and reviews from a workspace built for delivery.
        </p>
        <span className={styles.sidebarHint}>Weekly teaching signals stay visible across every page.</span>
      </div>

      <nav className={`${styles.navPanel} ${isCollapsed ? styles.navPanelCollapsed : ""}`}>
        <div className={styles.nav}>
          {teacherNavItems.map((item) => {
            const isActive = item.href === activePath;
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

      <div className={`${styles.upgradeCard} ${isCollapsed ? styles.upgradeCardCollapsed : ""}`}>
        <span className={styles.upgradeMeta}>Mentor Pro</span>
        <strong>Activate deeper cohort analytics.</strong>
        <p>Track at-risk learners, richer feedback loops and teaching health in one layer.</p>
        <button type="button" className={styles.upgradeButton}>
          Upgrade
        </button>
      </div>

      <div
        className={`${styles.sidebarFootLinks} ${
          isCollapsed ? styles.sidebarFootLinksCollapsed : ""
        }`}
      >
        <Link
          className={`${styles.sidebarFootLink} ${isCollapsed ? styles.sidebarFootLinkHidden : ""}`}
          href="/teacher/calendar"
        >
          Live schedule
        </Link>
        <Link
          className={`${styles.sidebarFootLink} ${isCollapsed ? styles.sidebarFootLinkHidden : ""}`}
          href="/teacher/settings"
        >
          Preferences
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
