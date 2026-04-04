import Link from "next/link";
import styles from "./auth.module.css";
import { AuthFooter } from "./components/AuthFooter";

export function ForgotPasswordPage() {
  return (
    <div className={styles.authPage}>
      <main className={styles.authMain}>
        <div className={styles.authGlowA} />
        <div className={styles.authGlowB} />

        <div className={styles.splitLayout}>
          <section className={styles.authContainer}>
            <div className={styles.centerBrand}>
              <div className={styles.brandPill}>A</div>
              <h1 className={styles.brandTitle}>Architect Academy</h1>
            </div>

            <article className={styles.authCard}>
              <div className={styles.cardTopIcon}>@</div>
              <h2 className={styles.cardTitleLeft}>Mot de passe oublie ?</h2>
              <p className={styles.cardLead}>
                Saisissez votre adresse e-mail pour reinitialiser votre mot de
                passe.
              </p>

              <form className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="forgot-email" className={styles.labelMono}>
                    Email
                  </label>
                  <div className={styles.inputIconWrap}>
                    <span className={styles.inputIcon}>@</span>
                    <input
                      id="forgot-email"
                      type="email"
                      className={styles.inputWithIcon}
                      placeholder="nom@exemple.com"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className={styles.primaryButton}>
                  Envoyer le lien de reinitialisation
                </button>
              </form>

              <p className={styles.pageHint}>
                <Link href="/auth/login">Retour a la connexion</Link>
              </p>
            </article>
          </section>

          <aside className={styles.sideVisual}>
            <div className={styles.sideVisualPanel}>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHExU9kdUFSyENyEEpELioxrX-tIZk3hqXiniJPGfcGl72oO89y7oMlkfUGYdFkBoh02zuYx6DSm8rPQQiquoFbqxfzVcFZ7Z4dotVmTSb8KWJ7iPuwm-9E0K_HZtbBjQvlug3QdwauJ6b9Sq9UeUUKcxTcZeBsTe6_DVChjEfLTTqaTGjnptsfhEcIMW6qGnbd7vUg4j6Ovf3o6_GUKKQ1XfvCgsngd_XRSgjxgDFJL5IfLacqcU9q8cF2vf4xAx7iv7AmYfbxVXr"
                alt="Architecture background"
              />
              <div className={styles.sideVisualContent}>
                <span className={styles.sideVisualTag}>Rejoignez l elite</span>
                <p>Batir l avenir avec une rigueur mathematique.</p>
                <span className={styles.sideVisualLine} />
              </div>
            </div>
          </aside>
        </div>
      </main>

      <AuthFooter />
    </div>
  );
}
