"use client";

import {
  teacherCourseLessons,
  teacherCourseMetrics,
  teacherCourseProgressMetrics,
  teacherModuleInsightSeries,
} from "../teacher-space.data";
import styles from "../teacher-space.module.css";
import { TeacherShell } from "../components/TeacherShell";

function toStatusKey(status: string) {
  return status.replace(/[^a-zA-Z0-9]+/g, "");
}

export function TeacherProgramsPage() {
  return (
    <TeacherShell activePath="/teacher/programs" title="Course Management">
      <section className={styles.courseMgmtHeader}>
        <div>
          <p className={styles.courseMgmtBreadcrumbs}>
            Academy / Management / Structural Engineering Masterclass
          </p>
          <h2 className={styles.sectionTitle}>Course Management</h2>
          <p className={styles.sectionSub}>
            Manage modules, lessons, and content for the professional structural
            certification track.
          </p>
        </div>
        <div className={styles.courseMgmtActions}>
          <button type="button" className={styles.ghostBtn}>
            Preview Course
          </button>
          <button type="button" className={styles.primaryBtn}>
            New Lesson
          </button>
        </div>
      </section>

      <section className={styles.courseMgmtStatsGrid}>
        {teacherCourseMetrics.map((metric) => (
          <article
            key={metric.label}
            className={`${styles.courseMetricCard} ${
              metric.tone === "secondary"
                ? styles.courseMetricCardSecondary
                : ""
            }`}
          >
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.note}</span>
          </article>
        ))}
      </section>

      <section className={styles.courseLedgerCard}>
        <header className={styles.courseLedgerHead}>
          <h3>Curriculum Structure</h3>
          <div className={styles.courseLedgerTools}>
            <button type="button">Filter</button>
            <button type="button">More</button>
          </div>
        </header>

        <div className={styles.courseLedgerScroller}>
          <table className={styles.courseLedgerTable}>
            <thead>
              <tr>
                <th>Index</th>
                <th>Lesson Title and Module</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teacherCourseLessons.map((lesson) => (
                <tr key={lesson.index}>
                  <td>{lesson.index}</td>
                  <td>
                    <div className={styles.courseLessonCell}>
                      <div className={styles.courseLessonIcon}>
                        {lesson.type.slice(0, 1)}
                      </div>
                      <div>
                        <strong>{lesson.title}</strong>
                        <p>Module: {lesson.module}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.courseTypePill}>{lesson.type}</span>
                  </td>
                  <td>{lesson.duration}</td>
                  <td>
                    <span
                      className={`${styles.courseStatusPill} ${styles[`courseStatus_${toStatusKey(lesson.status)}`]}`}
                    >
                      {lesson.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.courseRowActions}>
                      <button type="button">Edit</button>
                      <button type="button">Duplicate</button>
                      <button type="button">Preview</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className={styles.courseLedgerFooter}>
          <p>Showing 1-4 of 24 lessons</p>
          <div>
            <button type="button">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
          </div>
        </footer>
      </section>

      <section className={styles.courseLowerGrid}>
        <article className={styles.courseInsightCard}>
          <div className={styles.courseInsightHead}>
            <div>
              <h4>Active Module Insight</h4>
              <p>Performance and engagement for Fundamentals of Statics.</p>
            </div>
            <button type="button" className={styles.teacherLinkButton}>
              View Full Report
            </button>
          </div>
          <div className={styles.courseInsightBars}>
            {teacherModuleInsightSeries.map((value, index) => (
              <span
                key={`${index + 1}-${value}`}
                style={{ height: `${value}%` }}
              />
            ))}
          </div>
          <div className={styles.courseInsightLegend}>
            <span>Lesson 01.1</span>
            <span>Daily Completion Rate</span>
            <span>Lesson 01.7</span>
          </div>
        </article>

        <article className={styles.courseProgressCard}>
          <h4>Course Progress</h4>
          <div className={styles.courseProgressList}>
            {teacherCourseProgressMetrics.map((item) => (
              <div key={item.label}>
                <div className={styles.courseProgressRow}>
                  <span>{item.label}</span>
                  <strong>{item.valueLabel}</strong>
                </div>
                <div className={styles.courseProgressTrack}>
                  <span
                    className={
                      item.tone === "secondary"
                        ? styles.courseProgressSecondary
                        : ""
                    }
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button type="button" className={styles.courseProgressAction}>
            Manage Course Assets
          </button>
        </article>
      </section>
    </TeacherShell>
  );
}
