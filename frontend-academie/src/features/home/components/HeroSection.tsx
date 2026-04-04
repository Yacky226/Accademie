import type { CSSProperties } from "react";
import Link from "next/link";
import styles from "../home.module.css";
import type { HeroMetric } from "../home.types";

interface HeroSectionProps {
  metrics: HeroMetric[];
}

export function HeroSection({ metrics }: HeroSectionProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.heroGrid}>
          <div>
            <div className={styles.eyebrow}>
              <span className={styles.ping} />
              Nouveau: Masterclass Systemes Distribues
            </div>

            <h1 className={styles.heroTitle}>
              Formez des equipes capables de{" "}
              <span className={styles.accent}>concevoir, coder et scaler</span>
              {" "}des plateformes d exception.
            </h1>

            <p className={styles.heroLead}>
              Une academie pensee pour les profils ambitieux en architecture logicielle,
              algorithmique avancee et system design. Progression guidee, mentorat en direct et
              parcours relies d une page a l autre.
            </p>

            <div className={styles.ctaRow}>
              <Link href="/formations" className={styles.buttonPrimary}>
                Explorer le catalogue
              </Link>
              <Link href="/pricing" className={styles.buttonSecondary}>
                Voir les plans
              </Link>
            </div>

            <div className={styles.heroMetrics}>
              {metrics.map((metric, index) => (
                <article
                  key={metric.label}
                  className={styles.heroMetricCard}
                  style={{ "--metric-index": index } as CSSProperties}
                >
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </article>
              ))}
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.visualPhoto}>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoJu-0hoD12ffTdSLNhSEy_QTWuBsuHpUFI1IdwHgJSiu7cJBcgLUN64s-zCxTzjmTK-EQs7aUx0Ss5hennv5iCQJbJp1fH8wzOAOYnQiIh8OvLbUv2vjxqWpDe0-yZrhrNDObRWS0Zq116BAz9WRFgpHnQks2bwRYODvyQv8_PsSW0aw6WesGPS2n4bOMwpGGWxWrPq89lx27MCuTt61bamY5NWm67EPstMXlsmOI4SW4LhGmsbLwD12Z2NnBNxCX5aFe6cSLzUup"
                alt="Setup de developpement moderne"
              />
              <div className={styles.photoTint} />

              <div className={styles.floatingReviewCard}>
                <span className={styles.floatingCardEyebrow}>Live mentor review</span>
                <strong>08 sessions this week</strong>
                <p>Feedback actionnable sur architecture, code quality et delivery.</p>
              </div>
            </div>

            <div className={styles.visualStack}>
              <div className={styles.visualTop}>
                <span className={styles.codeLabel}>Architect_Ledger_v3</span>
                <strong className={styles.visualHeadline}>Blueprints for engineers who ship.</strong>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} />
                </div>
              </div>

              <div className={styles.visualBottom}>
                <div className={styles.visualBottomHeader}>
                  <span className={styles.visualIcon}>&gt;_</span>
                  <span className={styles.visualBottomTag}>Path orchestration</span>
                </div>
                <div className={styles.skeletonLines}>
                  <span />
                  <span />
                </div>
                <div className={styles.visualPills}>
                  <span>Frontend</span>
                  <span>Systems</span>
                  <span>Mentorship</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.heroBlur} />
      <div className={styles.heroBlurSecondary} />
    </section>
  );
}
