import Link from "next/link";
import { pricingPlans } from "../home/home.data";
import { FinalCtaSection } from "../home/components/FinalCtaSection";
import { PricingSection } from "../home/components/PricingSection";
import { MarketingPageFrame } from "../marketing-site/MarketingPageFrame";
import styles from "./marketing-pages.module.css";

export function MarketingPricingPage() {
  return (
    <MarketingPageFrame mainClassName={styles.main} pageClassName={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroCard}>
            <div>
              <span className={styles.eyebrow}>Pricing</span>
              <h1 className={styles.title}>
                Choisissez un niveau d accompagnement coherent avec votre ambition technique.
              </h1>
              <p className={styles.lead}>
                Des offres simples, lisibles et reliees au meme parcours: navigation unifiee,
                progression suivie, mentorat et espace etudiant une fois connecte.
              </p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryLink} href="/checkout?mode=pack&plan=PRO">
                  Souscrire au pack Pro
                </Link>
                <Link className={styles.secondaryLink} href="/contact">
                  Parler a l equipe
                </Link>
              </div>
            </div>

            <div className={styles.heroAside}>
              <article className={styles.heroStat}>
                <span>Plan prefere</span>
                <strong>Pro</strong>
                <p>
                  Le meilleur point d entree pour acceder au catalogue complet et au feedback
                  mentor.
                </p>
              </article>
              <article className={styles.heroMiniCard}>
                <h3>Ce qui est inclus</h3>
                <p>
                  Catalogue, progression, notifications, revues, onboarding et navigation
                  coherente entre marketing et espace connecte.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <PricingSection plans={pricingPlans} />

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Questions frequentes</h2>
              <p>
                Les points qui reviennent le plus souvent avant de lancer un parcours individuel ou
                equipe.
              </p>
            </div>
          </div>

          <div className={styles.faqGrid}>
            <article className={styles.faqCard}>
              <h3>Puis-je commencer gratuitement ?</h3>
              <p>
                Oui. Le plan Free permet de decouvrir l experience, les bases et la structure du
                parcours.
              </p>
            </article>
            <article className={styles.faqCard}>
              <h3>Le plan Pro donne acces a quoi ?</h3>
              <p>
                Au catalogue complet, aux projets pratiques, aux reviews et a une progression plus
                profonde dans l espace etudiant.
              </p>
            </article>
            <article className={styles.faqCard}>
              <h3>Et pour une equipe ?</h3>
              <p>
                Le plan Enterprise permet un accompagnement adapte, des parcours personnalises et
                une logique de suivi partagee.
              </p>
            </article>
          </div>
        </div>
      </section>

      <FinalCtaSection />
    </MarketingPageFrame>
  );
}
