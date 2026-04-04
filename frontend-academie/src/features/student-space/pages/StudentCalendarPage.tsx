import { calendarEvents } from "../student-space.data";
import styles from "../student-space.module.css";
import { StudentShell } from "../components/StudentShell";

const days = Array.from({ length: 35 }).map((_, index) => index + 1);

export function StudentCalendarPage() {
  return (
    <StudentShell activePath="/student/calendar" topbarTitle="Mon Planning">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>Octobre 2024</h1>
          <p className={styles.heroSub}>
            Vos sessions, mentorats et deadlines critiques.
          </p>
        </div>
        <div className={styles.actionRow}>
          <button type="button" className={styles.ghostBtn}>
            Aujourd hui
          </button>
          <button type="button" className={styles.primaryBtn}>
            Importer vers iCal
          </button>
        </div>
      </section>

      <div className={styles.grid}>
        <article className={styles.card}>
          <div className={styles.weekHeader}>
            <div>Lun</div>
            <div>Mar</div>
            <div>Mer</div>
            <div>Jeu</div>
            <div>Ven</div>
            <div>Sam</div>
            <div>Dim</div>
          </div>
          <div className={styles.monthGrid}>
            {days.map((day) => (
              <div key={day} className={styles.dayCell}>
                {day <= 31 ? String(day).padStart(2, "0") : ""}
                {day === 13 ? (
                  <div className={styles.dayEvent}>Review de Portfolio</div>
                ) : null}
                {day === 17 ? (
                  <div className={styles.dayEvent}>Design Durable v1</div>
                ) : null}
                {day === 22 ? (
                  <div className={styles.dayEvent}>Atelier Structures</div>
                ) : null}
                {day === 30 ? (
                  <div className={styles.dayEvent}>Projet Final</div>
                ) : null}
              </div>
            ))}
          </div>
        </article>

        <div className={styles.sideCol}>
          <article className={styles.card}>
            <h3>Prochaines echeances</h3>
            <div className={styles.timeline}>
              {calendarEvents.map((event) => (
                <div
                  key={`${event.day}-${event.title}`}
                  className={styles.timelineItem}
                >
                  <div>
                    <strong>{event.title}</strong>
                    <p className={styles.heroSub}>{event.detail}</p>
                  </div>
                  <span>
                    {event.day} {event.month}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.card}>
            <h3>Milestone</h3>
            <p className={styles.heroSub}>Certification niv. 1</p>
            <div
              style={{
                marginTop: 12,
                height: 8,
                borderRadius: 999,
                background: "#e6ebf5",
              }}
            >
              <div
                style={{
                  width: "75%",
                  height: "100%",
                  borderRadius: 999,
                  background: "#004ac6",
                }}
              />
            </div>
          </article>
        </div>
      </div>
    </StudentShell>
  );
}
