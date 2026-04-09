import Link from "next/link";
import { Fragment } from "react";
import { WorkspaceLogoutButton } from "@/features/workspace-shell/components/WorkspaceLogoutButton";
import { WorkspaceNavIcon } from "@/features/workspace-shell/components/WorkspaceNavIcon";
import { WorkspaceSidebarToggle } from "@/features/workspace-shell/components/WorkspaceSidebarToggle";
import { AcademyBrandIcon } from "@/shared/ui/AcademyBrandIcon";
import { studentNavItems } from "../model/student-workspace.catalog";
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
          <span className={styles.brandMark}>
            <AcademyBrandIcon />
          </span>
          <span className={`${styles.brandCopy} ${isCollapsed ? styles.brandCopyHidden : ""}`}>
            <strong>Architect Academy</strong>
            <small>Student workspace</small>
          </span>
        </Link>
      </div>

      <nav className={`${styles.navPanel} ${isCollapsed ? styles.navPanelCollapsed : ""}`}>
        <div className={styles.nav}>
          {studentNavItems.map((item) => {
            const isActive = activePath === item.href;
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
                {item.href === "/student/settings" ? (
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

      <div className={`${styles.upgradeBox} ${isCollapsed ? styles.upgradeBoxCollapsed : ""}`}>
        <span className={styles.upgradeMeta}>Pro track</span>
        <strong>Unlock premium reviews and advanced labs.</strong>
        <p>Unlimited projects, richer mentor feedback and higher cloud capacity.</p>
        <button type="button" className={styles.upgradeButton}>
          Upgrade Now
        </button>
      </div>

    </aside>
  );
}
