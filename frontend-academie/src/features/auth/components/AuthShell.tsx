import type { ReactNode } from "react";
import styles from "../auth.module.css";
import { AuthFooter } from "./AuthFooter";

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className={styles.authPage}>
      <main className={styles.authMain}>
        <div className={styles.authGlowA} />
        <div className={styles.authGlowB} />
        {children}
      </main>
      <AuthFooter />
    </div>
  );
}
