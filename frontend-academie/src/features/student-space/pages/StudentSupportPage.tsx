"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createSupportTicket,
  fetchMySupportTickets,
  type StudentSupportTicketRecord,
} from "../api/student-support.client";
import styles from "../student-space.module.css";
import { StudentShell } from "../components/StudentShell";

const INITIAL_FORM = {
  subject: "",
  category: "",
  description: "",
};

function formatTicketDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getTicketStatusLabel(status: string) {
  switch (status) {
    case "IN_PROGRESS":
      return "En cours";
    case "RESOLVED":
      return "Resolue";
    case "CLOSED":
      return "Fermee";
    default:
      return "Ouverte";
  }
}

export function StudentSupportPage() {
  const [tickets, setTickets] = useState<StudentSupportTicketRecord[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const metrics = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "OPEN").length,
      inProgress: tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
      resolved: tickets.filter((ticket) =>
        ticket.status === "RESOLVED" || ticket.status === "CLOSED",
      ).length,
    };
  }, [tickets]);

  useEffect(() => {
    let isActive = true;

    async function loadTickets() {
      setLoading(true);

      try {
        const nextTickets = await fetchMySupportTickets();
        if (!isActive) {
          return;
        }

        setTickets(nextTickets);
        setErrorMessage(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger le support.",
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.subject.trim() || !form.category.trim() || form.description.trim().length < 10) {
      setErrorMessage("Renseignez un sujet, une categorie et une description plus detaillee.");
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await createSupportTicket({
        subject: form.subject.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
      });

      setTickets((current) => [ticket, ...current]);
      setForm(INITIAL_FORM);
      setStatusMessage("Votre ticket support a bien ete envoye.");
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible d envoyer votre ticket.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StudentShell activePath="/student/support" topbarTitle="Support">
      <section className={styles.heroRow}>
        <div>
          <p className={styles.pageEyebrow}>Student support</p>
          <h1 className={styles.heroTitle}>Contacter le support</h1>
          <p className={styles.heroSub}>
            Creez un ticket, suivez son statut et gardez un historique clair de vos demandes.
          </p>
        </div>
      </section>

      {errorMessage ? <p className={`${styles.heroSub} ${styles.messageError}`}>{errorMessage}</p> : null}
      {statusMessage ? <p className={`${styles.heroSub} ${styles.messageSuccess}`}>{statusMessage}</p> : null}

      <section className={styles.supportLayout}>
        <article className={styles.supportPanel}>
          <div className={styles.supportPanelHead}>
            <div>
              <span className={styles.supportPill}>Ticket composer</span>
              <h2>Expliquez clairement votre besoin ou le probleme rencontre.</h2>
              <p>Le ticket sera enregistre dans votre espace et visible avec son statut en temps reel.</p>
            </div>
          </div>

          <div className={styles.supportInsightGrid}>
            <article className={styles.supportStatusCard}>
              <span>Tickets</span>
              <strong>{loading ? "..." : metrics.total}</strong>
              <small>Total de vos demandes</small>
            </article>
            <article className={styles.supportStatusCard}>
              <span>Ouverts</span>
              <strong>{loading ? "..." : metrics.open}</strong>
              <small>En attente de prise en charge</small>
            </article>
            <article className={styles.supportStatusCard}>
              <span>En cours</span>
              <strong>{loading ? "..." : metrics.inProgress}</strong>
              <small>Analyse en cours</small>
            </article>
            <article className={styles.supportStatusCard}>
              <span>Resolus</span>
              <strong>{loading ? "..." : metrics.resolved}</strong>
              <small>Tickets traites</small>
            </article>
          </div>

          <form className={styles.supportFormModern} onSubmit={handleSubmit}>
            <div className={styles.supportFieldGrid}>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Sujet</span>
                <input
                  className={styles.input}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, subject: event.target.value }))
                  }
                  placeholder="Probleme d acces a une lecon"
                  value={form.subject}
                />
              </label>

              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Categorie</span>
                <select
                  className={styles.input}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, category: event.target.value }))
                  }
                  value={form.category}
                >
                  <option value="" disabled>
                    Selectionner une categorie
                  </option>
                  <option value="Plateforme">Plateforme</option>
                  <option value="Facturation">Facturation</option>
                  <option value="Contenu de cours">Contenu de cours</option>
                  <option value="Compte utilisateur">Compte utilisateur</option>
                </select>
              </label>
            </div>

            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Description</span>
              <textarea
                className={styles.textarea}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Decrivez ce qui s est passe, ce que vous attendiez et les etapes pour reproduire le probleme."
                value={form.description}
              />
            </label>

            <div className={styles.actionRow}>
              <button className={styles.primaryBtn} disabled={submitting} type="submit">
                {submitting ? "Envoi..." : "Envoyer le ticket"}
              </button>
            </div>
          </form>
        </article>

        <aside className={styles.supportAside}>
          <article className={styles.supportAsideCard}>
            <span className={styles.supportInsightLabel}>Mes derniers tickets</span>
            <h3>Historique recent</h3>
            {loading ? <p>Chargement des tickets...</p> : null}
            {!loading && tickets.length === 0 ? (
              <p>Aucune demande n a encore ete envoyee.</p>
            ) : null}
            <div className={styles.supportMetricList}>
              {tickets.slice(0, 4).map((ticket) => (
                <div key={ticket.id}>
                  <strong>{ticket.subject}</strong>
                  <span>{ticket.category}</span>
                  <span>{getTicketStatusLabel(ticket.status)}</span>
                  <span>{formatTicketDate(ticket.createdAt)}</span>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.supportAsideCard}>
            <span className={styles.supportInsightLabel}>Bonnes pratiques</span>
            <h3>Ce qui aide le plus l equipe support</h3>
            <ul className={styles.supportChecklist}>
              <li>Indiquez le cours, la lecon ou l ecran concerne.</li>
              <li>Precisez si le probleme bloque completement votre progression.</li>
              <li>Ajoutez le message d erreur exact quand il existe.</li>
            </ul>
          </article>
        </aside>
      </section>
    </StudentShell>
  );
}
