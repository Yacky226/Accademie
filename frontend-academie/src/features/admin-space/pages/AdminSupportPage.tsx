"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminSupportTickets,
  updateAdminSupportTicketStatus,
} from "../admin-space.client";
import type { AdminWorkspaceSupportTicketRecord } from "../admin-space.types";
import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

type TicketDraft = {
  status: string;
  resolution: string;
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

export function AdminSupportPage() {
  const [tickets, setTickets] = useState<AdminWorkspaceSupportTicketRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, TicketDraft>>({});
  const [savingTicketId, setSavingTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadTickets() {
      setLoading(true);

      try {
        const nextTickets = await fetchAdminSupportTickets();
        if (!isActive) {
          return;
        }

        setTickets(nextTickets);
        setDrafts(
          Object.fromEntries(
            nextTickets.map((ticket) => [
              ticket.id,
              { resolution: ticket.resolution ?? "", status: ticket.status },
            ]),
          ),
        );
        setErrorMessage(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger les tickets support.",
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadTickets();

    return () => {
      isActive = false;
    };
  }, []);

  const metrics = useMemo(() => {
    return {
      critical: tickets.filter((ticket) => ticket.status === "OPEN").length,
      inProgress: tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
      resolved: tickets.filter(
        (ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED",
      ).length,
      total: tickets.length,
    };
  }, [tickets]);

  async function handleSave(ticket: AdminWorkspaceSupportTicketRecord) {
    const draft = drafts[ticket.id];
    if (!draft) {
      return;
    }

    setSavingTicketId(ticket.id);
    try {
      const updatedTicket = await updateAdminSupportTicketStatus(
        ticket.id,
        draft.status,
        draft.resolution,
      );

      setTickets((current) =>
        current.map((item) => (item.id === ticket.id ? updatedTicket : item)),
      );
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de mettre a jour le ticket.",
      );
    } finally {
      setSavingTicketId(null);
    }
  }

  return (
    <AdminShell activePath="/admin/support" title="Support Management">
      <section className={styles.heroRow}>
        <div>
          <p className={styles.pageEyebrow}>Support operations</p>
          <h1 className={styles.heroTitle}>Support Command Center</h1>
          <p className={styles.heroSub}>
            File reelle des tickets support avec suivi de statut et resolution.
          </p>
          {errorMessage ? <p className={`${styles.heroSub} ${styles.messageError}`}>{errorMessage}</p> : null}
        </div>
      </section>

      <section className={styles.commandSummaryGrid}>
        <article className={styles.commandMetricCard}>
          <span>Tickets</span>
          <strong>{loading ? "..." : metrics.total}</strong>
          <p>Volume total de la file de support actuellement chargee.</p>
        </article>
        <article className={styles.commandMetricCard}>
          <span>Ouverts</span>
          <strong>{loading ? "..." : metrics.critical}</strong>
          <p>Demandes encore sans resolution complete.</p>
        </article>
        <article className={styles.commandMetricCard}>
          <span>En cours</span>
          <strong>{loading ? "..." : metrics.inProgress}</strong>
          <p>Tickets en traitement actif par l equipe support.</p>
        </article>
        <article className={styles.commandMetricCard}>
          <span>Resolus</span>
          <strong>{loading ? "..." : metrics.resolved}</strong>
          <p>Historique recent des cas deja traites ou clotures.</p>
        </article>
      </section>

      <section className={styles.ticketOpsLayout}>
        <article className={styles.ticketOpsPanel}>
          <div className={styles.ticketOpsHeader}>
            <div>
              <span className={styles.ticketOpsPill}>Live triage board</span>
              <h2>Tickets actifs et priorites de resolution</h2>
              <p>Chaque ligne peut etre mise a jour directement depuis cette vue admin.</p>
            </div>
          </div>

          <div className={styles.ticketTableCard}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Demandeur</th>
                    <th>Categorie</th>
                    <th>Status</th>
                    <th>Resolution</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => {
                    const draft = drafts[ticket.id] ?? {
                      resolution: ticket.resolution ?? "",
                      status: ticket.status,
                    };

                    return (
                      <tr key={ticket.id}>
                        <td>
                          <strong>{ticket.subject}</strong>
                          <p className={styles.tableMeta}>
                            Cree le {formatDate(ticket.createdAt)}
                          </p>
                        </td>
                        <td>
                          {ticket.userName}
                          <p className={styles.tableMeta}>
                            {ticket.userEmail}
                          </p>
                        </td>
                        <td>{ticket.category}</td>
                        <td>
                          <select
                            className={styles.settingsInput}
                            value={draft.status}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [ticket.id]: { ...draft, status: event.target.value },
                              }))
                            }
                          >
                            <option value="OPEN">OPEN</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="CLOSED">CLOSED</option>
                          </select>
                        </td>
                        <td>
                          <input
                            className={styles.settingsInput}
                            placeholder="Resolution ou note interne"
                            value={draft.resolution}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [ticket.id]: { ...draft, resolution: event.target.value },
                              }))
                            }
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className={styles.ghostBtn}
                            disabled={savingTicketId === ticket.id}
                            onClick={() => void handleSave(ticket)}
                          >
                            {savingTicketId === ticket.id ? "Saving..." : "Save"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && tickets.length === 0 ? (
                    <tr>
                      <td colSpan={6}>Aucun ticket support disponible.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <aside className={styles.ticketQueue}>
          <article className={styles.ticketQueueCard}>
            <span className={styles.ticketOpsPill}>Resolution lane</span>
            <h3>Points de focus</h3>
            <div className={styles.ticketQueueMeta}>
              <div>
                <strong>{metrics.critical} ticket(s) ouverts</strong>
                <span>Priorite aux demandes non encore prises en charge.</span>
              </div>
              <div>
                <strong>{metrics.inProgress} ticket(s) en cours</strong>
                <span>Verification des resolutions avant cloture.</span>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </AdminShell>
  );
}
