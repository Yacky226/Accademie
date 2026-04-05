"use client";

import type { AdminLayoutProps } from "../admin-space.types";
import { adminNavItems } from "../admin-space.data";
import { WorkspaceProfileBadge } from "@/features/shared/components/WorkspaceProfileBadge";
import { WorkspaceLogoutButton } from "@/features/shared/components/WorkspaceLogoutButton";
import { WorkspaceSidebarToggle } from "@/features/shared/components/WorkspaceSidebarToggle";
import { useWorkspaceSidebarState } from "@/features/shared/hooks/useWorkspaceSidebarState";
import styles from "../admin-space.module.css";
import Link from "next/link";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16L20 20" />
    </svg>
  );
}

export function AdminShell({ activePath, title, children }: AdminLayoutProps) {
  const { isCollapsed, toggleSidebar } = useWorkspaceSidebarState();
  const statusLabel =
    activePath === "/admin/system-health" ? "Critical monitoring enabled" : "99.98% uptime";

  return (
    <div className={styles.workspaceShell}>
      <div
        className={`${styles.workspaceLayout} ${isCollapsed ? styles.workspaceLayoutCollapsed : ""}`}
      >
        <div className={styles.workspaceSidebarSlot}>
          <aside
            className={`${styles.sidebarPanel} ${isCollapsed ? styles.sidebarPanelCollapsed : ""}`}
          >
            <div
              className={`${styles.sidebarHeader} ${isCollapsed ? styles.sidebarHeaderCollapsed : ""}`}
            >
              <WorkspaceSidebarToggle
                className={styles.sidebarToggle}
                isCollapsed={isCollapsed}
                onClick={toggleSidebar}
              />

              <Link
                className={`${styles.brandCard} ${isCollapsed ? styles.brandCardCollapsed : ""}`}
                href="/admin/dashboard"
                title="Architect Academy"
              >
                <span className={styles.brandMark}>AA</span>
                <span className={`${styles.brandCopy} ${isCollapsed ? styles.brandCopyHidden : ""}`}>
                  <strong>Architect Academy</strong>
                  <small>Admin command</small>
                </span>
              </Link>
            </div>

            <div className={`${styles.sidebarIntro} ${isCollapsed ? styles.sidebarIntroCollapsed : ""}`}>
              <span className={styles.sidebarEyebrow}>Operational core</span>
              <p className={styles.sidebarLead}>
                Supervise catalog, finance, users and infrastructure from one decision-ready
                console.
              </p>
            </div>

            <nav className={`${styles.navPanel} ${isCollapsed ? styles.navPanelCollapsed : ""}`}>
              <div className={styles.nav}>
                {adminNavItems.map((item) => {
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

            <div className={`${styles.sideFooter} ${isCollapsed ? styles.sideFooterCollapsed : ""}`}>
              <div className={`${styles.sideStatCard} ${isCollapsed ? styles.sideStatCardCollapsed : ""}`}>
                <span>Live oversight</span>
                <strong>24/7</strong>
                <p>
                  Critical signals, finances and reliability metrics stay visible from every area.
                </p>
              </div>

              <button
                type="button"
                className={`${styles.sideButton} ${isCollapsed ? styles.sideButtonCollapsed : ""}`}
              >
                Create New Course
              </button>

              <Link
                className={`${styles.sideLink} ${isCollapsed ? styles.sideLinkCollapsed : ""}`}
                href="/admin/system-health"
              >
                Check system health
              </Link>

              <WorkspaceLogoutButton
                className={`${styles.sideLogoutButton} ${
                  isCollapsed ? styles.sideLogoutButtonCollapsed : ""
                }`}
                label={isCollapsed ? "Exit" : "Logout"}
              />
            </div>
          </aside>
        </div>

        <section className={styles.workspaceContent}>
          <header className={styles.workspaceTopbar}>
            <div className={styles.topbarLead}>
              <span className={styles.workspaceBadge}>Admin space</span>
              <div className={styles.topbarCopy}>
                <p className={styles.topTitle}>{title}</p>
                <p className={styles.topSub}>
                  Keep business, platform and academic operations aligned from one premium shell.
                </p>
              </div>
            </div>

            <div className={styles.topbarRight}>
              <label className={styles.searchShell}>
                <SearchIcon className={styles.searchIcon} />
                <input
                  aria-label="Search admin workspace"
                  className={styles.topSearch}
                  placeholder="Search users, payments, systems..."
                />
              </label>

              <span className={styles.topStatus}>{statusLabel}</span>

              <WorkspaceProfileBadge
                avatarFallbackClassName={styles.adminAvatarFallback}
                avatarImageClassName={styles.adminAvatarImage}
                avatarShellClassName={styles.adminAvatarShell}
                defaultAvatarSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuCC-fOQCXDvXke-_Pcle1Y_AXh3C5KhQ-MjP13jXbsslw6q4Hz0eV7xh4eJgjd6XzPUMHzLCtjIPFUoNHdedik-jEZQpEMLK_hjIXow_-1-0KB0DEWSsETgF4Hr-3TNAMSOvzbo6QkckA7rFdhsjEycWHxX6Tba8_G1b9rvGDdNyqJAe4ZJVcyaYiRcWTZUA6--5tTgLF6J1hkQx0hguxUEnuZzgYfKz0L3pxtalyJjRY6-5F0W-D_legyvfjYQ0_uTk5s9Uf_N4wXg"
                defaultName="Sarah Chen"
                defaultRole="Platform admin"
                href="/admin/settings"
                linkClassName={styles.topProfile}
                metaClassName={styles.topProfileMeta}
                nameClassName={styles.topProfileName}
                roleClassName={styles.topProfileRole}
              />
            </div>
          </header>

          <div className={styles.workspacePage}>{children}</div>

          <footer className={styles.workspaceFooter}>
            <div className={styles.footerBrand}>
              <strong>Architect Academy Admin Console</strong>
              <span>Governance, growth and system reliability in one connected environment.</span>
            </div>

            <div className={styles.footerLinks}>
              <Link className={styles.footerLink} href="/admin/dashboard">
                Dashboard
              </Link>
              <Link className={styles.footerLink} href="/admin/users">
                Users
              </Link>
              <Link className={styles.footerLink} href="/admin/formations">
                Catalog
              </Link>
              <Link className={styles.footerLink} href="/admin/system-health">
                System Health
              </Link>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}
