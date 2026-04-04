import {
  dashboardRecommendations,
  studentEnrolledCourses,
} from "../student-space.data";
import styles from "../student-space.module.css";
import { StudentShell } from "../components/StudentShell";

export function StudentCoursesPage() {
  const hasCourses = studentEnrolledCourses.length > 0;

  return (
    <StudentShell activePath="/student/courses" topbarTitle="My Courses">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>My Courses</h1>
          <p className={styles.heroSub}>
            Organisez votre parcours et suivez votre progression.
          </p>
        </div>

        <div className={styles.actionRow}>
          <button type="button" className={styles.ghostBtn}>
            Voir le catalogue
          </button>
          <button type="button" className={styles.primaryBtn}>
            Continuer l apprentissage
          </button>
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
              <button type="button" className={styles.primaryBtn}>
                Explorer les formations
              </button>
              <button type="button" className={styles.ghostBtn}>
                Demander un accompagnement
              </button>
            </div>
          </article>

          <aside className={styles.emptyCoursesSide}>
            <h3>Suggestions pour demarrer</h3>
            <div className={styles.emptyCoursesList}>
              {dashboardRecommendations.map((course) => (
                <article
                  key={course.title}
                  className={styles.emptySuggestionItem}
                >
                  <img src={course.imageUrl} alt={course.title} />
                  <div>
                    <p>{course.title}</p>
                    <span>
                      {course.level} • {course.hours}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </section>
      ) : (
        <section className={styles.coursesGrid}>
          {studentEnrolledCourses.map((course) => (
            <article key={course.title} className={styles.courseStatusCard}>
              <h3>{course.title}</h3>
              <p className={styles.heroSub}>Mentor: {course.mentor}</p>
              <div className={styles.courseProgressTrack}>
                <span style={{ width: `${course.progress}%` }} />
              </div>
              <p className={styles.heroSub}>
                Prochaine lecon: {course.nextLesson}
              </p>
            </article>
          ))}
        </section>
      )}
    </StudentShell>
  );
}
