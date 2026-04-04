import Link from "next/link";
import { authSocialProviders } from "./auth.data";
import styles from "./auth.module.css";
import { AuthShell } from "./components/AuthShell";
import { SocialIcon } from "./components/SocialIcon";

export function RegisterPage() {
  return (
    <AuthShell>
      <section className={styles.authContainer}>
        <div className={styles.centerBrand}>
          <div className={styles.brandPill}>A</div>
          <h1 className={styles.brandTitle}>Architect Academy</h1>
          <p className={styles.cardLead}>
            L excellence technique au service du design.
          </p>
        </div>

        <div className={styles.authCard}>
          <form className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="signup-fullname" className={styles.labelMono}>
                Nom complet
              </label>
              <input
                id="signup-fullname"
                type="text"
                className={styles.input}
                placeholder="Jean-Michel Architecture"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="signup-email" className={styles.labelMono}>
                Email professionnel
              </label>
              <input
                id="signup-email"
                type="email"
                className={styles.input}
                placeholder="contact@studio.fr"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="signup-password" className={styles.labelMono}>
                Mot de passe
              </label>
              <input
                id="signup-password"
                type="password"
                className={styles.input}
                placeholder="............"
                required
              />

              <div className={styles.passwordStrength}>
                <span
                  className={`${styles.passwordStrengthBar} ${styles.passwordStrengthBarActive}`}
                />
                <span
                  className={`${styles.passwordStrengthBar} ${styles.passwordStrengthBarActive}`}
                />
                <span className={styles.passwordStrengthBar} />
                <span className={styles.passwordStrengthBar} />
                <span className={styles.passwordStrengthLabel}>ROBUSTE</span>
              </div>
            </div>

            <label className={styles.checkRow}>
              <input type="checkbox" className={styles.checkbox} />
              <span className={styles.termsText}>
                J accepte les <a href="#">Conditions d Utilisation</a> et la{" "}
                <a href="#">Politique de Confidentialite</a>.
              </span>
            </label>

            <button type="submit" className={styles.primaryButton}>
              Creer mon compte
            </button>

            <div className={styles.divider}>
              <span>Ou s inscrire avec</span>
            </div>

            <div className={styles.socialGrid}>
              {authSocialProviders.map((provider) => (
                <button
                  key={provider.label}
                  type="button"
                  className={styles.socialButton}
                >
                  <span className={styles.socialIcon}>
                    <SocialIcon icon={provider.icon} />
                  </span>
                  <span>{provider.label}</span>
                </button>
              ))}
            </div>
          </form>
        </div>

        <p className={styles.pageHint}>
          Deja un compte ? <Link href="/auth/login">Se connecter</Link>
        </p>
      </section>
    </AuthShell>
  );
}
