"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch } from "@/core/store/app-store-hooks";
import type { NotificationItem } from "@/features/notification-center/model/notification-center.catalog";
import { fetchNotificationCenterThunk } from "@/features/notification-center/model/notification-center.slice";
import { useNotificationCenterState } from "@/features/notification-center/model/useNotificationCenterState";
import {
  fetchWorkspaceMyCalendarEvents,
  fetchWorkspaceMyEnrollments,
  fetchWorkspacePrograms,
  updateWorkspaceProgramStepProgress,
} from "@/features/workspace-data/api/workspace-api.client";
import type {
  WorkspaceCalendarEventRecord,
  WorkspaceEnrollmentRecord,
  WorkspaceProgramRecord,
} from "@/features/workspace-data/model/workspace-api.types";
import {
  formatWorkspaceDate,
  formatWorkspaceDateTime,
} from "@/features/workspace-data/model/workspace-ui.utils";
import styles from "../student-space.module.css";
import { StudentShell } from "../components/StudentShell";

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const CALENDAR_FILTERS = [
  { id: "all", label: "Tout" },
  { id: "session", label: "Sessions" },
  { id: "deadline", label: "Taches" },
  { id: "notification", label: "Notifs" },
] as const;

type CalendarFilterId = (typeof CALENDAR_FILTERS)[number]["id"];
type CalendarEntryKind = "session" | "deadline" | "notification";
type CalendarEntryStatus = "scheduled" | "due-soon" | "overdue";

interface CalendarEntry {
  id: string;
  kind: CalendarEntryKind;
  status: CalendarEntryStatus;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string | null;
  dayKey: string;
  badge: string;
  meta: string;
  actionHref?: string;
  actionLabel?: string;
  programId?: string;
  stepId?: string;
  stepStatus?: string;
}

function toDayKey(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString().slice(0, 10);
}

function readMetadataString(
  metadata: Record<string, unknown> | undefined,
  key: string,
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function getDeadlineStatus(dueDate: string): CalendarEntryStatus {
  const dueTimestamp = new Date(dueDate).getTime();
  const now = Date.now();

  if (dueTimestamp < now) {
    return "overdue";
  }

  if (dueTimestamp - now <= 1000 * 60 * 60 * 48) {
    return "due-soon";
  }

  return "scheduled";
}

function buildEventEntries(events: WorkspaceCalendarEventRecord[]): CalendarEntry[] {
  return events
    .filter((event) => toDayKey(event.startsAt))
    .map((event) => ({
      id: `session-${event.id}`,
      kind: "session" as const,
      status: "scheduled" as const,
      title: event.title,
      description:
        event.description ||
        event.location ||
        event.meetingUrl ||
        "Session planifiee dans votre calendrier.",
      startsAt: event.startsAt ?? new Date().toISOString(),
      endsAt: event.endsAt,
      dayKey: toDayKey(event.startsAt) ?? "",
      badge: "Session",
      meta:
        event.course?.title ??
        event.location ??
        event.meetingUrl ??
        "Agenda",
      actionHref: event.meetingUrl || undefined,
      actionLabel: event.meetingUrl ? "Ouvrir le lien" : undefined,
    }));
}

function buildProgramDeadlineEntries(programs: WorkspaceProgramRecord[]): CalendarEntry[] {
  return programs.flatMap((program) =>
    program.steps
      .filter(
        (step) =>
          Boolean(step.dueDate) &&
          step.status !== "COMPLETED" &&
          step.status !== "SKIPPED",
      )
      .map((step) => ({
        id: `deadline-${step.id}`,
        kind: "deadline" as const,
        status: getDeadlineStatus(step.dueDate ?? new Date().toISOString()),
        title: step.title,
        description:
          step.description ||
          `Etape a completer pour le programme ${program.title}.`,
        startsAt: step.dueDate ?? new Date().toISOString(),
        dayKey: toDayKey(step.dueDate) ?? "",
        badge: "Deadline",
        meta: program.title,
        programId: program.id,
        stepId: step.id,
        stepStatus: step.status,
      })),
  );
}

function buildReminderEntries(
  notifications: NotificationItem[],
): CalendarEntry[] {
  const entries: CalendarEntry[] = [];

  notifications.forEach((notification) => {
    const metadata = notification.metadata;
    const source = readMetadataString(metadata, "source");
    const dueDate = readMetadataString(metadata, "dueDate");
    const dayKey = toDayKey(dueDate);

    if (source !== "program-step" || !dueDate || !dayKey) {
      return;
    }

    entries.push({
      id: `notification-${notification.id}`,
      kind: "notification",
      status: getDeadlineStatus(dueDate),
      title: notification.title,
      description: notification.description,
      startsAt: dueDate,
      dayKey,
      badge: notification.unread ? "Rappel" : "Info",
      meta: readMetadataString(metadata, "programTitle") ?? "Programme",
      actionHref: notification.actionHref,
      actionLabel: notification.actionLabel,
      programId: readMetadataString(metadata, "programId"),
      stepId: readMetadataString(metadata, "stepId"),
    });
  });

  return entries;
}

function buildMonthCells(date: Date, entries: CalendarEntry[]) {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const gridStart = new Date(monthStart);
  const dayIndex = (monthStart.getDay() + 6) % 7;
  gridStart.setDate(monthStart.getDate() - dayIndex);

  const entryMap = new Map<string, CalendarEntry[]>();
  for (const entry of entries) {
    entryMap.set(entry.dayKey, [...(entryMap.get(entry.dayKey) ?? []), entry]);
  }

  return Array.from({ length: 42 }).map((_, index) => {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + index);
    const key = cellDate.toISOString().slice(0, 10);

    return {
      key,
      dayLabel: String(cellDate.getDate()).padStart(2, "0"),
      entries: (entryMap.get(key) ?? []).sort(
        (left, right) =>
          new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
      ),
      isCurrentMonth: cellDate.getMonth() === date.getMonth(),
      isToday: key === new Date().toISOString().slice(0, 10),
    };
  });
}

export function StudentCalendarPage() {
  const dispatch = useAppDispatch();
  const {
    items: notifications,
    status: notificationStatus,
    errorMessage: notificationError,
  } = useNotificationCenterState();
  const [events, setEvents] = useState<WorkspaceCalendarEventRecord[]>([]);
  const [programs, setPrograms] = useState<WorkspaceProgramRecord[]>([]);
  const [enrollments, setEnrollments] = useState<WorkspaceEnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStepId, setUpdatingStepId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<CalendarFilterId>("all");
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadCalendarWorkspace();
  }, []);

  async function loadCalendarWorkspace() {
    setLoading(true);

    try {
      const [nextEvents, nextPrograms, nextEnrollments] = await Promise.all([
        fetchWorkspaceMyCalendarEvents(),
        fetchWorkspacePrograms(),
        fetchWorkspaceMyEnrollments(),
      ]);

      setEvents(nextEvents);
      setPrograms(nextPrograms);
      setEnrollments(nextEnrollments);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de charger votre planning.",
      );
    } finally {
      setLoading(false);
    }
  }

  const sessionEntries = useMemo(() => buildEventEntries(events), [events]);
  const deadlineEntries = useMemo(
    () => buildProgramDeadlineEntries(programs),
    [programs],
  );
  const reminderEntries = useMemo(
    () => buildReminderEntries(notifications),
    [notifications],
  );

  const allEntries = useMemo(
    () =>
      [...sessionEntries, ...deadlineEntries, ...reminderEntries].sort(
        (left, right) =>
          new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
      ),
    [deadlineEntries, reminderEntries, sessionEntries],
  );

  const visibleEntries = useMemo(() => {
    if (activeFilter === "all") {
      return allEntries;
    }

    return allEntries.filter((entry) => entry.kind === activeFilter);
  }, [activeFilter, allEntries]);

  const filterCounts = useMemo(
    () => ({
      all: allEntries.length,
      session: sessionEntries.length,
      deadline: deadlineEntries.length,
      notification: reminderEntries.length,
    }),
    [allEntries.length, deadlineEntries.length, reminderEntries.length, sessionEntries.length],
  );

  const monthCells = useMemo(
    () => buildMonthCells(viewDate, visibleEntries),
    [viewDate, visibleEntries],
  );

  const selectedDayEntries = useMemo(
    () => visibleEntries.filter((entry) => entry.dayKey === selectedDayKey),
    [selectedDayKey, visibleEntries],
  );

  const upcomingDeadlines = useMemo(
    () =>
      deadlineEntries
        .slice()
        .sort(
          (left, right) =>
            new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
        )
        .slice(0, 6),
    [deadlineEntries],
  );

  const reminderNotifications = useMemo(
    () => reminderEntries.slice(0, 5),
    [reminderEntries],
  );

  const activeEnrollments = useMemo(
    () => enrollments.filter((enrollment) => enrollment.status !== "CANCELLED"),
    [enrollments],
  );

  async function handleStepProgress(
    programId: string,
    stepId: string,
    status: "IN_PROGRESS" | "COMPLETED",
  ) {
    setUpdatingStepId(stepId);

    try {
      const updatedProgram = await updateWorkspaceProgramStepProgress(
        programId,
        stepId,
        { status },
      );
      setPrograms((current) =>
        current.map((program) =>
          program.id === updatedProgram.id ? updatedProgram : program,
        ),
      );
      setSuccessMessage(
        status === "COMPLETED"
          ? "La tache a ete marquee comme terminee."
          : "La tache est maintenant en cours.",
      );
      setErrorMessage(null);
      await dispatch(fetchNotificationCenterThunk());
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de mettre a jour cette tache.",
      );
    } finally {
      setUpdatingStepId(null);
    }
  }

  return (
    <StudentShell activePath="/student/calendar" topbarTitle="Mon Planning">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>
            {new Intl.DateTimeFormat("fr-FR", {
              month: "long",
              year: "numeric",
            }).format(viewDate)}
          </h1>
          <p className={styles.heroSub}>
            Votre calendrier centralise les sessions de formation, les dates
            limites de vos taches et les rappels lies a vos formations
            souscrites.
          </p>
          {errorMessage ? (
            <p className={`${styles.heroSub} ${styles.messageError}`}>
              {errorMessage}
            </p>
          ) : null}
          {notificationError ? (
            <p className={`${styles.heroSub} ${styles.messageError}`}>
              {notificationError}
            </p>
          ) : null}
          {successMessage ? (
            <p className={`${styles.heroSub} ${styles.messageSuccess}`}>
              {successMessage}
            </p>
          ) : null}
        </div>

        <div className={styles.calendarHeroStats}>
          <article className={styles.calendarHeroStatCard}>
            <span>Formations actives</span>
            <strong>{activeEnrollments.length}</strong>
            <small>Abonnements en cours</small>
          </article>
          <article className={styles.calendarHeroStatCard}>
            <span>Taches a faire</span>
            <strong>{deadlineEntries.length}</strong>
            <small>Avec echeance</small>
          </article>
          <article className={styles.calendarHeroStatCard}>
            <span>Rappels</span>
            <strong>{reminderEntries.filter((entry) => entry.status !== "scheduled").length}</strong>
            <small>Notifs d echeance</small>
          </article>
        </div>
      </section>

      <section className={styles.calendarToolbar}>
        <div className={styles.actionRow}>
          <button
            className={styles.ghostBtn}
            type="button"
            onClick={() =>
              setViewDate(
                (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
              )
            }
          >
            Mois precedent
          </button>
          <button
            className={styles.primaryBtn}
            type="button"
            onClick={() => {
              const today = new Date();
              setViewDate(today);
              setSelectedDayKey(today.toISOString().slice(0, 10));
            }}
          >
            Aujourd hui
          </button>
          <button
            className={styles.ghostBtn}
            type="button"
            onClick={() =>
              setViewDate(
                (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
              )
            }
          >
            Mois suivant
          </button>
        </div>

        <div className={styles.problemLibraryFilterRow}>
          {CALENDAR_FILTERS.map((filter) => (
            <button
              key={filter.id}
              aria-pressed={activeFilter === filter.id}
              className={
                activeFilter === filter.id
                  ? styles.problemLibraryFilterChipActive
                  : styles.problemLibraryFilterChip
              }
              onClick={() => setActiveFilter(filter.id)}
              type="button"
            >
              {filter.label}
              <span>{filterCounts[filter.id]}</span>
            </button>
          ))}
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
                  <button
                    key={cell.key}
                    className={`${styles.dayCell} ${
                      cell.isCurrentMonth ? "" : styles.dayCellMuted
                    } ${cell.isToday ? styles.dayCellToday : ""} ${
                      cell.key === selectedDayKey ? styles.dayCellSelected : ""
                    }`}
                    onClick={() => setSelectedDayKey(cell.key)}
                    type="button"
                  >
                    <span className={styles.calendarDayLabel}>{cell.dayLabel}</span>
                    {cell.entries.slice(0, 3).map((entry) => (
                      <span
                        key={entry.id}
                        className={`${styles.dayEvent} ${
                          entry.kind === "session"
                            ? styles.dayEventSession
                            : entry.kind === "notification"
                              ? styles.dayEventNotification
                              : entry.status === "overdue"
                                ? styles.dayEventOverdue
                                : styles.dayEventDeadline
                        }`}
                      >
                        {entry.title}
                      </span>
                    ))}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </article>

        <div className={styles.sideCol}>
          <article className={styles.card}>
            <h3>Jour selectionne</h3>
            <p className={styles.heroSub}>{formatWorkspaceDate(selectedDayKey)}</p>
            {loading || notificationStatus === "loading" ? (
              <p className={styles.heroSub}>Chargement de l agenda...</p>
            ) : null}
            <div className={styles.timeline}>
              {selectedDayEntries.map((entry) => (
                <div key={entry.id} className={styles.timelineItem}>
                  <div>
                    <strong>{entry.title}</strong>
                    <p className={styles.heroSub}>{entry.description}</p>
                    <p className={styles.heroSub}>
                      {entry.badge} · {entry.meta}
                    </p>
                  </div>
                  <span>{formatWorkspaceDateTime(entry.startsAt)}</span>
                </div>
              ))}
              {!loading && selectedDayEntries.length === 0 ? (
                <p className={styles.heroSub}>
                  Aucun element sur cette journee avec le filtre actuel.
                </p>
              ) : null}
            </div>
          </article>

          <article className={styles.card}>
            <h3>Echeances a traiter</h3>
            <div className={styles.calendarTaskList}>
              {upcomingDeadlines.map((entry) => (
                <article key={entry.id} className={styles.calendarTaskCard}>
                  <div className={styles.calendarTaskHeader}>
                    <div>
                      <strong>{entry.title}</strong>
                      <p className={styles.heroSub}>{entry.meta}</p>
                    </div>
                    <span
                      className={
                        entry.status === "overdue"
                          ? styles.calendarStatusDanger
                          : entry.status === "due-soon"
                            ? styles.calendarStatusWarning
                            : styles.calendarStatusNeutral
                      }
                    >
                      {entry.status === "overdue"
                        ? "En retard"
                        : entry.status === "due-soon"
                          ? "Urgent"
                          : "Planifiee"}
                    </span>
                  </div>
                  <p className={styles.heroSub}>{entry.description}</p>
                  <p className={styles.heroSub}>
                    Echeance: {formatWorkspaceDateTime(entry.startsAt)}
                  </p>
                  <div className={styles.actionRow}>
                    {entry.programId && entry.stepId && entry.stepStatus !== "IN_PROGRESS" ? (
                      <button
                        className={styles.ghostBtn}
                        disabled={updatingStepId === entry.stepId}
                        onClick={() =>
                          void handleStepProgress(
                            entry.programId ?? "",
                            entry.stepId ?? "",
                            "IN_PROGRESS",
                          )
                        }
                        type="button"
                      >
                        {updatingStepId === entry.stepId ? "Mise a jour..." : "Demarrer"}
                      </button>
                    ) : null}
                    {entry.programId && entry.stepId ? (
                      <button
                        className={styles.primaryBtn}
                        disabled={updatingStepId === entry.stepId}
                        onClick={() =>
                          void handleStepProgress(
                            entry.programId ?? "",
                            entry.stepId ?? "",
                            "COMPLETED",
                          )
                        }
                        type="button"
                      >
                        {updatingStepId === entry.stepId ? "Validation..." : "Terminee"}
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
              {!loading && upcomingDeadlines.length === 0 ? (
                <p className={styles.heroSub}>
                  Aucune tache avec echeance immediate pour le moment.
                </p>
              ) : null}
            </div>
          </article>

          <article className={styles.card}>
            <h3>Rappels de calendrier</h3>
            <div className={styles.timeline}>
              {reminderNotifications.map((entry) => (
                <div key={entry.id} className={styles.timelineItem}>
                  <div>
                    <strong>{entry.title}</strong>
                    <p className={styles.heroSub}>{entry.description}</p>
                  </div>
                  <span>{formatWorkspaceDate(entry.startsAt)}</span>
                </div>
              ))}
              {notificationStatus === "succeeded" && reminderNotifications.length === 0 ? (
                <p className={styles.heroSub}>
                  Aucune notification d echeance a afficher.
                </p>
              ) : null}
            </div>
          </article>

          <article className={styles.card}>
            <h3>Formations suivies</h3>
            <div className={styles.calendarEnrollmentList}>
              {activeEnrollments.map((enrollment) => (
                <div key={enrollment.id} className={styles.calendarEnrollmentCard}>
                  <strong>{enrollment.course.title}</strong>
                  <p className={styles.heroSub}>
                    {enrollment.progressPercent}% complete · {enrollment.course.nextLessonTitle ?? "Aucune prochaine lecon"}
                  </p>
                </div>
              ))}
              {!loading && activeEnrollments.length === 0 ? (
                <p className={styles.heroSub}>
                  Aucune formation active. <Link href="/formations">Explorer le catalogue</Link>
                </p>
              ) : null}
            </div>
          </article>
        </div>
      </div>
    </StudentShell>
  );
}
