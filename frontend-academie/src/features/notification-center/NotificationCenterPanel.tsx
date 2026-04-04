"use client";

import Link from "next/link";
import type {
  NotificationFilterId,
  NotificationIconName,
  NotificationItem,
  NotificationTone,
} from "./notification-center.data";
import { notificationFilters } from "./notification-center.data";
import styles from "./notification-center.module.css";

interface NotificationCenterPanelProps {
  activeFilter: NotificationFilterId;
  compact?: boolean;
  footerHref?: string;
  footerLabel?: string;
  isUnread: (id: string) => boolean;
  items: NotificationItem[];
  onFilterChange: (filterId: NotificationFilterId) => void;
  onItemSelect: (id: string) => void;
  onMarkAllAsRead: () => void;
  unreadCount: number;
}

interface NotificationGlyphProps {
  className?: string;
  name: NotificationIconName;
}

function NotificationGlyph({ className, name }: NotificationGlyphProps) {
  const commonProps = {
    "aria-hidden": true,
    className,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.85,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "forum":
      return (
        <svg {...commonProps}>
          <path d="M5.5 17.5V7.8A1.8 1.8 0 0 1 7.3 6h9.4a1.8 1.8 0 0 1 1.8 1.8v6.4A1.8 1.8 0 0 1 16.7 16H10l-4.5 1.5Z" />
        </svg>
      );
    case "school":
      return (
        <svg {...commonProps}>
          <path d="M3.5 8.8L12 4l8.5 4.8L12 13.6 3.5 8.8Z" />
          <path d="M6.4 10.6v4.1c0 1.9 2.5 3.5 5.6 3.5s5.6-1.6 5.6-3.5v-4.1" />
        </svg>
      );
    case "warning":
      return (
        <svg {...commonProps}>
          <path d="M12 4.5l8 14H4l8-14Z" />
          <path d="M12 9.2v4.8" />
          <path d="M12 17.3h.01" />
        </svg>
      );
    case "checkCircle":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M8.7 12.1l2.2 2.3 4.4-4.8" />
        </svg>
      );
    case "info":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 10.5v4.4" />
          <path d="M12 7.7h.01" />
        </svg>
      );
  }
}

function getToneClassName(tone: NotificationTone) {
  if (tone === "primary") {
    return styles.iconPrimary;
  }

  if (tone === "tertiary") {
    return styles.iconTertiary;
  }

  if (tone === "error") {
    return styles.iconError;
  }

  if (tone === "success") {
    return styles.iconSuccess;
  }

  return styles.iconInfo;
}

export function NotificationCenterPanel({
  activeFilter,
  compact = false,
  footerHref,
  footerLabel,
  isUnread,
  items,
  onFilterChange,
  onItemSelect,
  onMarkAllAsRead,
  unreadCount,
}: NotificationCenterPanelProps) {
  return (
    <section className={`${styles.panel} ${compact ? styles.panelCompact : ""}`}>
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Notifications</h2>
          <p className={styles.panelSubtitle}>
            {unreadCount > 0
              ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}`
              : "Everything is up to date"}
          </p>
        </div>

        <button className={styles.markAllButton} onClick={onMarkAllAsRead} type="button">
          Mark all as read
        </button>
      </div>

      <div className={styles.filterRow}>
        {notificationFilters.map((filter) => (
          <button
            key={filter.id}
            aria-pressed={activeFilter === filter.id}
            className={activeFilter === filter.id ? styles.filterChipActive : styles.filterChip}
            onClick={() => onFilterChange(filter.id)}
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className={styles.notificationScroller}>
        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No notification in this category</h3>
            <p>Switch tabs or come back after the next mentor or system update.</p>
          </div>
        ) : (
          items.map((item) => {
            const unread = isUnread(item.id);

            return (
              <article
                className={`${styles.notificationCard} ${
                  unread ? styles.notificationCardUnread : ""
                }`}
                key={item.id}
              >
                <div
                  className={styles.notificationSurface}
                  onClick={() => onItemSelect(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onItemSelect(item.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.notificationLayout}>
                    <div className={`${styles.iconBubble} ${getToneClassName(item.tone)}`}>
                      <NotificationGlyph className={styles.itemIcon} name={item.icon} />
                    </div>

                    <div className={styles.notificationBody}>
                      <div className={styles.notificationMeta}>
                        <span className={styles.notificationTitle}>{item.title}</span>
                        <span className={styles.notificationTime}>{item.time}</span>
                      </div>

                      <p className={styles.notificationText}>{item.description}</p>

                      {item.quote ? (
                        <div className={styles.notificationQuote}>
                          <p>{item.quote}</p>
                        </div>
                      ) : null}

                      {item.actionLabel ? (
                        <div className={styles.notificationActionRow}>
                          {item.actionHref ? (
                            <Link
                              className={styles.inlineAction}
                              href={item.actionHref}
                              onClick={(event) => event.stopPropagation()}
                            >
                              {item.actionLabel}
                            </Link>
                          ) : (
                            <button
                              className={styles.inlineAction}
                              onClick={(event) => event.stopPropagation()}
                              type="button"
                            >
                              {item.actionLabel}
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {unread ? <span className={styles.notificationUnreadDot} /> : null}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {footerHref && footerLabel ? (
        <div className={styles.panelFooter}>
          <Link className={styles.footerLink} href={footerHref}>
            {footerLabel}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
