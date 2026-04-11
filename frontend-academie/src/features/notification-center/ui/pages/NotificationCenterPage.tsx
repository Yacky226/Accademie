"use client";

import { useState } from "react";
import { StudentShell } from "@/features/student-space/components/StudentShell";
import { type NotificationFilterId } from "../../model/notification-center.catalog";
import { useNotificationCenterState } from "../../model/useNotificationCenterState";
import { NotificationCenterPanel } from "../components/NotificationCenterPanel";
import styles from "../notification-center.module.css";

export function NotificationCenterPage() {
  const [activeFilter, setActiveFilter] = useState<NotificationFilterId>("all");
  const { isUnread, items, markAllAsRead, markAsRead, unreadCount } =
    useNotificationCenterState();

  const visibleItems =
    activeFilter === "all"
      ? items
      : items.filter((item) => item.kind === activeFilter);

  return (
    <StudentShell activePath="/student/notifications" topbarTitle="Notifications">
      <section className={styles.page}>
        <div className={styles.contentGrid}>
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
