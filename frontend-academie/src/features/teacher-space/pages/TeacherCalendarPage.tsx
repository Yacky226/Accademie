"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createWorkspaceCalendarEvent,
  fetchWorkspaceCourses,
  fetchWorkspaceMyCalendarEvents,
} from "@/features/workspace-data/api/workspace-api.client";
import type {
  CreateWorkspaceCalendarEventPayload,
  WorkspaceCalendarEventRecord,
  WorkspaceCourseRecord,
} from "@/features/workspace-data/model/workspace-api.types";
import {
  formatWorkspaceDateTime,
  toDateTimeLocalInputValue,
} from "@/features/workspace-data/model/workspace-ui.utils";
import { useCurrentAuthSession } from "@/features/auth/model/useCurrentAuthSession";
import styles from "../teacher-space.module.css";
import { TeacherShell } from "../components/TeacherShell";

const EMPTY_EVENT: CreateWorkspaceCalendarEventPayload = {
  title: "",
  description: "",
  startsAt: new Date().toISOString(),
  endsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  timezone: "Africa/Casablanca",
  status: "SCHEDULED",
  location: "",
  meetingUrl: "",
  isAllDay: false,
  courseId: "",
};

export function TeacherCalendarPage() {
  const { user } = useCurrentAuthSession();
  const [courses, setCourses] = useState<WorkspaceCourseRecord[]>([]);
  const [events, setEvents] = useState<WorkspaceCalendarEventRecord[]>([]);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const upcomingEvents = useMemo(
    () =>
      events
        .slice()
        .sort((left, right) => new Date(left.startsAt ?? 0).getTime() - new Date(right.startsAt ?? 0).getTime()),
    [events],
  );

  useEffect(() => {
    void loadCalendar();
  }, [user?.id]);

  async function loadCalendar() {
    setLoading(true);

    try {
      const [allCourses, myEvents] = await Promise.all([
        fetchWorkspaceCourses(),
        fetchWorkspaceMyCalendarEvents(),
      ]);
      setCourses(user?.id ? allCourses.filter((course) => course.creator.id === user.id) : allCourses);
      setEvents(user?.id ? myEvents.filter((event) => event.createdBy.id === user.id) : myEvents);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de charger le calendrier.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEvent() {
    if (!eventForm.title.trim()) {
      setErrorMessage("Le titre de l evenement est obligatoire.");
      return;
    }

    setSubmitting(true);
    try {
      await createWorkspaceCalendarEvent(eventForm);
      setEventForm(EMPTY_EVENT);
      setSuccessMessage("L evenement a ete cree.");
      setErrorMessage(null);
      await loadCalendar();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de creer l evenement.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <TeacherShell activePath="/teacher/calendar" title="Calendrier Teacher">
      <section>
        <h2 className={styles.sectionTitle}>Planning pedagogique</h2>
        <p className={styles.sectionSub}>
          Planifiez vos sessions live, corrections et rendez-vous directement depuis l espace
          Teacher.
        </p>
      </section>

      {errorMessage ? <p className={`${styles.sectionSub} ${styles.messageError}`}>{errorMessage}</p> : null}
      {successMessage ? (
        <p className={`${styles.sectionSub} ${styles.messageSuccess}`}>{successMessage}</p>
      ) : null}

      <section className={styles.split}>
        <article className={styles.card}>
          <h3>Nouvel evenement</h3>
          <div className={styles.formGrid}>
            <input className={styles.input} placeholder="Titre de la session" value={eventForm.title} onChange={(event) => setEventForm((current) => ({ ...current, title: event.target.value }))} />
            <textarea className={styles.textarea} placeholder="Description" value={eventForm.description} onChange={(event) => setEventForm((current) => ({ ...current, description: event.target.value }))} />
            <select className={styles.select} value={eventForm.courseId} onChange={(event) => setEventForm((current) => ({ ...current, courseId: event.target.value }))}>
              <option value="">Sans cours rattache</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
            <input className={styles.input} type="datetime-local" value={toDateTimeLocalInputValue(eventForm.startsAt)} onChange={(event) => setEventForm((current) => ({ ...current, startsAt: new Date(event.target.value).toISOString() }))} />
            <input className={styles.input} type="datetime-local" value={toDateTimeLocalInputValue(eventForm.endsAt, 1)} onChange={(event) => setEventForm((current) => ({ ...current, endsAt: new Date(event.target.value).toISOString() }))} />
            <input className={styles.input} placeholder="Lieu ou salle" value={eventForm.location} onChange={(event) => setEventForm((current) => ({ ...current, location: event.target.value }))} />
            <input className={styles.input} placeholder="Lien visio" value={eventForm.meetingUrl} onChange={(event) => setEventForm((current) => ({ ...current, meetingUrl: event.target.value }))} />
          </div>
          <div className={styles.buttonRow}>
            <button className={styles.primaryBtn} type="button" onClick={() => void handleCreateEvent()}>
              {submitting ? "Creation..." : "Creer l evenement"}
            </button>
          </div>
        </article>

        <article className={styles.card}>
          <h3>Vue rapide</h3>
          <div className={styles.infoList}>
            <div>
              <span className={styles.kpiLabel}>Evenements planifies</span>
              <strong className={styles.kpiValue}>{events.length}</strong>
            </div>
            <div>
              <span className={styles.kpiLabel}>Avec cours rattache</span>
              <strong className={styles.kpiValue}>{events.filter((event) => event.course).length}</strong>
            </div>
            <div>
              <span className={styles.kpiLabel}>Prochaine session</span>
              <strong className={`${styles.kpiValue} ${styles.metricValueSmall}`}>
                {upcomingEvents[0] ? formatWorkspaceDateTime(upcomingEvents[0].startsAt) : "Aucune"}
              </strong>
            </div>
          </div>
        </article>
      </section>

      <section className={`${styles.card} ${styles.sectionSpacing}`}>
        <h3 className={styles.sectionTitleReset}>Evenements a venir</h3>
        {loading ? <p className={styles.sectionSub}>Chargement du planning...</p> : null}
        {!loading ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Evenement</th>
                  <th>Debut</th>
                  <th>Fin</th>
                  <th>Cours</th>
                </tr>
              </thead>
              <tbody>
                {upcomingEvents.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <strong>{event.title}</strong>
                      <p className={styles.sectionSub}>{event.location || event.meetingUrl || "Aucun lieu precise"}</p>
                    </td>
                    <td>{formatWorkspaceDateTime(event.startsAt)}</td>
                    <td>{formatWorkspaceDateTime(event.endsAt)}</td>
                    <td>{event.course?.title ?? "Libre"}</td>
                  </tr>
                ))}
                {upcomingEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4}>Aucun evenement a venir.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </TeacherShell>
  );
}
