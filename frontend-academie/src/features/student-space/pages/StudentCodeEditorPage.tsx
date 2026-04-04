import styles from "../student-space.module.css";

export function StudentCodeEditorPage() {
  return (
    <div className={styles.ideShell}>
      <header className={styles.ideTop}>
        <strong>AcademyIDE</strong>
        <div>
          <button type="button" className={styles.ghostBtn}>
            Run
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            style={{ marginLeft: 8 }}
          >
            Debug
          </button>
        </div>
      </header>

      <div className={styles.ideBody}>
        <aside className={styles.idePane}>Explorer</aside>
        <aside className={styles.idePane}>Files and folders</aside>
        <main className={styles.ideEditor}>
          <p>import React from 'react';</p>
          <p>export const Header = () =&gt; {"{"}</p>
          <p style={{ marginLeft: 16 }}>
            return &lt;header&gt;Dashboard&lt;/header&gt;;
          </p>
          <p>{"}"};</p>
        </main>
        <aside className={styles.idePane}>Project stats</aside>
      </div>

      <footer className={styles.ideFooter}>
        <span>main*</span>
        <span>TypeScript JSX</span>
      </footer>
    </div>
  );
}
