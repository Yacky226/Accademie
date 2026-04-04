import styles from "../home.module.css";

interface ProofSectionProps {
  logos: string[];
}

export function ProofSection({ logos }: ProofSectionProps) {
  return (
    <section className={styles.proof} id="mentors">
      <div className={styles.container}>
        <p className={styles.proofTitle}>
          Nos diplomes propulsent l innovation chez
        </p>
        <div className={styles.proofGrid}>
          {logos.map((logo) => (
            <span key={logo} className={styles.proofLogo}>
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
