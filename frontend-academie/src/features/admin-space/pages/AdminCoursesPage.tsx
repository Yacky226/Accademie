import { adminCourses } from "../admin-space.data";
import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

function statusClass(status: string) {
  if (status === "Published") return styles.statusActive;
  if (status === "Scheduled") return styles.statusPending;
  return styles.statusSuspended;
}

export function AdminCoursesPage() {
  return (
    <AdminShell activePath="/admin/formations" title="Course Catalog">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>Course Catalog</h1>
          <p className={styles.heroSub}>
            Create, audit, and optimize learning paths.
          </p>
        </div>
        <div className={styles.actionRow}>
          <button type="button" className={styles.ghostBtn}>
            Approve Content
          </button>
          <button type="button" className={styles.primaryBtn}>
            Create New Course
          </button>
        </div>
      </section>

      <section className={styles.grid4}>
        <article className={styles.kpi}>
          <p>Total Courses</p>
          <strong>1,284</strong>
          <span>+12% from last month</span>
        </article>
        <article className={styles.kpi}>
          <p>Active Enrollments</p>
          <strong>42,903</strong>
          <span>+8.4% since launch</span>
        </article>
        <article className={styles.kpi}>
          <p>Average Rating</p>
          <strong>4.82</strong>
          <span>12k reviews</span>
        </article>
        <article className={styles.kpi}>
          <p>Draft Courses</p>
          <strong>98</strong>
          <span>Needs review</span>
        </article>
      </section>

      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h3>Course Inventory</h3>
        </header>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Course</th>
                <th>Status</th>
                <th>Enrollments</th>
                <th>Rating</th>
                <th>Trend</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminCourses.map((row) => (
                <tr key={row.title}>
                  <td>
                    <strong>{row.title}</strong>
                    <p
                      style={{
                        margin: "2px 0 0",
                        color: "#6f7d95",
                        fontSize: "0.72rem",
                      }}
                    >
                      {row.instructor} - {row.category}
                    </p>
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${statusClass(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td>{row.enrollments}</td>
                  <td>{row.rating}</td>
                  <td>{row.trend}</td>
                  <td>
                    <button type="button" className={styles.ghostBtn}>
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
