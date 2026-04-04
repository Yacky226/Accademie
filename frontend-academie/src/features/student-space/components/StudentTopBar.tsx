"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { NotificationCenterPanel } from "@/features/notification-center/NotificationCenterPanel";
import {
  notificationItems,
  type NotificationFilterId,
} from "@/features/notification-center/notification-center.data";
import { useNotificationCenterState } from "@/features/notification-center/useNotificationCenterState";
import styles from "../student-space.module.css";

interface StudentTopBarProps {
  activePath: string;
  title: string;
}

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

function BellIcon({ className }: { className?: string }) {
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
      <path d="M7.8 17H16.2A1.8 1.8 0 0 0 18 15.2V10.8A6 6 0 0 0 13.5 5V4.5A1.5 1.5 0 0 0 12 3a1.5 1.5 0 0 0-1.5 1.5V5A6 6 0 0 0 6 10.8v4.4A1.8 1.8 0 0 0 7.8 17Z" />
      <path d="M10 18.5a2.2 2.2 0 0 0 4 0" />
    </svg>
  );
}

export function StudentTopBar({ activePath, title }: StudentTopBarProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationFilterId>("all");
  const { isUnread, markAllAsRead, markAsRead, unreadCount } = useNotificationCenterState();
  const previewRef = useRef<HTMLDivElement | null>(null);

  const isNotificationPage = activePath === "/student/notifications";
  const filteredNotifications =
    activeFilter === "all"
      ? notificationItems
      : notificationItems.filter((item) => item.kind === activeFilter);
  const previewItems = filteredNotifications.slice(0, 3);

  useEffect(() => {
    if (!isPreviewOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!previewRef.current?.contains(event.target as Node)) {
        setIsPreviewOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPreviewOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isPreviewOpen]);

  return (
    <header className={styles.workspaceTopbar}>
      <div className={styles.topbarLead}>
        <span className={styles.workspaceBadge}>Student space</span>
        <div className={styles.topbarTitleWrap}>
          <p className={styles.topbarTitle}>{title}</p>
          <p className={styles.topbarSubtitle}>
            Stay aligned across courses, mentor reviews and upcoming deadlines.
          </p>
        </div>
      </div>

      <div className={styles.topbarRight}>
        <label className={styles.searchShell}>
          <SearchIcon className={styles.searchIcon} />
          <input
            aria-label="Search student content"
            className={styles.search}
            placeholder="Search courses, mentors, alerts..."
          />
        </label>

        {isNotificationPage ? (
          <Link
            aria-current="page"
            className={`${styles.topbarIconButton} ${styles.topbarIconButtonActive}`}
            href="/student/notifications"
          >
            <BellIcon className={styles.topbarIconSvg} />
            {unreadCount > 0 ? <span className={styles.topbarUnreadDot} /> : null}
          </Link>
        ) : (
          <div className={styles.topbarNotificationWrap} ref={previewRef}>
            <button
              aria-expanded={isPreviewOpen}
              aria-haspopup="dialog"
              aria-label="Open notification preview"
              className={`${styles.topbarIconButton} ${
                isPreviewOpen ? styles.topbarIconButtonActive : ""
              }`}
              onClick={() => setIsPreviewOpen((current) => !current)}
              type="button"
            >
              <BellIcon className={styles.topbarIconSvg} />
              {unreadCount > 0 ? <span className={styles.topbarUnreadDot} /> : null}
            </button>

            {isPreviewOpen ? (
              <>
                <button
                  aria-label="Close notification preview"
                  className={styles.topbarBackdrop}
                  onClick={() => setIsPreviewOpen(false)}
                  type="button"
                />

                <div className={styles.topbarPopover}>
                  <NotificationCenterPanel
                    activeFilter={activeFilter}
                    compact
                    footerHref="/student/notifications"
                    footerLabel="See All Notifications"
                    isUnread={isUnread}
                    items={previewItems}
                    onFilterChange={setActiveFilter}
                    onItemSelect={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                    unreadCount={unreadCount}
                  />
                </div>
              </>
            ) : null}
          </div>
        )}

        <Link className={styles.profileCard} href="/student/profile">
          <img
            className={styles.avatar}
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYp_cRnI6uN9SeI8mT8dma5U1ZfXO2vKNevApXghbOmz6Q5IIco7qM-iPMSs-P6fYIIOCLoDENFeHSurgFPSOMxVFSTBrb8Pi_H6IAfw6fEds81ec-oLBSNrEabRflH5E4glWzIjtE5EXRD0yrvz4n0G-3HtgG0LHdfU4ORjKjv5cCKvO_-1DCrvaptQBBjbh106ywAke-X9IgsisgtAGwviBeAbIeUOBnd-ImB4lV9pPHRn3cR2S639zq--pOxoZRJluyt_FdV8yF"
            alt="Student avatar"
          />
          <span className={styles.profileMeta}>
            <strong className={styles.profileName}>Alex Rivera</strong>
            <span className={styles.profileRole}>Systems Architect Student</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
