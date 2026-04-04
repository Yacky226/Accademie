"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "../home.module.css";
import type { NavItem } from "../home.types";

interface TopNavBarProps {
  navItems: NavItem[];
}

export function TopNavBar({ navItems }: TopNavBarProps) {
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState("Mon espace");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

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

  useEffect(() => {
    const readAuthState = () => {
      setIsHydrated(true);

      const authFlag = localStorage.getItem("aa_is_authenticated") === "true";
      const hasToken = Boolean(
        localStorage.getItem("aa_access_token") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("token"),
      );

      const authState = authFlag || hasToken;
      setIsAuthenticated(authState);

      if (authState) {
        const storedName =
          localStorage.getItem("aa_user_name") ||
          localStorage.getItem("user_name") ||
          localStorage.getItem("userName") ||
          "Mon espace";

        const storedAvatar =
          localStorage.getItem("aa_user_avatar") ||
          localStorage.getItem("user_avatar") ||
          null;

        setUserName(storedName);
        setUserAvatar(storedAvatar);
      }
    };

    readAuthState();

    const onStorageChange = () => {
      readAuthState();
    };

    window.addEventListener("storage", onStorageChange);
    return () => {
      window.removeEventListener("storage", onStorageChange);
    };
  }, []);

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

          {isHydrated && isAuthenticated ? (
            <>
              <Link
                href="/student/notifications"
                className={styles.navNotification}
                aria-label="Ouvrir mes notifications"
              >
                <span className={styles.notifyDot} />
                <span>Notifications</span>
              </Link>

              <Link
                href="/student/dashboard"
                className={styles.avatarLink}
                aria-label="Acceder a mon espace"
                title="Mon espace"
              >
                {userAvatar ? (
                  <img
                    className={styles.avatar}
                    src={userAvatar}
                    alt={userName}
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

          {isHydrated && isAuthenticated ? (
            <>
              <Link
                href="/student/notifications"
                className={styles.mobileActionPrimary}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Mes notifications
              </Link>
              <Link
                href="/student/dashboard"
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
