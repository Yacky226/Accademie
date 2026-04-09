"use client";

import { useEffect, useMemo, useState } from "react";
import { useCurrentAuthSession } from "@/features/auth/model/useCurrentAuthSession";
import {
  createWorkspaceProgram,
  createWorkspaceProgramStep,
  fetchWorkspaceCourseEnrollments,
  fetchWorkspaceCourses,
  fetchWorkspacePrograms,
} from "@/features/workspace-data/api/workspace-api.client";
import type {
  CreateWorkspaceProgramPayload,
  CreateWorkspaceProgramStepPayload,
  WorkspaceEnrollmentRecord,
  WorkspaceProgramRecord,
} from "@/features/workspace-data/model/workspace-api.types";
import {
  formatWorkspaceDate,
  formatWorkspacePercent,
  toDateTimeLocalInputValue,
} from "@/features/workspace-data/model/workspace-ui.utils";
import styles from "../teacher-space.module.css";
import { TeacherShell } from "../components/TeacherShell";

type TeacherStudentRow = {
  id: string;
  fullName: string;
  email: string;
  courses: string[];
  averageProgress: number;
};

const EMPTY_PROGRAM: CreateWorkspaceProgramPayload = {
  title: "",
  description: "",
  goal: "",
  status: "ACTIVE",
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 30 * 86_400_000).toISOString(),
  studentId: "",
};

const EMPTY_STEP: CreateWorkspaceProgramStepPayload = {
  title: "",
  description: "",
  position: 1,
  status: "TODO",
  dueDate: new Date(Date.now() + 7 * 86_400_000).toISOString(),
};

export function TeacherStudentsPage() {
  const { user } = useCurrentAuthSession();
  const [students, setStudents] = useState<TeacherStudentRow[]>([]);
  const [programs, setPrograms] = useState<WorkspaceProgramRecord[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [programForm, setProgramForm] = useState(EMPTY_PROGRAM);
  const [stepForm, setStepForm] = useState(EMPTY_STEP);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<"program" | "step" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === selectedProgramId) ?? programs[0] ?? null,
    [programs, selectedProgramId],
  );

  useEffect(() => {
    void loadWorkspace();
  }, [user?.id]);

  useEffect(() => {
    if (selectedProgram && selectedProgram.id !== selectedProgramId) {
      setSelectedProgramId(selectedProgram.id);
    }
  }, [selectedProgram, selectedProgramId]);

  async function loadWorkspace() {
    setLoading(true);

    try {
      const teacherCourses = (await fetchWorkspaceCourses()).filter((course) =>
        user?.id ? course.creator.id === user.id : true,
      );
      const enrollmentGroups = await Promise.all(
        teacherCourses.map(async (course) => ({
          courseTitle: course.title,
          items: await fetchWorkspaceCourseEnrollments(course.id),
        })),
      );
      const teacherPrograms = (await fetchWorkspacePrograms()).filter((program) =>
        user?.id ? program.teacher.id === user.id : true,
      );

      setStudents(buildStudentRows(enrollmentGroups));
      setPrograms(teacherPrograms);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de charger les etudiants.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProgram() {
    if (!programForm.title.trim() || !programForm.studentId) {
      setErrorMessage("Le titre et l etudiant cible sont obligatoires.");
      return;
    }

    setSubmitting("program");
    try {
      await createWorkspaceProgram(programForm);
      setProgramForm(EMPTY_PROGRAM);
      setSuccessMessage("Le programme a ete cree.");
      setErrorMessage(null);
      await loadWorkspace();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de creer le programme.",
      );
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCreateStep() {
    if (!selectedProgram || !stepForm.title.trim()) {
      setErrorMessage("Selectionnez un programme et renseignez le titre de l etape.");
      return;
    }

    setSubmitting("step");
    try {
      await createWorkspaceProgramStep(selectedProgram.id, stepForm);
      setStepForm({
        ...EMPTY_STEP,
        position: (selectedProgram.steps.at(-1)?.position ?? 0) + 2,
      });
      setSuccessMessage("L etape a ete ajoutee.");
      setErrorMessage(null);
      await loadWorkspace();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible d ajouter l etape.",
      );
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <TeacherShell activePath="/teacher/students" title="Etudiants">
      <section>
        <h2 className={styles.sectionTitle}>Suivi des cohortes</h2>
        <p className={styles.sectionSub}>
          Retrouvez vos etudiants reels, leurs cours rattaches et les programmes d accompagnement.
        </p>
      </section>

      {errorMessage ? <p className={`${styles.sectionSub} ${styles.messageError}`}>{errorMessage}</p> : null}
      {successMessage ? (
        <p className={`${styles.sectionSub} ${styles.messageSuccess}`}>{successMessage}</p>
      ) : null}

      <section className={`${styles.gridKpi} ${styles.sectionSpacing}`}>
        <Tile label="Etudiants" value={String(students.length)} note="Detectes via les inscriptions" />
        <Tile label="Programmes" value={String(programs.length)} note="Plans de progression en cours" />
        <Tile label="Etapes" value={String(programs.reduce((sum, item) => sum + item.steps.length, 0))} note="Objectifs en suivi" />
        <Tile label="Progression moyenne" value={formatWorkspacePercent(students.reduce((sum, student) => sum + student.averageProgress, 0) / Math.max(students.length, 1))} note="Sur vos cours rattaches" />
      </section>

      <section className={`${styles.card} ${styles.sectionSpacing}`}>
        <h3 className={styles.sectionTitleReset}>Etudiants inscrits</h3>
        {loading ? <p className={styles.sectionSub}>Chargement des cohortes...</p> : null}
        {!loading ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Etudiant</th>
                  <th>Cours</th>
                  <th>Progression</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <strong>{student.fullName}</strong>
                      <p className={styles.sectionSub}>{student.email}</p>
                    </td>
                    <td>{student.courses.join(", ")}</td>
                    <td>{formatWorkspacePercent(student.averageProgress)}</td>
                  </tr>
                ))}
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={3}>Aucun etudiant n est encore inscrit a vos cours.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className={styles.split}>
        <article className={styles.card}>
          <h3>Creer un programme</h3>
          <div className={styles.formGrid}>
            <select
              className={styles.select}
              value={programForm.studentId}
              onChange={(event) => {
                setProgramForm((current) => ({ ...current, studentId: event.target.value }));
              }}
            >
              <option value="">Choisir un etudiant</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName}
                </option>
              ))}
            </select>
            <input className={styles.input} placeholder="Titre du programme" value={programForm.title} onChange={(event) => setProgramForm((current) => ({ ...current, title: event.target.value }))} />
            <textarea className={styles.textarea} placeholder="Description" value={programForm.description} onChange={(event) => setProgramForm((current) => ({ ...current, description: event.target.value }))} />
            <textarea className={styles.textarea} placeholder="Objectif du programme" value={programForm.goal} onChange={(event) => setProgramForm((current) => ({ ...current, goal: event.target.value }))} />
            <select className={styles.select} value={programForm.status} onChange={(event) => setProgramForm((current) => ({ ...current, status: event.target.value as CreateWorkspaceProgramPayload["status"] }))}>
              <option value="DRAFT">Brouillon</option>
              <option value="ACTIVE">Actif</option>
              <option value="COMPLETED">Termine</option>
              <option value="ARCHIVED">Archive</option>
            </select>
            <input className={styles.input} type="datetime-local" value={toDateTimeLocalInputValue(programForm.startDate)} onChange={(event) => setProgramForm((current) => ({ ...current, startDate: new Date(event.target.value).toISOString() }))} />
            <input className={styles.input} type="datetime-local" value={toDateTimeLocalInputValue(programForm.endDate, 24 * 30)} onChange={(event) => setProgramForm((current) => ({ ...current, endDate: new Date(event.target.value).toISOString() }))} />
          </div>
          <div className={styles.buttonRow}>
            <button className={styles.primaryBtn} type="button" onClick={() => void handleCreateProgram()}>
              {submitting === "program" ? "Creation..." : "Creer le programme"}
            </button>
          </div>
        </article>

        <article className={styles.card}>
          <h3>Ajouter une etape</h3>
          <div className={styles.formGrid}>
            <select
              className={styles.select}
              value={selectedProgram?.id ?? ""}
              onChange={(event) => setSelectedProgramId(event.target.value)}
            >
              <option value="">Choisir un programme</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.title}
                </option>
              ))}
            </select>
            <input className={styles.input} disabled={!selectedProgram} placeholder="Titre de l etape" value={stepForm.title} onChange={(event) => setStepForm((current) => ({ ...current, title: event.target.value }))} />
            <textarea className={styles.textarea} disabled={!selectedProgram} placeholder="Description de l etape" value={stepForm.description} onChange={(event) => setStepForm((current) => ({ ...current, description: event.target.value }))} />
            <div className={styles.buttonRow}>
              <select className={styles.select} disabled={!selectedProgram} value={stepForm.status} onChange={(event) => setStepForm((current) => ({ ...current, status: event.target.value as CreateWorkspaceProgramStepPayload["status"] }))}>
                <option value="TODO">A faire</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="COMPLETED">Terminee</option>
                <option value="SKIPPED">Ignoree</option>
              </select>
              <input className={styles.input} disabled={!selectedProgram} min={1} type="number" value={stepForm.position} onChange={(event) => setStepForm((current) => ({ ...current, position: Number(event.target.value) || 1 }))} />
            </div>
            <input className={styles.input} disabled={!selectedProgram} type="datetime-local" value={toDateTimeLocalInputValue(stepForm.dueDate, 24 * 7)} onChange={(event) => setStepForm((current) => ({ ...current, dueDate: new Date(event.target.value).toISOString() }))} />
          </div>
          <div className={styles.buttonRow}>
            <button className={styles.ghostBtn} disabled={!selectedProgram} type="button" onClick={() => void handleCreateStep()}>
              {submitting === "step" ? "Ajout..." : "Ajouter l etape"}
            </button>
          </div>
        </article>
      </section>

      <section className={`${styles.card} ${styles.sectionSpacing}`}>
        <h3 className={styles.sectionTitleReset}>Programmes actifs</h3>
        <div className={styles.stackGridMd}>
          {programs.map((program) => (
            <article key={program.id} className={styles.outlineCard}>
              <div className={styles.rowWrapBetween}>
                <div>
                  <strong>{program.title}</strong>
                  <p className={styles.sectionSub}>
                    {program.student.fullName} · {program.status} · debut {formatWorkspaceDate(program.startDate)}
                  </p>
                </div>
                <span className={styles.chip}>{program.steps.length} etapes</span>
              </div>
              <p className={styles.sectionSub}>{program.goal || program.description || "Sans objectif detaille."}</p>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Etape</th>
                    <th>Echeance</th>
                    <th>Etat</th>
                  </tr>
                </thead>
                <tbody>
                  {program.steps.map((step) => (
                    <tr key={step.id}>
                      <td>{step.title}</td>
                      <td>{formatWorkspaceDate(step.dueDate)}</td>
                      <td>{step.status}</td>
                    </tr>
                  ))}
                  {program.steps.length === 0 ? (
                    <tr>
                      <td colSpan={3}>Aucune etape pour ce programme.</td>
                    </tr>
                  ) : null}
                </tbody>
                </table>
              </div>
            </article>
          ))}
          {!loading && programs.length === 0 ? (
            <p className={styles.sectionSub}>Aucun programme n a encore ete cree.</p>
          ) : null}
        </div>
      </section>
    </TeacherShell>
  );
}

function buildStudentRows(
  groups: Array<{ courseTitle: string; items: WorkspaceEnrollmentRecord[] }>,
): TeacherStudentRow[] {
  const map = new Map<string, TeacherStudentRow & { count: number }>();

  for (const group of groups) {
    for (const enrollment of group.items) {
      const current = map.get(enrollment.user.id);
      if (current) {
        current.courses.push(group.courseTitle);
        current.averageProgress += enrollment.progressPercent;
        current.count += 1;
        continue;
      }

      map.set(enrollment.user.id, {
        id: enrollment.user.id,
        fullName: enrollment.user.fullName,
        email: enrollment.user.email,
        courses: [group.courseTitle],
        averageProgress: enrollment.progressPercent,
        count: 1,
      });
    }
  }

  return Array.from(map.values()).map((item) => ({
    id: item.id,
    fullName: item.fullName,
    email: item.email,
    courses: item.courses,
    averageProgress: item.averageProgress / Math.max(item.count, 1),
  }));
}

function Tile({
  label,
  note,
  value,
}: {
  label: string;
  note: string;
  value: string;
}) {
  return (
    <article className={styles.card}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
      <p className={styles.kpiTrend}>{note}</p>
    </article>
  );
}
