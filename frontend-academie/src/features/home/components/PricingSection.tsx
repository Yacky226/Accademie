import type { CSSProperties } from "react";
import Link from "next/link";
import styles from "../home.module.css";
import type { PricingPlan } from "../home.types";

interface PricingSectionProps {
  plans: PricingPlan[];
}

export function PricingSection({ plans }: PricingSectionProps) {
  return (
    <section className={styles.pricing} id="pricing">
      <div className={styles.container}>
        <div className={styles.pricingTitle}>
          <h2>Investissez dans votre talent</h2>
          <p>
            Des plans flexibles pour les apprenants individuels et les equipes.
          </p>
        </div>

        <div className={styles.planGrid}>
          {plans.map((plan, index) => {
            const cardClass = plan.highlighted
              ? `${styles.planCard} ${styles.planCardHighlighted}`
              : styles.planCard;

            return (
              <article
                key={plan.name}
                className={cardClass}
                style={{ "--reveal-index": index } as CSSProperties}
              >
                {plan.badge ? (
                  <span className={styles.planBadge}>{plan.badge}</span>
                ) : null}
                <div>
                  <h3 className={styles.planName}>{plan.name}</h3>
                  <div className={styles.planPriceRow}>
                    <span className={styles.planPrice}>{plan.price}</span>
                    {plan.period ? (
                      <span className={styles.planPeriod}>{plan.period}</span>
                    ) : null}
                  </div>
                </div>

                <ul className={styles.planFeatures}>
                  {plan.features.map((feature) => (
                    <li
                      key={feature.label}
                      className={feature.included ? "" : styles.featureOff}
                    >
                      <span>{feature.included ? "OK" : "NO"}</span>
                      <span>{feature.label}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.ctaHref} className={styles.planButton}>
                  {plan.cta}
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
