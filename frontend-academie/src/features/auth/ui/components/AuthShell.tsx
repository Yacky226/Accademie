import type { ReactNode } from "react";
import styles from "../auth-ui.module.css";
import { AuthHeader } from "./AuthHeader";
import { AuthFooter } from "./AuthFooter";

interface AuthMetric {
  label: string;
  value: string;
}

interface AuthShellProps {
  children: ReactNode;
  headerActionHref: string;
  headerActionLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  spotlightLabel: string;
  spotlightTitle: string;
  spotlightDescription: string;
  metrics: AuthMetric[];
  highlights: string[];
}

export function AuthShell({
  children,
  headerActionHref,
  headerActionLabel,
  eyebrow,
  title,
  description,
  spotlightLabel,
  spotlightTitle,
  spotlightDescription,
  metrics,
  highlights,
}: AuthShellProps) {
  return (
    <div className={styles.authPage}>
      <AuthHeader actionHref={headerActionHref} actionLabel={headerActionLabel} />
      <main className={styles.authMain}>
        <div className={styles.authAuraOne} />
        <div className={styles.authAuraTwo} />
        <div className={styles.authGrid} />

        <div className={styles.authStage}>
          <section className={styles.authFormColumn}>{children}</section>

          <aside className={styles.authShowcase}>
            <article className={styles.authShowcaseCard}>
              <span className={styles.authEyebrow}>{eyebrow}</span>
              <h1 className={styles.authHeadline}>{title}</h1>
              <p className={styles.authDescription}>{description}</p>

              <div className={styles.authMetricGrid}>
                {metrics.map((metric) => (
                  <div key={metric.label} className={styles.authMetricCard}>
                    <strong className={styles.authMetricValue}>{metric.value}</strong>
                    <span className={styles.authMetricLabel}>{metric.label}</span>
                  </div>
                ))}
              </div>

              <div className={styles.authShowcasePanel}>
                <span className={styles.authShowcaseLabel}>{spotlightLabel}</span>
                <h2 className={styles.authShowcaseTitle}>{spotlightTitle}</h2>
                <p className={styles.authShowcaseCopy}>{spotlightDescription}</p>
              </div>

              <ul className={styles.authHighlightList}>
                {highlights.map((highlight) => (
                  <li key={highlight} className={styles.authHighlightItem}>
                    <span className={styles.authHighlightDot} />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </article>
          </aside>
        </div>
      </main>
      <AuthFooter />
    </div>
  );
}
