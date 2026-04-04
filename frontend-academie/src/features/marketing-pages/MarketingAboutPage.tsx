import Link from "next/link";
import { MarketingPageFrame } from "../marketing-site/MarketingPageFrame";
import styles from "./marketing-pages.module.css";

export function MarketingAboutPage() {
  return (
    <MarketingPageFrame mainClassName={styles.main} pageClassName={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroCard}>
            <div>
              <span className={styles.eyebrow}>About Architect Academy</span>
              <h1 className={styles.title}>
                Nous construisons une academie pour les equipes qui veulent raisonner comme des
                architectes, pas seulement consommer des cours.
              </h1>
              <p className={styles.lead}>
                Notre approche relie contenu, mentorat, progression et execution reelle. Chaque
                parcours est pense pour faire passer un apprenant du niveau operationnel au niveau
                systemique.
              </p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryLink} href="/formations">
                  Voir les formations
                </Link>
                <Link className={styles.secondaryLink} href="/contact">
                  Parler a l equipe
                </Link>
              </div>
            </div>

            <div className={styles.heroAside}>
              <article className={styles.heroStat}>
                <span>Mission</span>
                <strong>1 systeme</strong>
                <p>Relier apprentissage, pratique, mentorat et progression dans une seule boucle.</p>
              </article>
              <article className={styles.heroMiniCard}>
                <h3>Ce qui nous distingue</h3>
                <p>
                  Des chemins d apprentissage relies, un design coherent entre pages, et des
                  experiences qui gardent toujours l utilisateur dans le bon contexte.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Nos principes</h2>
              <p>
                Une experience haut de gamme repose autant sur la clarte pedagogique que sur la
                fluidite du produit.
              </p>
            </div>
          </div>

          <div className={styles.grid3}>
            <article className={styles.sectionCard}>
              <h3>Precision pedagogique</h3>
              <p>Chaque module avance d un concept a l autre sans rupture de contexte ni surcharge.</p>
            </article>
            <article className={styles.sectionCard}>
              <h3>Execution reelle</h3>
              <p>Les projets sont relies aux usages de production, aux revues et aux feedbacks.</p>
            </article>
            <article className={styles.sectionCard}>
              <h3>Navigation coherente</h3>
              <p>
                Le meme shell, les memes reperes, la meme logique de progression sur toutes les
                pages marketing.
              </p>
            </article>
          </div>

          <div className={styles.grid2} style={{ marginTop: 18 }}>
            <article className={styles.sectionCard}>
              <h3>Comment nous travaillons</h3>
              <ul className={styles.list}>
                <li>Curriculums relies entre discovery, formation, onboarding et espace etudiant.</li>
                <li>Mentorat et evaluation construits autour des livrables concrets.</li>
                <li>Design system unifie pour garder une experience lisible et moderne.</li>
              </ul>
            </article>
            <article className={styles.sectionCard}>
              <h3>Pour qui</h3>
              <ul className={styles.list}>
                <li>Etudiants qui veulent passer du cours au produit.</li>
                <li>Ingenieurs qui veulent monter en architecture et system design.</li>
                <li>Equipes qui veulent standardiser la progression et la qualite de delivery.</li>
              </ul>
            </article>
          </div>
        </div>
      </section>
    </MarketingPageFrame>
  );
}
