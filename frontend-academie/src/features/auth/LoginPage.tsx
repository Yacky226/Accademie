import Link from "next/link";
import { authSocialProviders } from "./auth.data";
import styles from "./auth.module.css";
import { AuthShell } from "./components/AuthShell";
import { SocialIcon } from "./components/SocialIcon";

export function LoginPage() {
  return (
    <AuthShell>
      <section className={styles.authContainer}>
        <div className={styles.centerBrand}>
          <h1 className={styles.brandTitle}>Synthetix Pro</h1>
          <p className={styles.brandSubtitle}>Architect Academy</p>
        </div>

        <div className={styles.authCard}>
          <h2>Ravi de vous revoir</h2>

          <form className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="login-email" className={styles.label}>
                Adresse e-mail
              </label>
              <input
                id="login-email"
                type="email"
                className={styles.input}
                placeholder="nom@exemple.com"
                required
              />
            </div>

            <div className={styles.field}>
              <div className={styles.fieldRow}>
                <label htmlFor="login-password" className={styles.label}>
                  Mot de passe
                </label>
                <Link href="/auth/forgot-password" className={styles.textLink}>
                  Oublie ?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                className={styles.input}
                placeholder="........"
                required
              />
            </div>

            <label className={styles.checkRow}>
              <input type="checkbox" className={styles.checkbox} />
              <span>Se souvenir de moi</span>
            </label>

            <button type="submit" className={styles.primaryButton}>
              Se connecter
            </button>
          </form>

          <div className={styles.divider}>
            <span>Ou continuer avec</span>
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

          <p className={styles.pageHint}>
            Nouveau ici ? <Link href="/auth/register">Creer un compte</Link>
          </p>
        </div>
      </section>
    </AuthShell>
  );
}
