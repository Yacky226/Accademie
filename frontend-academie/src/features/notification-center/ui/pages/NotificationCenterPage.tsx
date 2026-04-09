"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StudentShell } from "@/features/student-space/components/StudentShell";
import {
  type NotificationFilterId,
  type NotificationItem,
  type NotificationTone,
} from "../../model/notification-center.catalog";
import { useNotificationCenterState } from "../../model/useNotificationCenterState";
import { NotificationCenterPanel } from "../components/NotificationCenterPanel";
import styles from "../notification-center.module.css";

interface ToastGlyphProps {
  tone: NotificationTone;
}

function ToastGlyph({ tone }: ToastGlyphProps) {
  if (tone === "success") {
    return (
      <svg
        aria-hidden
        className={styles.toastGlyph}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path d="M8.7 12.1l2.2 2.3 4.4-4.8" />
      </svg>
    );
  }

  if (tone === "error" || tone === "tertiary") {
    return (
      <svg
        aria-hidden
        className={styles.toastGlyph}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M12 4.5l8 14H4l8-14Z" />
        <path d="M12 9.2v4.8" />
        <path d="M12 17.3h.01" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden
      className={styles.toastGlyph}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 10.5v4.4" />
      <path d="M12 7.7h.01" />
    </svg>
  );
}

function getToastToneClassName(tone: NotificationTone) {
  if (tone === "success") {
    return styles.toastSuccess;
  }

  if (tone === "error") {
    return styles.toastError;
  }

  if (tone === "tertiary") {
    return styles.toastTertiary;
  }

  return styles.toastInfo;
}

function ToastCard({
  item,
  onMarkAsRead,
}: {
  item: NotificationItem;
  onMarkAsRead: (notificationId: string) => void;
}) {
  return (
    <article className={styles.toastCard}>
      <div className={`${styles.toastIconWrap} ${getToastToneClassName(item.tone)}`}>
        <ToastGlyph tone={item.tone} />
      </div>

      <div className={styles.toastBody}>
        <p className={styles.toastTitle}>{item.title}</p>
        <p className={styles.toastText}>
          {item.description}
          {item.time ? ` · ${item.time}` : ""}
        </p>
      </div>

      {item.actionLabel && item.actionHref ? (
        <Link className={styles.toastActionPrimary} href={item.actionHref}>
          {item.actionLabel}
        </Link>
      ) : item.unread ? (
        <button
          className={styles.toastActionPrimary}
          onClick={() => onMarkAsRead(item.id)}
          type="button"
        >
          Mark as read
        </button>
      ) : null}
    </article>
  );
}

export function NotificationCenterPage() {
  const [activeFilter, setActiveFilter] = useState<NotificationFilterId>("all");
  const { isUnread, items, markAllAsRead, markAsRead, unreadCount } =
    useNotificationCenterState();

  const visibleItems =
    activeFilter === "all"
      ? items
      : items.filter((item) => item.kind === activeFilter);

  const mentorUnreadCount = items.filter(
    (item) => item.kind === "mentor" && isUnread(item.id),
  ).length;
  const courseUnreadCount = items.filter(
    (item) => item.kind === "course" && isUnread(item.id),
  ).length;
  const systemUnreadCount = items.filter(
    (item) => item.kind === "system" && isUnread(item.id),
  ).length;
  const highlightedItems = useMemo(() => {
    const unreadItems = items.filter((item) => item.unread);
    return (unreadItems.length > 0 ? unreadItems : items).slice(0, 4);
  }, [items]);

  return (
    <StudentShell activePath="/student/notifications" topbarTitle="Notifications">
      <section className={styles.page}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.heroEyebrow}>Notifications & System Alerts</p>
            <h1 className={styles.heroTitle}>
              Stay in sync with mentor notes, course releases and critical platform
              updates.
            </h1>
            <p className={styles.heroLead}>
              Review what changed, clear unread activity, and jump back into the right
              learning context without losing momentum.
            </p>
          </div>

          <div className={styles.heroStats}>
            <article className={styles.statCard}>
              <span>Unread</span>
              <strong>{unreadCount}</strong>
              <p>items still waiting for your attention</p>
            </article>
            <article className={styles.statCard}>
              <span>Mentor Feedback</span>
              <strong>{mentorUnreadCount}</strong>
              <p>recent comments and review notes</p>
            </article>
            <article className={styles.statCard}>
              <span>Course Updates</span>
              <strong>{courseUnreadCount}</strong>
              <p>fresh modules, exercises and curriculum sync</p>
            </article>
            <article className={styles.statCard}>
              <span>System Alerts</span>
              <strong>{systemUnreadCount}</strong>
              <p>billing, exports and environment health</p>
            </article>
          </div>
        </header>

        <div className={styles.contentGrid}>
          <div className={styles.contextColumn}>
            <section className={styles.dashboardMock}>
              <div className={styles.dashboardHeader}>
                <div>
                  <h2>Notification command center</h2>
                  <p>
                    {unreadCount > 0
                      ? "Vos alertes prioritaires sont synchronisees en temps reel avec le backend."
                      : "Toutes les alertes actuelles sont lues et votre boite est a jour."}
                  </p>
                </div>
                <div className={styles.dashboardPill}>
                  {unreadCount > 0 ? `${unreadCount} unread` : "Inbox clean"}
                </div>
              </div>

              <div className={styles.heroStats}>
                <article className={styles.statCard}>
                  <span>Visible</span>
                  <strong>{items.length}</strong>
                  <p>Total notifications currently available in your feed.</p>
                </article>
                <article className={styles.statCard}>
                  <span>Mentor</span>
                  <strong>{items.filter((item) => item.kind === "mentor").length}</strong>
                  <p>Feedback loops and review requests waiting in your inbox.</p>
                </article>
                <article className={styles.statCard}>
                  <span>Course</span>
                  <strong>{items.filter((item) => item.kind === "course").length}</strong>
                  <p>Course drops, curriculum sync and lesson release events.</p>
                </article>
                <article className={styles.statCard}>
                  <span>System</span>
                  <strong>{items.filter((item) => item.kind === "system").length}</strong>
                  <p>Operational alerts coming from billing, support and the platform.</p>
                </article>
              </div>
            </section>

            <section className={styles.toastSection}>
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.sectionEyebrow}>Recent Highlights</p>
                  <h2>Live backend notifications</h2>
                </div>
                <p>
                  This summary now uses your real notifications instead of static demo
                  examples.
                </p>
              </div>

              <div className={styles.toastStack}>
                {highlightedItems.length > 0 ? (
                  highlightedItems.map((item) => (
                    <ToastCard key={item.id} item={item} onMarkAsRead={markAsRead} />
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    <h3>No notification available</h3>
                    <p>New mentor feedback and course updates will appear here.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className={styles.panelColumn}>
            <NotificationCenterPanel
              activeFilter={activeFilter}
              isUnread={isUnread}
              items={visibleItems}
              onFilterChange={setActiveFilter}
              onItemSelect={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              unreadCount={unreadCount}
            />
          </div>
        </div>
      </section>
    </StudentShell>
  );
}
