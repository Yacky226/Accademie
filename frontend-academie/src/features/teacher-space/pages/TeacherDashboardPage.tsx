"use client";

import {
  teacherDashboardStats,
  teacherQuickInsights,
  teacherRecentSubmissions,
} from "../teacher-space.data";
import styles from "../teacher-space.module.css";
import { TeacherShell } from "../components/TeacherShell";

function toStatusKey(status: string) {
  return status.replace(/[^a-zA-Z0-9]+/g, "");
}

export function TeacherDashboardPage() {
  return (
    <TeacherShell activePath="/teacher/dashboard" title="Teacher Dashboard">
      <section className={styles.teacherDashboardStatsGrid}>
        <article className={styles.teacherLargeStatCard}>
          <p>{teacherDashboardStats[0].label}</p>
          <h3>{teacherDashboardStats[0].value}</h3>
          <span className={styles.teacherTrendSuccess}>
            {teacherDashboardStats[0].trend}
          </span>
        </article>

        <article className={styles.teacherStatCard}>
          <p>{teacherDashboardStats[1].label}</p>
          <h3>{teacherDashboardStats[1].value}</h3>
          <span>{teacherDashboardStats[1].trend}</span>
        </article>

        <article className={styles.teacherRiskCard}>
          <p>{teacherDashboardStats[2].label}</p>
          <h3>{teacherDashboardStats[2].value}</h3>
          <span>{teacherDashboardStats[2].trend}</span>
        </article>
      </section>

      <section className={styles.teacherMiddleGrid}>
        <article className={styles.teacherChartCard}>
          <div className={styles.teacherChartHead}>
            <div>
              <h3>Engagement Over Time</h3>
              <p>Student interaction across all 2024 cohorts</p>
            </div>
            <select className={styles.teacherRangeSelect}>
              <option>Last 30 Days</option>
              <option>Last Quarter</option>
            </select>
          </div>
          <div className={styles.teacherChartMock}>
            <svg
              viewBox="0 0 400 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M0,80 Q50,30 100,50 T200,20 T300,60 T400,10 V100 H0 Z" />
              <path
                d="M0,80 Q50,30 100,50 T200,20 T300,60 T400,10"
                className={styles.teacherChartLine}
              />
            </svg>
            <div className={styles.teacherChartLabels}>
              <span>WK 01</span>
              <span>WK 02</span>
              <span>WK 03</span>
              <span>WK 04</span>
            </div>
          </div>
        </article>

        <aside className={styles.teacherSideCards}>
          <article className={styles.teacherSpotlightCard}>
            <h4>Mentor Spotlight</h4>
            <p>
              Your student satisfaction rate is in the top 5% of Architect
              Academy mentors this month.
            </p>
            <button type="button" className={styles.primaryBtn}>
              Review Feedback
            </button>
          </article>

          <article className={styles.teacherInsightsCard}>
            <h4>Quick Insights</h4>
            <ul>
              {teacherQuickInsights.map((insight) => (
                <li key={insight.text}>
                  <span
                    className={`${styles.teacherInsightDot} ${styles[`teacherInsight_${insight.tone}`]}`}
                  />
                  <p>{insight.text}</p>
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </section>

      <section className={styles.teacherTableCard}>
        <header className={styles.teacherTableHead}>
          <h4>Recent Submissions</h4>
          <button type="button" className={styles.teacherLinkButton}>
            View All Submissions
          </button>
        </header>

        <div className={styles.teacherTableWrap}>
          <table className={styles.teacherTable}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Module</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teacherRecentSubmissions.map((submission) => (
                <tr key={submission.studentId}>
                  <td>
                    <div className={styles.teacherStudentCell}>
                      <div className={styles.teacherInitials}>
                        {submission.initials}
                      </div>
                      <div>
                        <strong>{submission.student}</strong>
                        <p>ID: {submission.studentId}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>{submission.module}</strong>
                    <p>{submission.assignment}</p>
                  </td>
                  <td>
                    <span
                      className={`${styles.teacherStatusPill} ${styles[`teacherStatus_${toStatusKey(submission.status)}`]}`}
                    >
                      {submission.status}
                    </span>
                  </td>
                  <td className={styles.teacherActionsCell}>
                    <button
                      type="button"
                      className={
                        submission.action === "Grade Now"
                          ? styles.primaryBtn
                          : styles.teacherSecondaryBtn
                      }
                    >
                      {submission.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </TeacherShell>
  );
}
