"use client";

import { useMemo, useState } from "react";
import { adminUsers } from "../admin-space.data";
import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

export function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All Roles");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return adminUsers.filter((user) => {
      const byRole = role === "All Roles" || user.role === role;
      const byText =
        q.length === 0 ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q);
      return byRole && byText;
    });
  }, [query, role]);

  return (
    <AdminShell activePath="/admin/users" title="User Management">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>User Management</h1>
          <p className={styles.heroSub}>
            Control access, monitor engagement, and manage roles.
          </p>
        </div>
        <button type="button" className={styles.primaryBtn}>
          Add New User
        </button>
      </section>

      <section className={styles.filterGrid}>
        <article className={styles.filterCard}>
          <label>Search Directory</label>
          <input
            placeholder="Search by name or email..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </article>
        <article className={styles.filterCard}>
          <label>Filter by Role</label>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option>All Roles</option>
            <option>Admin</option>
            <option>Teacher</option>
            <option>Student</option>
          </select>
        </article>
        <article className={styles.filterCard}>
          <label>Status</label>
          <select>
            <option>All</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Suspended</option>
          </select>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Last Login</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.email}>
                  <td>
                    <div className={styles.userCell}>
                      <span className={styles.avatar}>{row.initials}</span>
                      <strong>{row.name}</strong>
                    </div>
                  </td>
                  <td>{row.email}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        row.role === "Admin"
                          ? styles.roleAdmin
                          : row.role === "Teacher"
                            ? styles.roleTeacher
                            : styles.roleStudent
                      }`}
                    >
                      {row.role}
                    </span>
                  </td>
                  <td>{row.lastLogin}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        row.status === "Active"
                          ? styles.statusActive
                          : row.status === "Pending"
                            ? styles.statusPending
                            : styles.statusSuspended
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <button type="button" className={styles.ghostBtn}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className={styles.footerRow}>
          <span>Showing {rows.length} of 1,240 users</span>
          <span>Page 1 / 296</span>
        </footer>
      </section>
    </AdminShell>
  );
}
