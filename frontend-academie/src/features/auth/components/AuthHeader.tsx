import styles from "../auth.module.css";

interface AuthHeaderProps {
  actionLabel: string;
}

export function AuthHeader({ actionLabel }: AuthHeaderProps) {
  return (
    <header className={styles.authHeader}>
      <div className={styles.authHeaderInner}>
        <p className={styles.headerBrand}>Synthetix Pro</p>
        <a href="#" className={styles.headerAction}>
          {actionLabel}
        </a>
      </div>
    </header>
  );
}
