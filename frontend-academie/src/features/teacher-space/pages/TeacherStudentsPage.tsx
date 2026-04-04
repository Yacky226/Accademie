import { teacherLearners } from "../teacher-space.data";
import styles from "../teacher-space.module.css";
import { TeacherShell } from "../components/TeacherShell";

export function TeacherStudentsPage() {
  return (
    <TeacherShell activePath="/teacher/students" title="Students">
      <h2 className={styles.sectionTitle}>Suivi des Etudiants</h2>
      <p className={styles.sectionSub}>
        Analyse individuelle, feedback et plans de progression.
      </p>

      <article className={styles.card} style={{ marginTop: 14 }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Etudiant</th>
              <th>Parcours</th>
              <th>Progression</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {teacherLearners.map((learner) => (
              <tr key={learner.name}>
                <td>{learner.name}</td>
                <td>{learner.program}</td>
                <td>{learner.progress}%</td>
                <td>
                  <button type="button" className={styles.ghostBtn}>
                    Voir fiche
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </TeacherShell>
  );
}
