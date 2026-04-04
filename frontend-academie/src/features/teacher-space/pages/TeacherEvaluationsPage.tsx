import styles from "../teacher-space.module.css";
import { TeacherShell } from "../components/TeacherShell";

export function TeacherEvaluationsPage() {
  return (
    <TeacherShell activePath="/teacher/evaluations" title="Evaluations">
      <h2 className={styles.sectionTitle}>Studio d Evaluation</h2>
      <p className={styles.sectionSub}>
        Creation, publication et correction des evaluations.
      </p>

      <section className={styles.split}>
        <article className={styles.card}>
          <h3>Pipeline de correction</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Evaluation</th>
                <th>Cohorte</th>
                <th>Etat</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>System Design - Midterm</td>
                <td>B2</td>
                <td>
                  <span className={styles.chip}>17 en attente</span>
                </td>
              </tr>
              <tr>
                <td>Algo Avancee</td>
                <td>A1</td>
                <td>
                  <span className={styles.chip}>Publiee</span>
                </td>
              </tr>
              <tr>
                <td>Architecture Cloud</td>
                <td>C1</td>
                <td>
                  <span className={styles.chip}>Brouillon</span>
                </td>
              </tr>
            </tbody>
          </table>
        </article>

        <article className={styles.card}>
          <h3>Action rapide</h3>
          <div className={styles.buttonRow}>
            <button type="button" className={styles.ghostBtn}>
              Nouveau QCM
            </button>
            <button type="button" className={styles.primaryBtn}>
              Publier lot
            </button>
          </div>
        </article>
      </section>
    </TeacherShell>
  );
}
