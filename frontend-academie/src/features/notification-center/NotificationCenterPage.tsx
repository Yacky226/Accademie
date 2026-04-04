"use client";

import { useState } from "react";
import { StudentShell } from "../student-space/components/StudentShell";
import {
  notificationItems,
  notificationToasts,
  type NotificationFilterId,
  type NotificationToast,
  type NotificationTone,
} from "./notification-center.data";
import { NotificationCenterPanel } from "./NotificationCenterPanel";
import styles from "./notification-center.module.css";
import { useNotificationCenterState } from "./useNotificationCenterState";

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

function ToastCard({ toast }: { toast: NotificationToast }) {
  return (
    <article className={styles.toastCard}>
      <div className={`${styles.toastIconWrap} ${getToastToneClassName(toast.tone)}`}>
        <ToastGlyph tone={toast.tone} />
      </div>

      <div className={styles.toastBody}>
        <p className={styles.toastTitle}>{toast.title}</p>
        <p className={styles.toastText}>{toast.description}</p>
      </div>

      {toast.actionLabel ? (
        <button className={styles.toastActionPrimary} type="button">
          {toast.actionLabel}
        </button>
      ) : (
        <button aria-label={`Close ${toast.title}`} className={styles.toastClose} type="button">
          ×
        </button>
      )}
    </article>
  );
}

export function NotificationCenterPage() {
  const [activeFilter, setActiveFilter] = useState<NotificationFilterId>("all");
  const { isUnread, markAllAsRead, markAsRead, unreadCount } = useNotificationCenterState();

  const visibleItems =
    activeFilter === "all"
      ? notificationItems
      : notificationItems.filter((item) => item.kind === activeFilter);

  const mentorUnreadCount = notificationItems.filter(
    (item) => item.kind === "mentor" && isUnread(item.id),
  ).length;
  const courseUnreadCount = notificationItems.filter(
    (item) => item.kind === "course" && isUnread(item.id),
  ).length;
  const systemUnreadCount = notificationItems.filter(
    (item) => item.kind === "system" && isUnread(item.id),
  ).length;

  return (
    <StudentShell activePath="/student/notifications" topbarTitle="Notifications">
      <section className={styles.page}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.heroEyebrow}>Notifications & System Alerts</p>
            <h1 className={styles.heroTitle}>
              Stay in sync with mentor notes, course releases and critical platform updates.
            </h1>
            <p className={styles.heroLead}>
              Review what changed, clear unread activity, and jump back into the right learning
              context without losing momentum.
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
                  <h2>Student Dashboard</h2>
                  <p>Welcome back, Architect. Your next milestone is 4 hours away.</p>
                </div>
                <div className={styles.dashboardPill}>Live focus mode</div>
              </div>

              <div className={styles.mockCardGrid}>
                <div className={styles.mockCardLarge}>
                  <div className={styles.mockBarShort} />
                  <div className={styles.mockRing}>
                    <span>78%</span>
                  </div>
                  <div className={styles.mockBarLong} />
                </div>

                <div className={styles.mockColumn}>
                  <div className={styles.mockCardSmall}>
                    <div className={styles.mockBarMedium} />
                    <div className={styles.mockTimeline}>
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>

                  <div className={styles.mockCardSmall}>
                    <div className={styles.mockBarShort} />
                    <div className={styles.mockCourseGrid}>
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.toastSection}>
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.sectionEyebrow}>Toast Messages</p>
                  <h2>Real-time feedback states</h2>
                </div>
                <p>Success, info, warning and failure feedback aligned with the same visual system.</p>
              </div>

              <div className={styles.toastStack}>
                {notificationToasts.map((toast) => (
                  <ToastCard key={toast.id} toast={toast} />
                ))}
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
