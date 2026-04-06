"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { formatUserRoleLabel } from "@/entities/user/model/user-session.types";
import { useCurrentAuthSession } from "@/features/auth/model/useCurrentAuthSession";
import styles from "../home.module.css";
import type { NavItem } from "../home.types";

interface TopNavBarProps {
  navItems: NavItem[];
}

export function TopNavBar({ navItems }: TopNavBarProps) {
  const pathname = usePathname();
  const { dashboardHref, isAuthenticated, user } = useCurrentAuthSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return "AA";
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };
  const userName = user?.name ?? "Mon espace";
  const userAvatar = user?.avatarUrl ?? null;
  const workspaceLabel = user ? formatUserRoleLabel(user.role) : null;
  const notificationsHref = user?.role === "student" ? "/student/notifications" : dashboardHref;

  return (
    <header className={styles.topNav}>
      <div className={`${styles.container} ${styles.topNavInner}`}>
        <div className={styles.brandCluster}>
          <Link
            href="/"
            className={styles.brand}
            aria-label="Retour a l accueil"
          >
            <span className={styles.brandMark}>AA</span>
            <span className={styles.brandCopy}>
              <strong>Architect Academy</strong>
              <small>Precision learning</small>
            </span>
          </Link>

          <div className={styles.navSurface}>
            <nav className={styles.navLinks} aria-label="Navigation principale">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ""}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className={styles.navActions}>
          <span className={styles.statusChip}>42 mentors live</span>

          {isAuthenticated ? (
            <>
              <Link
                href={notificationsHref}
                className={styles.navNotification}
                aria-label="Ouvrir mes notifications"
              >
                <span className={styles.notifyDot} />
                <span>{user?.role === "student" ? "Notifications" : "Workspace"}</span>
              </Link>

              <Link
                href={dashboardHref}
                className={styles.avatarLink}
                aria-label="Acceder a mon espace"
                title={workspaceLabel ?? "Mon espace"}
              >
                {userAvatar ? (
                  <Image
                    className={styles.avatar}
                    src={userAvatar}
                    alt={userName}
                    height={72}
                    sizes="40px"
                    width={72}
                  />
                ) : (
                  <span className={styles.avatarFallback}>
                    {getInitials(userName)}
                  </span>
                )}
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login" className={styles.navLoginButton}>
                Login
              </Link>
              <Link
                href="/auth/register"
                className={styles.navGetStartedButton}
              >
                Get started
              </Link>
            </>
          )}

          <button
            type="button"
            className={styles.mobileToggle}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="home-mobile-menu"
            aria-label="Ouvrir la navigation"
          >
            {isMobileMenuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      <div
        id="home-mobile-menu"
        className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ""}`}
      >
        <div className={styles.mobileMenuBody}>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`${styles.mobileLink} ${pathname === item.href ? styles.navLinkActive : ""}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          {isAuthenticated ? (
            <>
              <Link
                href={notificationsHref}
                className={styles.mobileActionPrimary}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {user?.role === "student" ? "Mes notifications" : "Ouvrir mon espace"}
              </Link>
              <Link
                href={dashboardHref}
                className={styles.mobileActionGhost}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Aller au dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className={styles.mobileActionGhost}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className={styles.mobileActionPrimary}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
