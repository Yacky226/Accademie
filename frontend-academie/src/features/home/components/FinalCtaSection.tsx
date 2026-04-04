import Link from "next/link";
import styles from "../home.module.css";

export function FinalCtaSection() {
  return (
    <section className={styles.ctaSection}>
      <div className={styles.container}>
        <div className={styles.ctaBox}>
          <h2>Pret a transformer votre carriere ?</h2>
          <p>
            Rejoignez une communaute de plus de 15,000 architectes logiciels et
            commencez votre ascension aujourd hui.
          </p>
          <Link href="/auth/register" className={styles.ctaButton}>
            Inscrivez-vous maintenant
          </Link>
          <div className={styles.ctaBlobA} />
          <div className={styles.ctaBlobB} />
        </div>
      </div>
    </section>
  );
}
