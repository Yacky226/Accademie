"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  fetchAdminAnnouncements,
  updateAdminAnnouncement,
} from "../admin-space.client";
import type { AdminAnnouncementRecord } from "../admin-space.types";
import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

type AnnouncementFormState = {
  title: string;
  content: string;
  isPublished: boolean;
};

const INITIAL_FORM: AnnouncementFormState = {
  title: "",
  content: "",
  isPublished: false,
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AdminAnnouncementRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, AnnouncementFormState>>({});
  const [form, setForm] = useState(INITIAL_FORM);
  const [creating, setCreating] = useState(false);
  const [savingAnnouncementId, setSavingAnnouncementId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadAnnouncements() {
      setLoading(true);

      try {
        const nextAnnouncements = await fetchAdminAnnouncements();
        if (!isActive) {
          return;
        }

        setAnnouncements(nextAnnouncements);
        setDrafts(
          Object.fromEntries(
            nextAnnouncements.map((announcement) => [
              announcement.id,
              {
                title: announcement.title,
                content: announcement.content,
                isPublished: announcement.isPublished,
              },
            ]),
          ),
        );
        setErrorMessage(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger les annonces.",
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadAnnouncements();

    return () => {
      isActive = false;
    };
  }, []);

  const metrics = useMemo(() => {
    return {
      drafts: announcements.filter((announcement) => !announcement.isPublished).length,
      published: announcements.filter((announcement) => announcement.isPublished).length,
      total: announcements.length,
    };
  }, [announcements]);

  async function handleCreateAnnouncement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      setErrorMessage("Le titre et le contenu de l annonce sont obligatoires.");
      return;
    }

    setCreating(true);
    try {
      const createdAnnouncement = await createAdminAnnouncement({
        title: form.title.trim(),
        content: form.content.trim(),
        isPublished: form.isPublished,
      });

      setAnnouncements((current) => [createdAnnouncement, ...current]);
      setDrafts((current) => ({
        ...current,
        [createdAnnouncement.id]: {
          title: createdAnnouncement.title,
          content: createdAnnouncement.content,
          isPublished: createdAnnouncement.isPublished,
        },
      }));
      setForm(INITIAL_FORM);
      setErrorMessage(null);
      setSuccessMessage(`L annonce "${createdAnnouncement.title}" a ete creee.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de creer cette annonce.",
      );
      setSuccessMessage(null);
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveAnnouncement(announcement: AdminAnnouncementRecord) {
    const draft = drafts[announcement.id];
    if (!draft) {
      return;
    }

    setSavingAnnouncementId(announcement.id);
    try {
      const updatedAnnouncement = await updateAdminAnnouncement(announcement.id, {
        title: draft.title.trim(),
        content: draft.content.trim(),
        isPublished: draft.isPublished,
      });

      setAnnouncements((current) =>
        current.map((item) =>
          item.id === announcement.id ? updatedAnnouncement : item,
        ),
      );
      setErrorMessage(null);
      setSuccessMessage(`L annonce "${updatedAnnouncement.title}" a ete mise a jour.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de mettre a jour cette annonce.",
      );
      setSuccessMessage(null);
    } finally {
      setSavingAnnouncementId(null);
    }
  }

  async function handleDeleteAnnouncement(announcement: AdminAnnouncementRecord) {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        `Supprimer l annonce "${announcement.title}" ?`,
      );
      if (!confirmed) {
        return;
      }
    }

    setSavingAnnouncementId(announcement.id);
    try {
      await deleteAdminAnnouncement(announcement.id);
      setAnnouncements((current) =>
        current.filter((item) => item.id !== announcement.id),
      );
      setErrorMessage(null);
      setSuccessMessage(`L annonce "${announcement.title}" a ete supprimee.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de supprimer cette annonce.",
      );
      setSuccessMessage(null);
    } finally {
      setSavingAnnouncementId(null);
    }
  }

  return (
    <AdminShell activePath="/admin/announcements" title="Announcements">
      <section className={styles.heroRow}>
        <div>
          <p className={styles.pageEyebrow}>Editorial command</p>
          <h1 className={styles.heroTitle}>Academy Announcements</h1>
          <p className={styles.heroSub}>
            Centre editorial pour publier les annonces visibles sur la plateforme.
          </p>
          {errorMessage ? <p className={`${styles.heroSub} ${styles.messageError}`}>{errorMessage}</p> : null}
          {successMessage ? <p className={`${styles.heroSub} ${styles.messageSuccess}`}>{successMessage}</p> : null}
        </div>
      </section>

      <section className={styles.grid4}>
        <article className={styles.kpi}>
          <p>Total annonces</p>
          <strong>{loading ? "..." : metrics.total}</strong>
          <span>Volume editorial charge depuis le backend.</span>
        </article>
        <article className={styles.kpi}>
          <p>Publiees</p>
          <strong>{loading ? "..." : metrics.published}</strong>
          <span>Annonces visibles par les utilisateurs.</span>
        </article>
        <article className={styles.kpi}>
          <p>Brouillons</p>
          <strong>{loading ? "..." : metrics.drafts}</strong>
          <span>Messages en attente de publication.</span>
        </article>
      </section>

      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h3>Creer une annonce</h3>
        </header>
        <div className={styles.panelBody}>
          <form className={styles.panelForm} onSubmit={handleCreateAnnouncement}>
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
              <span>Contenu</span>
              <textarea
                className={styles.settingsTextarea}
                value={form.content}
                onChange={(event) =>
                  setForm((current) => ({ ...current, content: event.target.value }))
                }
              />
            </label>
            <button
              type="button"
              className={styles.integrationRow}
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  isPublished: !current.isPublished,
                }))
              }
            >
              <div>
                <strong>Publier immediatement</strong>
                <p>L annonce sera visible des qu elle est creee.</p>
              </div>
              <span
                className={`${styles.adminToggle} ${form.isPublished ? styles.adminToggleOn : ""}`}
              />
            </button>
            <div className={styles.actionRow}>
              <button type="submit" className={styles.primaryBtn} disabled={creating}>
                {creating ? "Creation..." : "Creer l annonce"}
              </button>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => setForm(INITIAL_FORM)}
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
          <h3>Announces inventory</h3>
        </header>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Contenu</th>
                <th>Statut</th>
                <th>Auteur</th>
                <th>Dates</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((announcement) => {
                const draft = drafts[announcement.id] ?? {
                  title: announcement.title,
                  content: announcement.content,
                  isPublished: announcement.isPublished,
                };

                return (
                  <tr key={announcement.id}>
                    <td>
                      <input
                        className={styles.settingsInput}
                        value={draft.title}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [announcement.id]: {
                              ...draft,
                              title: event.target.value,
                            },
                          }))
                        }
                      />
                    </td>
                    <td>
                      <textarea
                        className={styles.inlineTextarea}
                        value={draft.content}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [announcement.id]: {
                              ...draft,
                              content: event.target.value,
                            },
                          }))
                        }
                      />
                    </td>
                    <td>
                      <select
                        className={styles.settingsInput}
                        value={draft.isPublished ? "PUBLISHED" : "DRAFT"}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [announcement.id]: {
                              ...draft,
                              isPublished: event.target.value === "PUBLISHED",
                            },
                          }))
                        }
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="PUBLISHED">PUBLISHED</option>
                      </select>
                      <div className={styles.badgeWrap}>
                        <span
                          className={`${styles.badge} ${
                            draft.isPublished ? styles.statusActive : styles.statusPending
                          }`}
                        >
                          {draft.isPublished ? "PUBLISHED" : "DRAFT"}
                        </span>
                      </div>
                    </td>
                    <td>{announcement.createdByName ?? "Equipe admin"}</td>
                    <td>
                      <p className={styles.tableMeta}>Maj: {formatDate(announcement.updatedAt)}</p>
                      <p className={styles.tableMeta}>Pub: {formatDate(announcement.publishedAt)}</p>
                    </td>
                    <td>
                      <div className={styles.tableActions}>
                        <button
                          type="button"
                          className={styles.ghostBtn}
                          disabled={savingAnnouncementId === announcement.id}
                          onClick={() => void handleSaveAnnouncement(announcement)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className={styles.dangerBtn}
                          disabled={savingAnnouncementId === announcement.id}
                          onClick={() => void handleDeleteAnnouncement(announcement)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && announcements.length === 0 ? (
                <tr>
                  <td colSpan={6}>Aucune annonce disponible pour le moment.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
