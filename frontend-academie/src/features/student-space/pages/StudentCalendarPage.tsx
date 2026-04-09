"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWorkspaceMyCalendarEvents } from "@/features/workspace-data/api/workspace-api.client";
import type { WorkspaceCalendarEventRecord } from "@/features/workspace-data/model/workspace-api.types";
import { formatWorkspaceDateTime } from "@/features/workspace-data/model/workspace-ui.utils";
import styles from "../student-space.module.css";
import { StudentShell } from "../components/StudentShell";

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function StudentCalendarPage() {
  const [events, setEvents] = useState<WorkspaceCalendarEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const referenceDate = useMemo(() => {
    const firstEvent = events[0]?.startsAt;
    return firstEvent ? new Date(firstEvent) : new Date();
  }, [events]);
  const monthCells = useMemo(() => buildMonthCells(referenceDate, events), [referenceDate, events]);
  const upcomingEvents = useMemo(
    () =>
      events
        .slice()
        .sort((left, right) => new Date(left.startsAt ?? 0).getTime() - new Date(right.startsAt ?? 0).getTime()),
    [events],
  );

  useEffect(() => {
    void loadCalendar();
  }, []);

  async function loadCalendar() {
    setLoading(true);

    try {
      setEvents(await fetchWorkspaceMyCalendarEvents());
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de charger votre planning.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <StudentShell activePath="/student/calendar" topbarTitle="Mon Planning">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>
            {new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(referenceDate)}
          </h1>
          <p className={styles.heroSub}>Vos sessions live, rendez-vous et deadlines tires du calendrier reel.</p>
          {errorMessage ? <p className={`${styles.heroSub} ${styles.messageError}`}>{errorMessage}</p> : null}
        </div>
      </section>

      <div className={styles.grid}>
        <article className={styles.card}>
          <div className={styles.calendarGridWrap}>
            <div className={styles.calendarGridSurface}>
              <div className={styles.weekHeader}>
                {WEEK_DAYS.map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              <div className={styles.monthGrid}>
                {monthCells.map((cell) => (
                  <div
                    key={cell.key}
                    className={`${styles.dayCell} ${cell.isCurrentMonth ? "" : styles.dayCellMuted}`}
                  >
                    {cell.dayLabel}
                    {cell.events.slice(0, 2).map((event) => (
                      <div key={event.id} className={styles.dayEvent}>
                        {event.title}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <div className={styles.sideCol}>
          <article className={styles.card}>
            <h3>Prochaines echeances</h3>
            {loading ? <p className={styles.heroSub}>Chargement du calendrier...</p> : null}
            <div className={styles.timeline}>
              {upcomingEvents.slice(0, 6).map((event) => (
                <div key={event.id} className={styles.timelineItem}>
                  <div>
                    <strong>{event.title}</strong>
                    <p className={styles.heroSub}>
                      {event.course?.title ?? "Evenement libre"} · {event.location || event.meetingUrl || "Sans lieu"}
                    </p>
                  </div>
                  <span>{formatWorkspaceDateTime(event.startsAt)}</span>
                </div>
              ))}
              {!loading && upcomingEvents.length === 0 ? (
                <p className={styles.heroSub}>Aucun evenement n est encore planifie.</p>
              ) : null}
            </div>
          </article>

          <article className={styles.card}>
            <h3>Vue rapide</h3>
            <p className={styles.heroSub}>{events.length} evenement(s) trouves dans votre agenda.</p>
            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${Math.min(events.length * 12, 100)}%` }}
              />
            </div>
          </article>
        </div>
      </div>
    </StudentShell>
  );
}

function buildMonthCells(date: Date, events: WorkspaceCalendarEventRecord[]) {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const gridStart = new Date(monthStart);
  const dayIndex = (monthStart.getDay() + 6) % 7;
  gridStart.setDate(monthStart.getDate() - dayIndex);

  const eventMap = new Map<string, WorkspaceCalendarEventRecord[]>();
  for (const event of events) {
    if (!event.startsAt) {
      continue;
    }
    const key = new Date(event.startsAt).toISOString().slice(0, 10);
    eventMap.set(key, [...(eventMap.get(key) ?? []), event]);
  }

  return Array.from({ length: 42 }).map((_, index) => {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + index);
    const key = cellDate.toISOString().slice(0, 10);

    return {
      key,
      dayLabel: String(cellDate.getDate()).padStart(2, "0"),
      events: eventMap.get(key) ?? [],
      isCurrentMonth: cellDate.getMonth() === date.getMonth(),
    };
  });
}
