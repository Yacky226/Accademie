"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { MarketingPageFrame } from "../marketing-site/MarketingPageFrame";
import {
  createMarketingContactRequest,
  fetchMarketingPublicSettings,
} from "./marketing-pages.client";
import styles from "./marketing-pages.module.css";

export function MarketingContactPage() {
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    message: "",
    subject: "",
  });
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [supportEmail, setSupportEmail] = useState("support@architectacademy.dev");
  const [platformName, setPlatformName] = useState("l academie");

  useEffect(() => {
    let isActive = true;

    void fetchMarketingPublicSettings()
      .then((settings) => {
        if (!isActive) {
          return;
        }

        const resolvedSupportEmail =
          settings.get("platform.supportEmail") || "support@architectacademy.dev";
        const resolvedPlatformName =
          settings.get("platform.name")?.trim() || "Architect Academy";

        setSupportEmail(resolvedSupportEmail);
        setPlatformName(resolvedPlatformName);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setSupportEmail("support@architectacademy.dev");
        setPlatformName("Architect Academy");
      });

    return () => {
      isActive = false;
    };
  }, []);

  const responseTimeLabel = useMemo(() => "< 24h", []);

  function updateField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      await createMarketingContactRequest({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        message: form.message.trim(),
        subject: form.subject.trim(),
      });

      setStatusMessage(
        "Votre demande a bien ete envoyee. L equipe reviendra vers vous rapidement.",
      );
      setForm({
        email: "",
        fullName: "",
        message: "",
        subject: "",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d envoyer votre message pour le moment.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <MarketingPageFrame mainClassName={styles.main} pageClassName={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroCard}>
            <div>
              <span className={styles.eyebrow}>Contact</span>
              <h1 className={styles.title}>
                Parlons de votre parcours, de votre equipe ou de la meilleure facon d entrer dans
                {` ${platformName}.`}
              </h1>
              <p className={styles.lead}>
                Utilisez cette page pour contacter le support, reserver une demo, demander un plan
                d onboarding ou echanger avec l equipe produit.
              </p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryLink} href="/pricing">
                  Voir les offres
                </Link>
                <Link className={styles.secondaryLink} href="/formations">
                  Parcourir le catalogue
                </Link>
              </div>
            </div>

            <div className={styles.heroAside}>
              <article className={styles.heroStat}>
                <span>Response time</span>
                <strong>{responseTimeLabel}</strong>
                <p>Demandes d admission, support apprenant et partenariats equipes.</p>
              </article>
              <article className={styles.heroMiniCard}>
                <h3>Canaux directs</h3>
                <p>Admissions, support, demo entreprise, partenariat mentor et accompagnement produit.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.contactShell}>
            <article className={styles.formCard}>
              <h3>Envoyer un message</h3>
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label htmlFor="contact-name">Nom</label>
                    <input
                      id="contact-name"
                      onChange={(event) => updateField("fullName", event.target.value)}
                      placeholder="Votre nom"
                      required
                      value={form.fullName}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="contact-email">Email</label>
                    <input
                      id="contact-email"
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="vous@studio.fr"
                      required
                      type="email"
                      value={form.email}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="contact-subject">Sujet</label>
                  <input
                    id="contact-subject"
                    onChange={(event) => updateField("subject", event.target.value)}
                    placeholder="Support, admission, partenariat..."
                    required
                    value={form.subject}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="contact-message">Message</label>
                  <textarea
                    id="contact-message"
                    onChange={(event) => updateField("message", event.target.value)}
                    placeholder="Expliquez votre besoin, votre contexte et ce que vous cherchez a mettre en place."
                    required
                    value={form.message}
                  />
                </div>

                {statusMessage ? (
                  <p className={`${styles.formStatus} ${styles.formStatusSuccess}`}>
                    {statusMessage}
                  </p>
                ) : null}
                {errorMessage ? (
                  <p className={`${styles.formStatus} ${styles.formStatusError}`}>
                    {errorMessage}
                  </p>
                ) : null}

                <div className={styles.heroActions}>
                  <button className={styles.primaryLink} disabled={loading} type="submit">
                    {loading ? "Envoi..." : "Envoyer la demande"}
                  </button>
                </div>
              </form>
            </article>

            <div className={styles.heroAside}>
              <article className={styles.contactPanel}>
                <h3>Admissions</h3>
                <p>Choix du parcours, conditions d acces, orientation et accompagnement pour le bon niveau d entree.</p>
                <strong>admissions@architectacademy.dev</strong>
              </article>
              <article className={styles.contactPanel}>
                <h3>Support & produit</h3>
                <p>Questions techniques, paiements, compte, experience de navigation et demandes produit.</p>
                <strong>{supportEmail}</strong>
              </article>
              <article className={styles.contactPanel}>
                <h3>Entreprise</h3>
                <p>Parcours equipes, demos internes, mentoring et plans personnalises pour structures tech.</p>
                <strong>enterprise@architectacademy.dev</strong>
              </article>
            </div>
          </div>
        </div>
      </section>
    </MarketingPageFrame>
  );
}
