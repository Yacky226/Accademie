import styles from "../teacher-space.module.css";
import { TeacherShell } from "../components/TeacherShell";

export function TeacherCalendarPage() {
  return (
    <TeacherShell activePath="/teacher/calendar" title="Teacher Calendar">
      <h2 className={styles.sectionTitle}>Planning Pedagogique</h2>
      <p className={styles.sectionSub}>
        Sessions live, deadlines et disponibilites mentorat.
      </p>

      <div className={styles.split}>
        <article className={styles.card}>
          <h3>Semaine en cours</h3>
          <div className={styles.timeline}>
            <div className={styles.timelineItem}>
              <strong>Lundi</strong>
              <span>Cours Microservices 10:00</span>
            </div>
            <div className={styles.timelineItem}>
              <strong>Mardi</strong>
              <span>Corrections Evaluations 14:00</span>
            </div>
            <div className={styles.timelineItem}>
              <strong>Jeudi</strong>
              <span>Mentorat equipe B 09:30</span>
            </div>
            <div className={styles.timelineItem}>
              <strong>Vendredi</strong>
              <span>Demo projet final 16:00</span>
            </div>
          </div>
        </article>

        <article className={styles.card}>
          <h3>Rappels</h3>
          <div className={styles.timeline}>
            <div className={styles.timelineItem}>
              <span className={styles.chip}>Urgent</span>
              <span>Publier notes Cohorte C</span>
            </div>
            <div className={styles.timelineItem}>
              <span className={styles.chip}>Info</span>
              <span>Preparer QCM module 6</span>
            </div>
          </div>
        </article>
      </div>
    </TeacherShell>
  );
}
