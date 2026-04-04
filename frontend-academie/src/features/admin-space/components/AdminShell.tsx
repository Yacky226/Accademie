import type { AdminLayoutProps } from "../admin-space.types";
import { adminNavItems } from "../admin-space.data";
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
  const statusLabel =
    activePath === "/admin/system-health" ? "Critical monitoring enabled" : "99.98% uptime";

  return (
    <div className={styles.workspaceShell}>
      <div className={styles.workspaceLayout}>
        <div className={styles.workspaceSidebarSlot}>
          <aside className={styles.sidebarPanel}>
            <Link className={styles.brandCard} href="/admin/dashboard">
              <span className={styles.brandMark}>AA</span>
              <span className={styles.brandCopy}>
                <strong>Architect Academy</strong>
                <small>Admin command</small>
              </span>
            </Link>

            <div className={styles.sidebarIntro}>
              <span className={styles.sidebarEyebrow}>Operational core</span>
              <p className={styles.sidebarLead}>
                Supervise catalog, finance, users and infrastructure from one decision-ready
                console.
              </p>
            </div>

            <nav className={styles.navPanel}>
              <div className={styles.nav}>
                {adminNavItems.map((item) => {
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

            <div className={styles.sideFooter}>
              <div className={styles.sideStatCard}>
                <span>Live oversight</span>
                <strong>24/7</strong>
                <p>
                  Critical signals, finances and reliability metrics stay visible from every area.
                </p>
              </div>

              <button type="button" className={styles.sideButton}>
                Create New Course
              </button>

              <Link className={styles.sideLink} href="/admin/system-health">
                Check system health
              </Link>
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

              <Link className={styles.topProfile} href="/admin/settings">
                <span className={styles.adminAvatar}>SC</span>
                <span className={styles.topProfileMeta}>
                  <strong>Sarah Chen</strong>
                  <span>Platform admin</span>
                </span>
              </Link>
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
