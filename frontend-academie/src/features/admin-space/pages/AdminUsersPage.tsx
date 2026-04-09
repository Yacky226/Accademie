"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUserRoles,
  updateAdminUserStatus,
} from "../admin-space.client";
import type { AdminWorkspaceUserRecord } from "../admin-space.types";
import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

type UserDraft = {
  role: string;
  status: string;
};

type CreateUserFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  status: string;
};

const INITIAL_CREATE_FORM: CreateUserFormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "STUDENT",
  status: "ACTIVE",
};

function getRoleLabel(role: string) {
  if (role === "ADMIN") {
    return "Admin";
  }
  if (role === "TEACHER") {
    return "Teacher";
  }
  return "Student";
}

function getStatusLabel(status: string) {
  if (status === "ACTIVE") {
    return "Active";
  }
  if (status === "PENDING") {
    return "Pending";
  }
  if (status === "SUSPENDED") {
    return "Suspended";
  }
  return "Inactive";
}

function getInitials(user: AdminWorkspaceUserRecord) {
  return `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase() || "AA";
}

function formatDate(value: string | null) {
  if (!value) {
    return "Jamais";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildDraftMap(users: AdminWorkspaceUserRecord[]) {
  return Object.fromEntries(
    users.map((user) => [
      user.id,
      {
        role: user.roles[0] ?? "STUDENT",
        status: user.status,
      },
    ]),
  );
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminWorkspaceUserRecord[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [createForm, setCreateForm] = useState<CreateUserFormState>(INITIAL_CREATE_FORM);
  const [drafts, setDrafts] = useState<Record<string, UserDraft>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadUsers() {
      setLoading(true);

      try {
        const nextUsers = await fetchAdminUsers();
        if (!isActive) {
          return;
        }

        setUsers(nextUsers);
        setDrafts(buildDraftMap(nextUsers));
        setErrorMessage(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger les utilisateurs.",
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      isActive = false;
    };
  }, []);

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const primaryRole = user.roles[0] ?? "STUDENT";
      const matchesRole = role === "ALL" || primaryRole === role;
      const matchesStatus = status === "ALL" || user.status === status;
      const matchesText =
        normalizedQuery.length === 0 ||
        user.fullName.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery);

      return matchesRole && matchesStatus && matchesText;
    });
  }, [query, role, status, users]);

  async function handleSave(user: AdminWorkspaceUserRecord) {
    const draft = drafts[user.id];
    if (!draft) {
      return;
    }

    setSavingUserId(user.id);
    try {
      const updatedStatus =
        draft.status !== user.status
          ? await updateAdminUserStatus(user.id, draft.status)
          : user;
      const updatedRoles =
        draft.role !== (user.roles[0] ?? "STUDENT")
          ? await updateAdminUserRoles(user.id, [draft.role])
          : updatedStatus;

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                status: updatedRoles.status,
                roles: updatedRoles.roles,
                onboardingCompletedAt:
                  updatedRoles.onboardingCompletedAt ?? item.onboardingCompletedAt,
                lastLoginAt: updatedRoles.lastLoginAt ?? item.lastLoginAt,
              }
            : item,
        ),
      );
      setErrorMessage(null);
      setSuccessMessage(`Le compte ${user.fullName} a ete mis a jour.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de mettre a jour cet utilisateur.",
      );
      setSuccessMessage(null);
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !createForm.firstName.trim() ||
      !createForm.lastName.trim() ||
      !createForm.email.trim() ||
      !createForm.password.trim()
    ) {
      setErrorMessage("Renseignez le prenom, le nom, l email et le mot de passe.");
      setSuccessMessage(null);
      return;
    }

    if (createForm.password.trim().length < 8) {
      setErrorMessage("Le mot de passe temporaire doit contenir au moins 8 caracteres.");
      setSuccessMessage(null);
      return;
    }

    setCreating(true);
    try {
      const createdUser = await createAdminUser({
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        email: createForm.email.trim(),
        password: createForm.password.trim(),
        roleNames: [createForm.role],
        status: createForm.status,
      });

      setUsers((current) => [createdUser, ...current]);
      setDrafts((current) => ({
        ...current,
        [createdUser.id]: {
          role: createdUser.roles[0] ?? createForm.role,
          status: createdUser.status,
        },
      }));
      setCreateForm(INITIAL_CREATE_FORM);
      setErrorMessage(null);
      setSuccessMessage(`Le compte ${createdUser.fullName} a ete cree.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de creer cet utilisateur.",
      );
      setSuccessMessage(null);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteUser(user: AdminWorkspaceUserRecord) {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(`Supprimer definitivement ${user.fullName} ?`);
      if (!confirmed) {
        return;
      }
    }

    setSavingUserId(user.id);
    try {
      await deleteAdminUser(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setDrafts((current) => {
        const nextDrafts = { ...current };
        delete nextDrafts[user.id];
        return nextDrafts;
      });
      setErrorMessage(null);
      setSuccessMessage(`Le compte ${user.fullName} a ete supprime.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de supprimer cet utilisateur.",
      );
      setSuccessMessage(null);
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <AdminShell activePath="/admin/users" title="User Management">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>User Management</h1>
          <p className={styles.heroSub}>
            Gestion complete des comptes, des roles et de l avancement d onboarding.
          </p>
          {errorMessage ? (
            <p className={`${styles.heroSub} ${styles.messageError}`}>{errorMessage}</p>
          ) : null}
          {successMessage ? (
            <p className={`${styles.heroSub} ${styles.messageSuccess}`}>{successMessage}</p>
          ) : null}
        </div>
        <button type="button" className={styles.primaryBtn}>
          {loading ? "Chargement..." : `${rows.length} utilisateur(s) visibles`}
        </button>
      </section>

      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h3>Creer un compte</h3>
        </header>
        <div className={styles.panelBody}>
          <form className={styles.panelForm} onSubmit={handleCreateUser}>
            <div className={styles.settingsFieldGrid}>
              <label className={styles.settingsField}>
                <span>Prenom</span>
                <input
                  className={styles.settingsInput}
                  value={createForm.firstName}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      firstName: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.settingsField}>
                <span>Nom</span>
                <input
                  className={styles.settingsInput}
                  value={createForm.lastName}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      lastName: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.settingsField}>
                <span>Email</span>
                <input
                  className={styles.settingsInput}
                  type="email"
                  value={createForm.email}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.settingsField}>
                <span>Mot de passe temporaire</span>
                <input
                  className={styles.settingsInput}
                  type="password"
                  value={createForm.password}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.settingsField}>
                <span>Role</span>
                <select
                  className={styles.settingsInput}
                  value={createForm.role}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
              <label className={styles.settingsField}>
                <span>Statut</span>
                <select
                  className={styles.settingsInput}
                  value={createForm.status}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>
            </div>
            <div className={styles.actionRow}>
              <button type="submit" className={styles.primaryBtn} disabled={creating}>
                {creating ? "Creation..." : "Creer le compte"}
              </button>
              <button
                type="button"
                className={styles.ghostBtn}
                disabled={creating}
                onClick={() => setCreateForm(INITIAL_CREATE_FORM)}
              >
                Reinitialiser
              </button>
            </div>
          </form>
        </div>
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
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="TEACHER">Teacher</option>
            <option value="STUDENT">Student</option>
          </select>
        </article>
        <article className={styles.filterCard}>
          <label>Status</label>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
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
                <th>Onboarding</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const draft = drafts[row.id] ?? {
                  role: row.roles[0] ?? "STUDENT",
                  status: row.status,
                };

                return (
                  <tr key={row.id}>
                    <td>
                      <div className={styles.userCell}>
                        <span className={styles.avatar}>{getInitials(row)}</span>
                        <strong>{row.fullName}</strong>
                      </div>
                    </td>
                    <td>{row.email}</td>
                    <td>
                      <select
                        className={styles.settingsInput}
                        value={draft.role}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [row.id]: { ...draft, role: event.target.value },
                          }))
                        }
                      >
                        <option value="STUDENT">Student</option>
                        <option value="TEACHER">Teacher</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <div className={styles.badgeWrap}>
                        <span
                          className={`${styles.badge} ${
                            draft.role === "ADMIN"
                              ? styles.roleAdmin
                              : draft.role === "TEACHER"
                                ? styles.roleTeacher
                                : styles.roleStudent
                          }`}
                        >
                          {getRoleLabel(draft.role)}
                        </span>
                      </div>
                    </td>
                    <td>{formatDate(row.lastLoginAt)}</td>
                    <td>
                      <select
                        className={styles.settingsInput}
                        value={draft.status}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [row.id]: { ...draft, status: event.target.value },
                          }))
                        }
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="PENDING">Pending</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                      <div className={styles.badgeWrap}>
                        <span
                          className={`${styles.badge} ${
                            draft.status === "ACTIVE"
                              ? styles.statusActive
                              : draft.status === "PENDING"
                                ? styles.statusPending
                                : styles.statusSuspended
                          }`}
                        >
                          {getStatusLabel(draft.status)}
                        </span>
                      </div>
                    </td>
                    <td>{row.onboardingCompletedAt ? "Complete" : "In progress"}</td>
                    <td>
                      <div className={styles.tableActions}>
                        <button
                          type="button"
                          className={styles.ghostBtn}
                          disabled={savingUserId === row.id}
                          onClick={() => void handleSave(row)}
                        >
                          {savingUserId === row.id ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          className={styles.dangerBtn}
                          disabled={savingUserId === row.id}
                          onClick={() => void handleDeleteUser(row)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={7}>Aucun utilisateur ne correspond a ces filtres.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <footer className={styles.footerRow}>
          <span>Showing {rows.length} of {users.length} users</span>
          <span>
            {users.filter((user) => user.onboardingCompletedAt).length} onboarding(s)
            completes
          </span>
        </footer>
      </section>
    </AdminShell>
  );
}
