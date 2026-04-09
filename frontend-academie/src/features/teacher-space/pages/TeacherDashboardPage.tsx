"use client";

import { useEffect, useMemo, useState } from "react";
import { useCurrentAuthSession } from "@/features/auth/model/useCurrentAuthSession";
import {
  fetchWorkspaceCourses,
  fetchWorkspaceEvaluationAttempts,
  fetchWorkspaceEvaluations,
  fetchWorkspaceMyCalendarEvents,
} from "@/features/workspace-data/api/workspace-api.client";
import type {
  WorkspaceCourseRecord,
  WorkspaceEvaluationAttemptRecord,
  WorkspaceEvaluationRecord,
} from "@/features/workspace-data/model/workspace-api.types";
import {
  formatWorkspaceDateTime,
  formatWorkspacePercent,
} from "@/features/workspace-data/model/workspace-ui.utils";
import styles from "../teacher-space.module.css";
import { TeacherShell } from "../components/TeacherShell";

export function TeacherDashboardPage() {
  const { user } = useCurrentAuthSession();
  const [courses, setCourses] = useState<WorkspaceCourseRecord[]>([]);
  const [evaluations, setEvaluations] = useState<WorkspaceEvaluationRecord[]>([]);
  const [attempts, setAttempts] = useState<WorkspaceEvaluationAttemptRecord[]>([]);
  const [eventsCount, setEventsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeStudents = useMemo(() => {
    return courses.reduce((sum, course) => sum + course.enrollmentsCount, 0);
  }, [courses]);
  const reviewQueue = attempts.filter((attempt) => attempt.status !== "GRADED");
  const averageProgress = useMemo(() => {
    return courses.length === 0
      ? 0
      : courses.reduce(
          (sum, course) =>
            sum +
            (course.modules.flatMap((module) => module.lessons).filter((lesson) => lesson.isPublished)
              .length /
              Math.max(course.modules.flatMap((module) => module.lessons).length, 1)) *
              100,
          0,
        ) / courses.length;
  }, [courses]);

  useEffect(() => {
    void loadDashboard();
  }, [user?.id]);

  async function loadDashboard() {
    setLoading(true);

    try {
      const [allCourses, allEvaluations, myEvents] = await Promise.all([
        fetchWorkspaceCourses(),
        fetchWorkspaceEvaluations(),
        fetchWorkspaceMyCalendarEvents(),
      ]);
      const teacherCourses = user?.id ? allCourses.filter((course) => course.creator.id === user.id) : allCourses;
      const teacherEvaluations = user?.id
        ? allEvaluations.filter((evaluation) => evaluation.creator.id === user.id)
        : allEvaluations;
      const attemptGroups = await Promise.all(
        teacherEvaluations.map((evaluation) => fetchWorkspaceEvaluationAttempts(evaluation.id)),
      );

      setCourses(teacherCourses);
      setEvaluations(teacherEvaluations);
      setAttempts(attemptGroups.flat().sort((left, right) => {
        return new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime();
      }));
      setEventsCount(user?.id ? myEvents.filter((event) => event.createdBy.id === user.id).length : myEvents.length);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de charger le dashboard Teacher.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <TeacherShell activePath="/teacher/dashboard" title="Dashboard Teacher">
      <section>
        <h2 className={styles.sectionTitle}>Vue d ensemble Teacher</h2>
        <p className={styles.sectionSub}>
          Vos cours, vos evaluations et votre file de correction sont maintenant relies aux
          donnees reelles.
        </p>
      </section>

      {errorMessage ? <p className={`${styles.sectionSub} ${styles.messageError}`}>{errorMessage}</p> : null}

      <section className={`${styles.gridKpi} ${styles.sectionSpacing}`}>
        <Kpi label="Etudiants actifs" note="Inscrits sur vos cours" value={String(activeStudents)} />
        <Kpi label="Evaluations" note="Creees par vous" value={String(evaluations.length)} />
        <Kpi label="File de correction" note="Tentatives a traiter" value={String(reviewQueue.length)} />
        <Kpi label="Progression contenu" note="Lecons publiees" value={formatWorkspacePercent(averageProgress)} />
      </section>

      <section className={styles.split}>
        <article className={styles.card}>
          <h3>Dernieres soumissions</h3>
          {loading ? <p className={styles.sectionSub}>Chargement du dashboard...</p> : null}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Etudiant</th>
                  <th>Evaluation</th>
                  <th>Soumis le</th>
                  <th>Etat</th>
                </tr>
              </thead>
              <tbody>
                {attempts.slice(0, 6).map((attempt) => (
                  <tr key={attempt.id}>
                    <td>{attempt.student.fullName}</td>
                    <td>{attempt.evaluation.title}</td>
                    <td>{formatWorkspaceDateTime(attempt.submittedAt)}</td>
                    <td>{attempt.status}</td>
                  </tr>
                ))}
                {!loading && attempts.length === 0 ? (
                  <tr>
                    <td colSpan={4}>Aucune tentative recue pour le moment.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className={styles.card}>
          <h3>Signaux rapides</h3>
          <div className={styles.signalList}>
            <Signal title="Cours en ligne" value={`${courses.filter((course) => course.isPublished).length}/${courses.length || 0}`} />
            <Signal title="Evenements planifies" value={String(eventsCount)} />
            <Signal title="Tentatives corrigees" value={String(attempts.filter((attempt) => attempt.status === "GRADED").length)} />
          </div>
        </article>
      </section>

      <section className={`${styles.card} ${styles.sectionSpacing}`}>
        <h3 className={styles.sectionTitleReset}>Etat des cours</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cours</th>
                <th>Modules</th>
                <th>Lecons</th>
                <th>Inscriptions</th>
                <th>Publication</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <strong>{course.title}</strong>
                    <p className={styles.sectionSub}>{course.shortDescription}</p>
                  </td>
                  <td>{course.modules.length}</td>
                  <td>{course.modules.flatMap((module) => module.lessons).length}</td>
                  <td>{course.enrollmentsCount}</td>
                  <td>{course.isPublished ? "Publie" : "Brouillon"}</td>
                </tr>
              ))}
              {!loading && courses.length === 0 ? (
                <tr>
                  <td colSpan={5}>Aucun cours encore cree.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </TeacherShell>
  );
}

function Kpi({
  label,
  note,
  value,
}: {
  label: string;
  note: string;
  value: string;
}) {
  return (
    <article className={styles.card}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
      <p className={styles.kpiTrend}>{note}</p>
    </article>
  );
}

function Signal({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <span className={styles.kpiLabel}>{title}</span>
      <strong className={styles.signalValue}>{value}</strong>
    </div>
  );
}
