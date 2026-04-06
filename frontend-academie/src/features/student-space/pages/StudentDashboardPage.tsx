import Image from "next/image";
import { dashboardRecommendations } from "../model/student-workspace.catalog";
import styles from "../student-space.module.css";
import { StudentShell } from "../components/StudentShell";

export function StudentDashboardPage() {
  return (
    <StudentShell activePath="/student/dashboard" topbarTitle="Dashboard">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>Bienvenue, Jean-Sebastien</h1>
          <p className={styles.heroSub}>
            Pret pour une nouvelle session d architecture systeme ?
          </p>
        </div>

        <div className={styles.actionRow}>
          <button type="button" className={styles.ghostBtn}>
            Full Report
          </button>
          <button type="button" className={styles.primaryBtn}>
            Reprendre le cours
          </button>
        </div>
      </section>

      <div className={styles.grid}>
        <div>
          <article className={styles.card}>
            <h3>Progression Globale</h3>
            <div className={styles.progressRing}>
              <div className={styles.progressInner}>75%</div>
            </div>
          </article>

          <article className={styles.resumeCard}>
            <p style={{ opacity: 0.75 }}>
              Reprendre la ou vous vous etes arrete
            </p>
            <h4 style={{ marginTop: 8 }}>Architectures Microservices</h4>
            <p style={{ fontSize: "0.78rem", opacity: 0.8, marginTop: 4 }}>
              Lecon 4: Event-Driven Design
            </p>
          </article>
        </div>

        <div>
          <article className={styles.card}>
            <h3>Prochaines echeances</h3>
            <div className={styles.timeline}>
              <div className={styles.timelineItem}>
                <div>
                  <strong>Soumission du Projet Final</strong>
                  <p className={styles.heroSub}>
                    Design System Engineering - Phase 1
                  </p>
                </div>
                <span>Urgent</span>
              </div>
              <div className={`${styles.timelineItem} ${styles.timelineMuted}`}>
                <div>
                  <strong>Session Mentorat Individualisee</strong>
                  <p className={styles.heroSub}>
                    Revue de code avec Sarah Jenkins
                  </p>
                </div>
                <span>14:00</span>
              </div>
            </div>
          </article>

          <article className={styles.card}>
            <h3>Recommande pour votre niveau</h3>
            <div className={styles.courseGrid}>
              {dashboardRecommendations.map((course) => (
                <div key={course.title} className={styles.courseCard}>
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
                    <p
                      style={{
                        marginTop: 8,
                        fontWeight: 700,
                        color: "#004ac6",
                      }}
                    >
                      {course.hours}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </StudentShell>
  );
}
