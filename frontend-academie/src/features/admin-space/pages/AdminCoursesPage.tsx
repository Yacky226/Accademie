"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createAdminCourse,
  deleteAdminCourse,
  fetchAdminCourses,
  updateAdminCourse,
} from "../admin-space.client";
import type { AdminWorkspaceCourseRecord } from "../admin-space.types";
import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

type CourseFormState = {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  price: string;
  currency: string;
  level: string;
  durationInHours: string;
  certificateEnabled: boolean;
  publishNow: boolean;
};

const INITIAL_FORM: CourseFormState = {
  title: "",
  slug: "",
  shortDescription: "",
  description: "",
  thumbnailUrl: "",
  price: "",
  currency: "MAD",
  level: "BEGINNER",
  durationInHours: "",
  certificateEnabled: true,
  publishNow: false,
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusClass(course: AdminWorkspaceCourseRecord) {
  if (course.isPublished || course.status === "PUBLISHED") {
    return styles.statusActive;
  }

  if (course.status === "ARCHIVED") {
    return styles.statusSuspended;
  }

  return styles.statusPending;
}

export function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminWorkspaceCourseRecord[]>([]);
  const [form, setForm] = useState<CourseFormState>(INITIAL_FORM);
  const [creating, setCreating] = useState(false);
  const [savingCourseId, setSavingCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadCourses() {
      setLoading(true);

      try {
        const nextCourses = await fetchAdminCourses();
        if (!isActive) {
          return;
        }

        setCourses(nextCourses);
        setErrorMessage(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger les cours.",
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadCourses();

    return () => {
      isActive = false;
    };
  }, []);

  const metrics = useMemo(() => {
    return {
      draft: courses.filter((course) => !course.isPublished).length,
      enrollments: courses.reduce((sum, course) => sum + course.enrollmentsCount, 0),
      published: courses.filter((course) => course.isPublished).length,
      total: courses.length,
    };
  }, [courses]);

  function resetForm() {
    setForm(INITIAL_FORM);
  }

  async function handleCreateCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const price = Number.parseFloat(form.price);
    const durationInHours = form.durationInHours.trim()
      ? Number.parseFloat(form.durationInHours)
      : undefined;

    if (!form.title.trim() || !form.slug.trim() || !form.shortDescription.trim() || !form.description.trim()) {
      setErrorMessage("Renseignez le titre, le slug, la description courte et la description complete.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setErrorMessage("Le prix du cours doit etre un nombre valide.");
      return;
    }

    if (durationInHours !== undefined && (!Number.isFinite(durationInHours) || durationInHours < 1)) {
      setErrorMessage("La duree doit etre superieure ou egale a 1 heure.");
      return;
    }

    setCreating(true);
    try {
      const createdCourse = await createAdminCourse({
        title: form.title.trim(),
        slug: form.slug.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        thumbnailUrl: form.thumbnailUrl.trim() || undefined,
        price,
        currency: form.currency.trim().toUpperCase(),
        level: form.level,
        status: form.publishNow ? "PUBLISHED" : "DRAFT",
        isPublished: form.publishNow,
        durationInHours,
        certificateEnabled: form.certificateEnabled,
      });

      setCourses((current) => [createdCourse, ...current]);
      setErrorMessage(null);
      setSuccessMessage(`Le cours ${createdCourse.title} a ete cree.`);
      resetForm();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de creer ce cours.",
      );
      setSuccessMessage(null);
    } finally {
      setCreating(false);
    }
  }

  async function handlePublishToggle(course: AdminWorkspaceCourseRecord) {
    setSavingCourseId(course.id);
    try {
      const updatedCourse = await updateAdminCourse(course.id, {
        isPublished: !course.isPublished,
        status: course.isPublished ? "DRAFT" : "PUBLISHED",
      });

      setCourses((current) =>
        current.map((item) => (item.id === course.id ? updatedCourse : item)),
      );
      setErrorMessage(null);
      setSuccessMessage(
        updatedCourse.isPublished
          ? `${updatedCourse.title} est maintenant publie.`
          : `${updatedCourse.title} est repasse en brouillon.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de modifier ce cours.",
      );
      setSuccessMessage(null);
    } finally {
      setSavingCourseId(null);
    }
  }

  async function handleArchive(course: AdminWorkspaceCourseRecord) {
    setSavingCourseId(course.id);
    try {
      const updatedCourse = await updateAdminCourse(course.id, {
        isPublished: false,
        status: "ARCHIVED",
      });

      setCourses((current) =>
        current.map((item) => (item.id === course.id ? updatedCourse : item)),
      );
      setErrorMessage(null);
      setSuccessMessage(`${updatedCourse.title} a ete archive.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible d archiver ce cours.",
      );
      setSuccessMessage(null);
    } finally {
      setSavingCourseId(null);
    }
  }

  async function handleDelete(course: AdminWorkspaceCourseRecord) {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        `Supprimer definitivement le cours "${course.title}" ?`,
      );
      if (!confirmed) {
        return;
      }
    }

    setSavingCourseId(course.id);
    try {
      await deleteAdminCourse(course.id);
      setCourses((current) => current.filter((item) => item.id !== course.id));
      setErrorMessage(null);
      setSuccessMessage(`${course.title} a ete supprime.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de supprimer ce cours.",
      );
      setSuccessMessage(null);
    } finally {
      setSavingCourseId(null);
    }
  }

  return (
    <AdminShell activePath="/admin/formations" title="Course Catalog">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>Course Catalog</h1>
          <p className={styles.heroSub}>
            Vue admin complete sur les cours, leurs auteurs, leur statut et leurs inscriptions.
          </p>
          {errorMessage ? <p className={`${styles.heroSub} ${styles.messageError}`}>{errorMessage}</p> : null}
          {successMessage ? <p className={`${styles.heroSub} ${styles.messageSuccess}`}>{successMessage}</p> : null}
        </div>
        <div className={styles.actionRow}>
          <button type="button" className={styles.ghostBtn}>
            {loading ? "Chargement..." : `${metrics.draft} brouillon(s)`}
          </button>
          <button type="button" className={styles.primaryBtn}>
            {loading ? "..." : `${metrics.published} publie(s)`}
          </button>
        </div>
      </section>

      <section className={styles.grid4}>
        <article className={styles.kpi}>
          <p>Total Courses</p>
          <strong>{loading ? "..." : formatNumber(metrics.total)}</strong>
          <span>Catalogue total admin</span>
        </article>
        <article className={styles.kpi}>
          <p>Published</p>
          <strong>{loading ? "..." : formatNumber(metrics.published)}</strong>
          <span>Cours visibles publiquement</span>
        </article>
        <article className={styles.kpi}>
          <p>Draft Courses</p>
          <strong>{loading ? "..." : formatNumber(metrics.draft)}</strong>
          <span>Cours en attente de finalisation</span>
        </article>
        <article className={styles.kpi}>
          <p>Active Enrollments</p>
          <strong>{loading ? "..." : formatNumber(metrics.enrollments)}</strong>
          <span>Total des inscriptions rattachees</span>
        </article>
      </section>

      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h3>Creer un nouveau cours</h3>
        </header>
        <div className={styles.panelBody}>
          <form className={styles.panelForm} onSubmit={handleCreateCourse}>
            <div className={styles.settingsFieldGrid}>
              <label className={styles.settingsField}>
                <span>Titre</span>
                <input
                  className={styles.settingsInput}
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </label>
              <label className={styles.settingsField}>
                <span>Slug</span>
                <input
                  className={styles.settingsInput}
                  value={form.slug}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, slug: event.target.value }))
                  }
                />
              </label>
              <label className={styles.settingsField}>
                <span>Description courte</span>
                <input
                  className={styles.settingsInput}
                  value={form.shortDescription}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      shortDescription: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.settingsField}>
                <span>URL miniature</span>
                <input
                  className={styles.settingsInput}
                  value={form.thumbnailUrl}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      thumbnailUrl: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.settingsField}>
                <span>Prix</span>
                <input
                  className={styles.settingsInput}
                  inputMode="decimal"
                  value={form.price}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, price: event.target.value }))
                  }
                />
              </label>
              <label className={styles.settingsField}>
                <span>Devise</span>
                <input
                  className={styles.settingsInput}
                  value={form.currency}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, currency: event.target.value }))
                  }
                />
              </label>
              <label className={styles.settingsField}>
                <span>Niveau</span>
                <select
                  className={styles.settingsInput}
                  value={form.level}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, level: event.target.value }))
                  }
                >
                  <option value="BEGINNER">BEGINNER</option>
                  <option value="INTERMEDIATE">INTERMEDIATE</option>
                  <option value="ADVANCED">ADVANCED</option>
                </select>
              </label>
              <label className={styles.settingsField}>
                <span>Duree en heures</span>
                <input
                  className={styles.settingsInput}
                  inputMode="numeric"
                  value={form.durationInHours}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      durationInHours: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <label className={styles.settingsField}>
              <span>Description complete</span>
              <textarea
                className={styles.settingsTextarea}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </label>

            <div className={styles.integrationList}>
              <button
                type="button"
                className={styles.integrationRow}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    certificateEnabled: !current.certificateEnabled,
                  }))
                }
              >
                <div>
                  <strong>Certificat active</strong>
                  <p>Le cours delivre un certificat a la completion.</p>
                </div>
                <span
                  className={`${styles.adminToggle} ${
                    form.certificateEnabled ? styles.adminToggleOn : ""
                  }`}
                />
              </button>
              <button
                type="button"
                className={styles.integrationRow}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    publishNow: !current.publishNow,
                  }))
                }
              >
                <div>
                  <strong>Publier des la creation</strong>
                  <p>Le cours sera visible publiquement juste apres sa creation.</p>
                </div>
                <span
                  className={`${styles.adminToggle} ${
                    form.publishNow ? styles.adminToggleOn : ""
                  }`}
                />
              </button>
            </div>

            <div className={styles.actionRow}>
              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={creating}
              >
                {creating ? "Creation..." : "Creer le cours"}
              </button>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={resetForm}
                disabled={creating}
              >
                Reinitialiser
              </button>
            </div>
          </form>
        </div>
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
                <th>Modules</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <strong>{course.title}</strong>
                    <p className={styles.tableMeta}>
                      {course.creatorName} - {course.level}
                    </p>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${statusClass(course)}`}>
                      {course.isPublished ? "Published" : course.status}
                    </span>
                  </td>
                  <td>{formatNumber(course.enrollmentsCount)}</td>
                  <td>{formatNumber(course.modulesCount)}</td>
                  <td>{course.durationInHours ? `${course.durationInHours}h` : "Flexible"}</td>
                  <td>{formatCurrency(course.price, course.currency)}</td>
                  <td>
                    <div className={styles.tableActions}>
                      <button
                        type="button"
                        className={styles.ghostBtn}
                        disabled={savingCourseId === course.id}
                        onClick={() => void handlePublishToggle(course)}
                      >
                        {course.isPublished ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        disabled={savingCourseId === course.id}
                        onClick={() => void handleArchive(course)}
                      >
                        Archive
                      </button>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        disabled={savingCourseId === course.id}
                        onClick={() => void handleDelete(course)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && courses.length === 0 ? (
                <tr>
                  <td colSpan={7}>Aucun cours disponible pour le moment.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
