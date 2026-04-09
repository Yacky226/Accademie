import Link from "next/link";
import { Fragment } from "react";
import { WorkspaceLogoutButton } from "@/features/workspace-shell/components/WorkspaceLogoutButton";
import { WorkspaceNavIcon } from "@/features/workspace-shell/components/WorkspaceNavIcon";
import { WorkspaceSidebarToggle } from "@/features/workspace-shell/components/WorkspaceSidebarToggle";
import { AcademyBrandIcon } from "@/shared/ui/AcademyBrandIcon";
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
          <span className={styles.brandMark}>
            <AcademyBrandIcon />
          </span>
          <span className={`${styles.brandCopy} ${isCollapsed ? styles.brandCopyHidden : ""}`}>
            <strong>Architect Academy</strong>
            <small>Teaching studio</small>
          </span>
        </Link>
      </div>

      <nav className={`${styles.navPanel} ${isCollapsed ? styles.navPanelCollapsed : ""}`}>
        <div className={styles.nav}>
          {teacherNavItems.map((item) => {
            const isActive = item.href === activePath;
            return (
              <Fragment key={item.href}>
                <Link
                  href={item.href}
                  title={item.label}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""} ${
                    isCollapsed ? styles.navItemCollapsed : ""
                  }`}
                >
                  <span className={styles.navIcon}>
                    <WorkspaceNavIcon name={item.icon} />
                  </span>
                  <span className={`${styles.navLabel} ${isCollapsed ? styles.navLabelHidden : ""}`}>
                    {item.label}
                  </span>
                </Link>
                {item.href === "/teacher/settings" ? (
                  <WorkspaceLogoutButton
                    className={`${styles.navItem} ${styles.navLogoutButton} ${
                      isCollapsed ? styles.navItemCollapsed : ""
                    }`}
                    iconClassName={styles.navIcon}
                    iconName="logout"
                    label={isCollapsed ? "Exit" : "Logout"}
                    labelClassName={`${styles.navLabel} ${
                      isCollapsed ? styles.navLabelHidden : ""
                    }`}
                  />
                ) : null}
              </Fragment>
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

    </aside>
  );
}
