import Link from "next/link";
import { MarketingPageFrame } from "../marketing-site/MarketingPageFrame";
import styles from "./marketing-pages.module.css";

export function MarketingContactPage() {
  return (
    <MarketingPageFrame mainClassName={styles.main} pageClassName={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroCard}>
            <div>
              <span className={styles.eyebrow}>Contact</span>
              <h1 className={styles.title}>
                Parlons de votre parcours, de votre equipe ou de la meilleure facon d entrer dans
                l academie.
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
                <strong>&lt; 24h</strong>
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
              <form className={styles.form}>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label htmlFor="contact-name">Nom</label>
                    <input id="contact-name" placeholder="Votre nom" />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="contact-email">Email</label>
                    <input id="contact-email" placeholder="vous@studio.fr" />
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="contact-subject">Sujet</label>
                  <input id="contact-subject" placeholder="Support, admission, partenariat..." />
                </div>

                <div className={styles.field}>
                  <label htmlFor="contact-message">Message</label>
                  <textarea
                    id="contact-message"
                    placeholder="Expliquez votre besoin, votre contexte et ce que vous cherchez a mettre en place."
                  />
                </div>

                <div className={styles.heroActions}>
                  <button className={styles.primaryLink} type="button">
                    Envoyer la demande
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
                <strong>support@architectacademy.dev</strong>
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
