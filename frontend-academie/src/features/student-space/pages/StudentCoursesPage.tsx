"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/core/store/app-store-hooks";
import {
  selectStudentCourseRecommendations,
  selectStudentCoursesError,
  selectStudentCoursesStatus,
  selectStudentEnrollments,
} from "@/features/student-courses/model/student-courses.selectors";
import { fetchStudentCoursesThunk } from "@/features/student-courses/model/student-courses.slice";
import { StudentShell } from "../components/StudentShell";
import styles from "../student-space.module.css";

export function StudentCoursesPage() {
  const dispatch = useAppDispatch();
  const recommendations = useAppSelector(selectStudentCourseRecommendations);
  const enrolledCourses = useAppSelector(selectStudentEnrollments);
  const status = useAppSelector(selectStudentCoursesStatus);
  const errorMessage = useAppSelector(selectStudentCoursesError);
  const hasCourses = enrolledCourses.length > 0;

  useEffect(() => {
    if (status === "idle") {
      void dispatch(fetchStudentCoursesThunk());
    }
  }, [dispatch, status]);

  return (
    <StudentShell activePath="/student/courses" topbarTitle="My Courses">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>My Courses</h1>
          <p className={styles.heroSub}>
            Organisez votre parcours et suivez votre progression.
          </p>
          {errorMessage ? <p className={styles.heroSub}>{errorMessage}</p> : null}
        </div>

        <div className={styles.actionRow}>
          <Link className={styles.ghostBtn} href="/formations">
            Voir le catalogue
          </Link>
          <Link
            className={styles.primaryBtn}
            href={hasCourses ? "/student/problems" : "/formations"}
          >
            Continuer l apprentissage
          </Link>
        </div>
      </section>

      {!hasCourses ? (
        <section className={styles.emptyCoursesWrap}>
          <article className={styles.emptyCoursesCard}>
            <span className={styles.emptyCoursesKicker}>Etat Initial</span>
            <h2>Vous n avez pas encore de cours actifs</h2>
            <p>
              Commencez avec une formation recommandee pour debloquer votre
              tableau de progression, vos sessions live et vos jalons.
            </p>

            <div className={styles.emptyCoursesStats}>
              <div>
                <small>Cours actifs</small>
                <strong>0</strong>
              </div>
              <div>
                <small>Progression moyenne</small>
                <strong>0%</strong>
              </div>
              <div>
                <small>Heures planifiees</small>
                <strong>0h</strong>
              </div>
            </div>

            <div className={styles.emptyCoursesActions}>
              <Link className={styles.primaryBtn} href="/formations">
                Explorer les formations
              </Link>
              <Link className={styles.ghostBtn} href="/student/support">
                Demander un accompagnement
              </Link>
            </div>
          </article>

          <aside className={styles.emptyCoursesSide}>
            <h3>Suggestions pour demarrer</h3>
            <div className={styles.emptyCoursesList}>
              {recommendations.map((course) => (
                <article key={course.id} className={styles.emptySuggestionItem}>
                  <img src={course.imageUrl} alt={course.title} />
                  <div>
                    <p>{course.title}</p>
                    <span>
                      {course.level} â€¢ {course.hours}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </section>
      ) : (
        <section className={styles.coursesGrid}>
          {enrolledCourses.map((course) => (
            <article key={course.id} className={styles.courseStatusCard}>
              <h3>{course.title}</h3>
              <p className={styles.heroSub}>Mentor: {course.mentor}</p>
              <div className={styles.courseProgressTrack}>
                <span style={{ width: `${course.progress}%` }} />
              </div>
              <p className={styles.heroSub}>Prochaine lecon: {course.nextLesson}</p>
            </article>
          ))}
        </section>
      )}
    </StudentShell>
  );
}
