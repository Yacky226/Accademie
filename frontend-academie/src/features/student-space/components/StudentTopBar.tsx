"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { resolveApiAssetUrl } from "@/core/config/application-environment";
import { useCurrentAuthSession } from "@/features/auth/model/useCurrentAuthSession";
import {
  type NotificationFilterId,
} from "@/features/notification-center/model/notification-center.catalog";
import { useNotificationCenterState } from "@/features/notification-center/model/useNotificationCenterState";
import { NotificationCenterPanel } from "@/features/notification-center/ui/components/NotificationCenterPanel";
import { WorkspaceChromeIcon } from "@/features/workspace-shell/components/WorkspaceChromeIcon";
import styles from "../student-space.module.css";

interface StudentTopBarProps {
  activePath: string;
  title: string;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "AA";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function StudentTopBar({ activePath, title }: StudentTopBarProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationFilterId>("all");
  const [failedAvatarSrc, setFailedAvatarSrc] = useState<string | null>(null);
  const { roleLabel, user } = useCurrentAuthSession();
  const { isUnread, items, markAllAsRead, markAsRead, unreadCount } = useNotificationCenterState();
  const previewRef = useRef<HTMLDivElement | null>(null);

  const isNotificationPage = activePath === "/student/notifications";
  const filteredNotifications =
    activeFilter === "all"
      ? items
      : items.filter((item) => item.kind === activeFilter);
  const previewItems = filteredNotifications.slice(0, 3);
  const profileName = user?.name?.trim() || "Student workspace";
  const preferredAvatarSrc = resolveApiAssetUrl(user?.avatarUrl ?? null);
  const avatarSrc =
    preferredAvatarSrc && failedAvatarSrc !== preferredAvatarSrc ? preferredAvatarSrc : null;
  const profileInitials = useMemo(() => getInitials(profileName), [profileName]);
  const subtitle =
    unreadCount > 0
      ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""} to review.`
      : "Track your courses, mentor feedback and recent activity from one place.";

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
        <div className={styles.topbarTitleWrap}>
          <p className={styles.topbarTitle}>{title}</p>
          <p className={styles.topbarSubtitle}>{subtitle}</p>
        </div>
      </div>

      <div className={styles.topbarRight}>
        <label className={styles.searchShell}>
          <WorkspaceChromeIcon className={styles.searchIcon} name="search" />
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
            <WorkspaceChromeIcon className={styles.topbarIconSvg} name="bell" />
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
              <WorkspaceChromeIcon className={styles.topbarIconSvg} name="bell" />
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

        <Link className={styles.profileCard} href="/student/settings">
          {avatarSrc ? (
            <Image
              className={styles.avatar}
              src={avatarSrc}
              alt={profileName}
              height={88}
              onError={() => setFailedAvatarSrc(preferredAvatarSrc)}
              sizes="48px"
              width={88}
            />
          ) : (
            <span aria-hidden className={styles.avatarFallback}>
              {profileInitials}
            </span>
          )}
          <span className={styles.profileMeta}>
            <strong className={styles.profileName}>{profileName}</strong>
            <span className={styles.profileRole}>{roleLabel ?? "Student"}</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
