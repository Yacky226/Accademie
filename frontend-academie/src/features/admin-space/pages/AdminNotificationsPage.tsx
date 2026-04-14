"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCurrentAuthSession } from "@/features/auth/model/useCurrentAuthSession";
import {
  createAdminNotification,
  deleteAdminNotification,
  fetchAdminNotifications,
  fetchAdminUsers,
} from "../admin-space.client";
import type {
  AdminNotificationRecord,
  AdminWorkspaceUserRecord,
} from "../admin-space.types";
import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";
import { formatWorkspaceDateTime } from "@/features/workspace-data/model/workspace-ui.utils";

type NotificationFormState = {
  title: string;
  message: string;
  type: "SYSTEM_INFO" | "COURSE_UPDATE" | "URGENT_UPDATE";
  recipientId: string;
  kind: "system" | "course";
  actionLabel: string;
  actionHref: string;
};

const INITIAL_FORM: NotificationFormState = {
  title: "",
  message: "",
  type: "SYSTEM_INFO",
  recipientId: "",
  kind: "system",
  actionLabel: "",
  actionHref: "",
};

function readMetadataString(
  metadata: Record<string, unknown> | null,
  key: string,
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function formatNotificationSource(notification: AdminNotificationRecord) {
  const source = readMetadataString(notification.metadata, "source");

  if (source === "course-publication") {
    return "Publication cours";
  }

  if (source === "evaluation-publication") {
    return "Publication evaluation";
  }

  if (source === "admin-manual") {
    return "Envoi admin";
  }

  return "Systeme";
}

function sourceIsAutomated(notification: AdminNotificationRecord) {
  const source = readMetadataString(notification.metadata, "source");
  return source === "course-publication" || source === "evaluation-publication";
}

export function AdminNotificationsPage() {
  const { user } = useCurrentAuthSession();
  const [notifications, setNotifications] = useState<AdminNotificationRecord[]>([]);
  const [users, setUsers] = useState<AdminWorkspaceUserRecord[]>([]);
  const [form, setForm] = useState<NotificationFormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingNotificationId, setSavingNotificationId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const historySectionRef = useRef<HTMLElement | null>(null);

  const metrics = useMemo(() => {
    return {
      automated: notifications.filter(sourceIsAutomated).length,
      manual: notifications.filter(
        (notification) => readMetadataString(notification.metadata, "source") === "admin-manual",
      ).length,
      total: notifications.length,
      unread: notifications.filter((notification) => !notification.isRead).length,
    };
  }, [notifications]);

  useEffect(() => {
    let isActive = true;

    async function loadData() {
      setLoading(true);

      try {
        const [nextNotifications, nextUsers] = await Promise.all([
          fetchAdminNotifications(),
          fetchAdminUsers(),
        ]);

        if (!isActive) {
          return;
        }

        setNotifications(nextNotifications);
        setUsers(nextUsers);
        setErrorMessage(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger les notifications.",
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isActive = false;
    };
  }, []);

  async function refreshNotifications() {
    try {
      const nextNotifications = await fetchAdminNotifications();
      setNotifications(nextNotifications);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de charger les notifications.",
      );
    }
  }

  async function handleCreateNotification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.recipientId || !form.title.trim() || !form.message.trim()) {
      setErrorMessage("Le destinataire, le titre et le message sont obligatoires.");
      return;
    }

    setCreating(true);

    try {
      const metadata: Record<string, unknown> = {
        source: "admin-manual",
        kind: form.kind,
      };

      if (form.actionLabel.trim()) {
        metadata.actionLabel = form.actionLabel.trim();
      }

      if (form.actionHref.trim()) {
        metadata.actionHref = form.actionHref.trim();
      }

      const createdNotification = await createAdminNotification({
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        recipientId: form.recipientId,
        senderId: user?.id ?? undefined,
        metadata,
      });

      setNotifications((current) => [createdNotification, ...current]);
      setForm(INITIAL_FORM);
      setErrorMessage(null);
      setSuccessMessage(`La notification "${createdNotification.title}" a ete envoyee.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de creer cette notification.",
      );
      setSuccessMessage(null);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteNotification(notification: AdminNotificationRecord) {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        `Supprimer la notification "${notification.title}" ?`,
      );

      if (!confirmed) {
        return;
      }
    }

    setSavingNotificationId(notification.id);

    try {
      await deleteAdminNotification(notification.id);
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
      setErrorMessage(null);
      setSuccessMessage(`La notification "${notification.title}" a ete supprimee.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de supprimer cette notification.",
      );
      setSuccessMessage(null);
    } finally {
      setSavingNotificationId(null);
    }
  }

  function scrollToHistory() {
    historySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <AdminShell activePath="/admin/notifications" title="Notifications">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>Notification control center</h1>
          <p className={styles.heroSub}>
            Les notifications automatiques de publication et les messages admin sont
            maintenant centralises dans le back-office.
          </p>
          {errorMessage ? <p className={`${styles.heroSub} ${styles.messageError}`}>{errorMessage}</p> : null}
          {successMessage ? <p className={`${styles.heroSub} ${styles.messageSuccess}`}>{successMessage}</p> : null}
        </div>
        <div className={styles.actionRow}>
          <button type="button" className={styles.ghostBtn} onClick={() => void refreshNotifications()}>
            Rafraichir
          </button>
          <button type="button" className={styles.primaryBtn} onClick={scrollToHistory}>
            {loading ? "..." : `Voir l historique (${metrics.total})`}
          </button>
        </div>
      </section>

      <section className={styles.grid4}>
        <article className={styles.kpi}>
          <p>Total</p>
          <strong>{loading ? "..." : metrics.total}</strong>
          <span>Flux global des notifications enregistrees.</span>
        </article>
        <article className={styles.kpi}>
          <p>Non lues</p>
          <strong>{loading ? "..." : metrics.unread}</strong>
          <span>Encore en attente de consultation.</span>
        </article>
        <article className={styles.kpi}>
          <p>Automatiques</p>
          <strong>{loading ? "..." : metrics.automated}</strong>
          <span>Publis cours, QCM et examens.</span>
        </article>
        <article className={styles.kpi}>
          <p>Messages admin</p>
          <strong>{loading ? "..." : metrics.manual}</strong>
          <span>Envois manuels depuis cette console.</span>
        </article>
      </section>

      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h3>Envoyer une notification manuelle</h3>
        </header>
        <div className={styles.panelBody}>
          <form className={styles.panelForm} onSubmit={handleCreateNotification}>
            <div className={styles.settingsFieldGrid}>
              <label className={styles.settingsField}>
                <span>Destinataire</span>
                <select
                  className={styles.settingsInput}
                  value={form.recipientId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      recipientId: event.target.value,
                    }))
                  }
                >
                  <option value="">Choisir un utilisateur</option>
                  {users.map((workspaceUser) => (
                    <option key={workspaceUser.id} value={workspaceUser.id}>
                      {workspaceUser.fullName} - {workspaceUser.email}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.settingsField}>
                <span>Type</span>
                <select
                  className={styles.settingsInput}
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      type: event.target.value as NotificationFormState["type"],
                    }))
                  }
                >
                  <option value="SYSTEM_INFO">System info</option>
                  <option value="COURSE_UPDATE">Course update</option>
                  <option value="URGENT_UPDATE">Urgent update</option>
                </select>
              </label>
              <label className={styles.settingsField}>
                <span>Presentation</span>
                <select
                  className={styles.settingsInput}
                  value={form.kind}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      kind: event.target.value as NotificationFormState["kind"],
                    }))
                  }
                >
                  <option value="system">Systeme</option>
                  <option value="course">Formation</option>
                </select>
              </label>
              <label className={styles.settingsField}>
                <span>Titre</span>
                <input
                  className={styles.settingsInput}
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.settingsField}>
                <span>Libelle action</span>
                <input
                  className={styles.settingsInput}
                  placeholder="Voir le contenu"
                  value={form.actionLabel}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      actionLabel: event.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.settingsField}>
                <span>Lien action</span>
                <input
                  className={styles.settingsInput}
                  placeholder="/student/evaluations"
                  value={form.actionHref}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      actionHref: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <label className={styles.settingsField}>
              <span>Message</span>
              <textarea
                className={styles.settingsTextarea}
                value={form.message}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    message: event.target.value,
                  }))
                }
              />
            </label>

            <div className={styles.actionRow}>
              <button type="submit" className={styles.primaryBtn} disabled={creating}>
                {creating ? "Envoi..." : "Envoyer"}
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

      <section ref={historySectionRef} className={styles.panel}>
        <header className={styles.panelHead}>
          <h3>Historique des notifications</h3>
        </header>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Destinataire</th>
                <th>Source</th>
                <th>Canal</th>
                <th>Etat</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notification) => (
                <tr key={notification.id}>
                  <td>
                    <strong>{notification.title}</strong>
                    <p className={styles.tableMeta}>{notification.message}</p>
                    {readMetadataString(notification.metadata, "actionHref") ? (
                      <p className={styles.tableMeta}>
                        Action: {readMetadataString(notification.metadata, "actionLabel") ?? "Ouvrir"} -{" "}
                        {readMetadataString(notification.metadata, "actionHref")}
                      </p>
                    ) : null}
                  </td>
                  <td>
                    <strong>{notification.recipient.fullName}</strong>
                    <p className={styles.tableMeta}>{notification.recipient.email}</p>
                  </td>
                  <td>{formatNotificationSource(notification)}</td>
                  <td>{notification.channel}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        notification.isRead ? styles.statusActive : styles.statusPending
                      }`}
                    >
                      {notification.isRead ? "Read" : "Unread"}
                    </span>
                  </td>
                  <td>{formatWorkspaceDateTime(notification.createdAt)}</td>
                  <td>
                    <div className={styles.tableActions}>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        disabled={savingNotificationId === notification.id}
                        onClick={() => void handleDeleteNotification(notification)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && notifications.length === 0 ? (
                <tr>
                  <td colSpan={7}>Aucune notification disponible pour le moment.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
