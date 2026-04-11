"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/core/store/app-store-hooks";
import { useCurrentAuthSession } from "@/features/auth/model/useCurrentAuthSession";
import { useNotificationCenterState } from "@/features/notification-center/model/useNotificationCenterState";
import {
  selectStudentCourseRecommendations,
  selectStudentCoursesError,
  selectStudentCoursesStatus,
  selectStudentEnrollments,
} from "@/features/student-courses/model/student-courses.selectors";
import { fetchStudentCoursesThunk } from "@/features/student-courses/model/student-courses.slice";
import { fetchWorkspaceMyGamification } from "@/features/workspace-data/api/workspace-api.client";
import type { WorkspaceGamificationSummaryRecord } from "@/features/workspace-data/model/workspace-api.types";
import { formatWorkspaceDate } from "@/features/workspace-data/model/workspace-ui.utils";
import { StudentShell } from "../components/StudentShell";
import styles from "../student-space.module.css";

function getFirstName(name: string | null | undefined) {
  if (!name?.trim()) {
    return "Etudiant";
  }

  return name.trim().split(/\s+/)[0] ?? "Etudiant";
}

function formatXp(value: number | null | undefined) {
  if (!value) {
    return "0 XP";
  }

  return `${new Intl.NumberFormat("fr-FR").format(value)} XP`;
}

export function StudentDashboardPage() {
  const dispatch = useAppDispatch();
  const { user } = useCurrentAuthSession();
  const { items: notifications, unreadCount } = useNotificationCenterState();
  const recommendations = useAppSelector(selectStudentCourseRecommendations);
  const enrolledCourses = useAppSelector(selectStudentEnrollments);
  const coursesStatus = useAppSelector(selectStudentCoursesStatus);
  const coursesError = useAppSelector(selectStudentCoursesError);
  const [gamification, setGamification] =
    useState<WorkspaceGamificationSummaryRecord | null>(null);
  const [gamificationError, setGamificationError] = useState<string | null>(null);

  useEffect(() => {
    if (coursesStatus === "idle") {
      void dispatch(fetchStudentCoursesThunk());
    }
  }, [coursesStatus, dispatch]);

  useEffect(() => {
    let isActive = true;

    async function loadGamification() {
      try {
        const nextGamification = await fetchWorkspaceMyGamification();
        if (!isActive) {
          return;
        }

        setGamification(nextGamification);
        setGamificationError(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setGamificationError(
          error instanceof Error
            ? error.message
            : "Impossible de charger votre progression gamifiee.",
        );
      }
    }

    void loadGamification();

    return () => {
      isActive = false;
    };
  }, []);

  const averageProgress = useMemo(() => {
    if (enrolledCourses.length === 0) {
      return 0;
    }

    const progressTotal = enrolledCourses.reduce(
      (sum, course) => sum + Math.max(0, Math.min(100, course.progress)),
      0,
    );

    return Math.round(progressTotal / enrolledCourses.length);
  }, [enrolledCourses]);

  const activeCourse = enrolledCourses[0] ?? null;
  const recentNotifications = notifications.slice(0, 2);
  const topRecommendations = recommendations.slice(0, 4);
  const studentFirstName = getFirstName(user?.name);
  const heroSubtitle = activeCourse
    ? `Vous avez ${enrolledCourses.length} cours actif${enrolledCourses.length > 1 ? "s" : ""} et ${unreadCount} notification${unreadCount > 1 ? "s" : ""} a suivre.`
    : "Votre espace est pret. Commencez un premier cours pour voir votre progression ici.";

  return (
    <StudentShell activePath="/student/dashboard" topbarTitle="Dashboard">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>Bienvenue, {studentFirstName}</h1>
          <p className={styles.heroSub}>{heroSubtitle}</p>
          {coursesError ? <p className={`${styles.heroSub} ${styles.messageError}`}>{coursesError}</p> : null}
        </div>

        <div className={styles.actionRow}>
          <Link className={styles.ghostBtn} href="/formations">
            Explorer le catalogue
          </Link>
          <Link
            className={styles.primaryBtn}
            href={activeCourse ? "/student/courses" : "/formations"}
          >
            {activeCourse ? "Reprendre le cours" : "Commencer un cours"}
          </Link>
        </div>
      </section>

      <div className={styles.grid}>
        <div>
          <article className={styles.card}>
            <h3>Progression Globale</h3>
            <div
              className={styles.progressRing}
              style={{
                background: `conic-gradient(#004ac6 ${averageProgress}%, #eaf0ff 0)`,
              }}
            >
              <div className={styles.progressInner}>{averageProgress}%</div>
            </div>
            <p className={styles.heroSub}>
              {enrolledCourses.length > 0
                ? `${enrolledCourses.length} cours en progression dans votre espace.`
                : "Aucun cours actif pour le moment."}
            </p>
          </article>

          <article className={styles.resumeCard}>
            <p className={styles.resumeEyebrow}>Reprendre la ou vous vous etes arrete</p>
            <h4 className={styles.resumeTitle}>
              {activeCourse ? activeCourse.title : "Aucun parcours demarre"}
            </h4>
            <p className={styles.resumeMeta}>
              {activeCourse
                ? `Prochaine etape: ${activeCourse.nextLesson}`
                : "Inscrivez-vous a une formation pour suivre vos prochaines etapes ici."}
            </p>
          </article>

          <article className={styles.card}>
            <h3>Mon niveau de progression</h3>
            {gamificationError ? (
              <p className={`${styles.heroSub} ${styles.messageError}`}>{gamificationError}</p>
            ) : null}
            <div className={styles.gamificationMetricGrid}>
              <div className={styles.gamificationMetric}>
                <span>Niveau</span>
                <strong>
                  {gamification ? `Lv.${gamification.level} ${gamification.levelLabel}` : "--"}
                </strong>
              </div>
              <div className={styles.gamificationMetric}>
                <span>Rang</span>
                <strong>{gamification?.rank ? `#${gamification.rank}` : "--"}</strong>
              </div>
              <div className={styles.gamificationMetric}>
                <span>XP</span>
                <strong>{gamification ? formatXp(gamification.totalXp) : "--"}</strong>
              </div>
              <div className={styles.gamificationMetric}>
                <span>Serie</span>
                <strong>{gamification?.activityStreakDays ?? 0} j</strong>
              </div>
              <div className={styles.gamificationMetric}>
                <span>Problemes resolus</span>
                <strong>{gamification?.solvedProblemsCount ?? 0}</strong>
              </div>
            </div>
            <p className={styles.heroSub}>
              {gamification
                ? `${gamification.acceptedSubmissionsCount} soumission(s) acceptee(s) et ${gamification.publishedGradesCount} note(s) publiee(s) comptent actuellement dans votre score.`
                : "Vos soumissions et vos notes publiees alimenteront votre score des la premiere activite."}
            </p>
            {gamification ? (
              <div className={styles.gamificationLevelCard}>
                <div className={styles.gamificationLevelHeader}>
                  <strong>
                    Niveau {gamification.level} · {gamification.levelLabel}
                  </strong>
                  <span>
                    {formatXp(gamification.totalXp)} / {formatXp(gamification.nextLevelXpTarget)}
                  </span>
                </div>
                <div className={styles.leaderboardProgressBar}>
                  <span style={{ width: `${gamification.progressToNextLevel}%` }} />
                </div>
                <p className={styles.heroSub}>
                  {gamification.nextLevelXpTarget > gamification.totalXp
                    ? `${formatXp(gamification.nextLevelXpTarget - gamification.totalXp)} pour atteindre le niveau suivant.`
                    : "Niveau maximum actuel atteint."}
                </p>
              </div>
            ) : null}
            {gamification?.badges.length ? (
              <div className={styles.leaderboardBadgeList}>
                {gamification.badges.map((badge) => (
                  <span key={badge} className={styles.leaderboardBadge}>
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}
            <div className={`${styles.actionRow} ${styles.actionRowSpaced}`}>
              <Link className={styles.ghostBtn} href="/student/leaderboard">
                Voir le classement
              </Link>
              <Link className={styles.primaryBtn} href="/student/problems">
                Gagner du XP
              </Link>
            </div>
          </article>
        </div>

        <div>
          <article className={styles.card}>
            <h3>Activite recente</h3>
            <div className={styles.timeline}>
              {recentNotifications.length > 0 ? (
                recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`${styles.timelineItem} ${
                      notification.unread ? "" : styles.timelineMuted
                    }`}
                  >
                    <div>
                      <strong>{notification.title}</strong>
                      <p className={styles.heroSub}>{notification.description}</p>
                    </div>
                    <span>{notification.unread ? "New" : notification.time}</span>
                  </div>
                ))
              ) : (
                <div className={`${styles.timelineItem} ${styles.timelineMuted}`}>
                  <div>
                    <strong>Aucune activite recente</strong>
                    <p className={styles.heroSub}>
                      Vos rappels, notifications et mises a jour apparaitront ici.
                    </p>
                  </div>
                  <span>Calme</span>
                </div>
              )}
            </div>
          </article>

          <article className={styles.card}>
            <h3>Achievements recents</h3>
            <div className={styles.achievementList}>
              {gamification?.achievements.length ? (
                gamification.achievements.slice(0, 5).map((achievement) => (
                  <div key={achievement.key} className={styles.achievementItem}>
                    <span
                      className={`${styles.achievementTone} ${
                        achievement.tone === "streak"
                          ? styles.achievementToneStreak
                          : achievement.tone === "solver"
                            ? styles.achievementToneSolver
                            : achievement.tone === "grade"
                              ? styles.achievementToneGrade
                              : achievement.tone === "rank"
                                ? styles.achievementToneRank
                                : styles.achievementToneXp
                      }`}
                    >
                      {achievement.label}
                    </span>
                    <div className={styles.achievementCopy}>
                      <strong>{achievement.description}</strong>
                      <p>{formatWorkspaceDate(achievement.unlockedAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.achievementItem}>
                  <span className={`${styles.achievementTone} ${styles.achievementToneXp}`}>
                    A venir
                  </span>
                  <div className={styles.achievementCopy}>
                    <strong>Vos prochains achievements apparaitront ici.</strong>
                    <p>Soumettez un probleme ou validez une evaluation pour debloquer les premiers paliers.</p>
                  </div>
                </div>
              )}
            </div>
          </article>

          <article className={styles.card}>
            <h3>Recommande pour votre niveau</h3>
            <div className={styles.courseGrid}>
              {topRecommendations.length > 0 ? (
                topRecommendations.map((course) => (
                  <div key={course.id} className={styles.courseCard}>
                    <Image
                      className={styles.courseImage}
                      src={course.imageUrl}
                      alt={course.title}
                      height={720}
                      sizes="(max-width: 768px) 100vw, 280px"
                      width={1280}
                    />
                    <div className={styles.courseBody}>
                      <span className={styles.levelPill}>{course.level}</span>
                      <h4>{course.title}</h4>
                      <p className={styles.heroSub}>{course.description}</p>
                      <p className={styles.courseMetaValue}>{course.hours}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.courseCard}>
                  <div className={styles.courseBody}>
                    <h4>Aucune recommandation disponible</h4>
                    <p className={styles.heroSub}>
                      Les suggestions apparaitront ici des qu un catalogue publie sera disponible.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    </StudentShell>
  );
}
