import styles from "./auth.module.css";
import { AuthFooter } from "./components/AuthFooter";
import { AuthHeader } from "./components/AuthHeader";

export function VerificationPage() {
  return (
    <div className={styles.authPage}>
      <AuthHeader actionLabel="Support" />

      <main className={styles.authMain}>
        <div className={styles.authGlowA} />
        <div className={styles.authGlowB} />

        <section className={styles.authContainer}>
          <article className={styles.authCard}>
            <div className={styles.cardTopIcon}>M</div>
            <h2 className={styles.cardTitleLeft}>Verifiez votre compte</h2>
            <p className={styles.cardLead}>
              Un code de verification a ete envoye a votre e-mail. Veuillez le
              saisir ci-dessous pour continuer.
            </p>

            <form className={styles.form}>
              <div className={styles.otpRow}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <input
                    key={`otp-${index}`}
                    className={styles.otpInput}
                    maxLength={1}
                    inputMode="numeric"
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>

              <button type="submit" className={styles.primaryButton}>
                Verifier
              </button>
            </form>

            <div className={styles.resendWrap}>
              <p className={styles.cardLead}>Vous n avez pas recu de code ?</p>
              <div className={styles.resendRow}>
                <button type="button" className={styles.textLink}>
                  Renvoyer le code
                </button>
                <span className={styles.timerPill}>01:59</span>
              </div>
            </div>
          </article>
        </section>
      </main>

      <AuthFooter />
    </div>
  );
}
