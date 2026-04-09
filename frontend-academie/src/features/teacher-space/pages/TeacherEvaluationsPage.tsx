"use client";

import { useEffect, useMemo, useState } from "react";
import { useCurrentAuthSession } from "@/features/auth/model/useCurrentAuthSession";
import {
  createWorkspaceEvaluation,
  createWorkspaceEvaluationQuestion,
  fetchWorkspaceCourses,
  fetchWorkspaceEvaluationAttempts,
  fetchWorkspaceEvaluations,
  gradeWorkspaceEvaluationAttempt,
} from "@/features/workspace-data/api/workspace-api.client";
import type {
  CreateWorkspaceEvaluationPayload,
  CreateWorkspaceEvaluationQuestionPayload,
  GradeWorkspaceEvaluationAttemptPayload,
  WorkspaceCourseRecord,
  WorkspaceEvaluationAttemptRecord,
  WorkspaceEvaluationRecord,
} from "@/features/workspace-data/model/workspace-api.types";
import {
  formatWorkspaceDateTime,
  slugifyWorkspaceValue,
  toDateTimeLocalInputValue,
} from "@/features/workspace-data/model/workspace-ui.utils";
import styles from "../teacher-space.module.css";
import { TeacherShell } from "../components/TeacherShell";

const EMPTY_EVALUATION: CreateWorkspaceEvaluationPayload = {
  title: "",
  slug: "",
  description: "",
  type: "QUIZ",
  instructions: "",
  durationInMinutes: 20,
  maxAttempts: 1,
  passScore: 60,
  startsAt: new Date().toISOString(),
  endsAt: new Date(Date.now() + 86_400_000).toISOString(),
  isPublished: false,
  courseId: "",
};

const EMPTY_QUESTION: CreateWorkspaceEvaluationQuestionPayload = {
  statement: "",
  questionType: "MULTIPLE_CHOICE",
  options: [],
  correctAnswer: "",
  points: 1,
  position: 1,
};

export function TeacherEvaluationsPage() {
  const { user } = useCurrentAuthSession();
  const [courses, setCourses] = useState<WorkspaceCourseRecord[]>([]);
  const [evaluations, setEvaluations] = useState<WorkspaceEvaluationRecord[]>([]);
  const [attempts, setAttempts] = useState<WorkspaceEvaluationAttemptRecord[]>([]);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState("");
  const [evaluationForm, setEvaluationForm] = useState(EMPTY_EVALUATION);
  const [questionForm, setQuestionForm] = useState(EMPTY_QUESTION);
  const [questionOptions, setQuestionOptions] = useState("");
  const [gradeForm, setGradeForm] = useState<Record<string, GradeWorkspaceEvaluationAttemptPayload>>({});
  const [loading, setLoading] = useState(true);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"evaluation" | "question" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedEvaluation = useMemo(
    () =>
      evaluations.find((evaluation) => evaluation.id === selectedEvaluationId) ?? evaluations[0] ?? null,
    [evaluations, selectedEvaluationId],
  );

  const pendingAttempts = attempts.filter((attempt) => attempt.status !== "GRADED");

  useEffect(() => {
    void loadBaseData();
  }, [user?.id]);

  useEffect(() => {
    if (selectedEvaluation && selectedEvaluation.id !== selectedEvaluationId) {
      setSelectedEvaluationId(selectedEvaluation.id);
    }
  }, [selectedEvaluation, selectedEvaluationId]);

  useEffect(() => {
    if (!selectedEvaluation) {
      setAttempts([]);
      return;
    }

    void loadAttempts(selectedEvaluation.id);
  }, [selectedEvaluation?.id]);

  async function loadBaseData() {
    setLoading(true);

    try {
      const [allCourses, allEvaluations] = await Promise.all([
        fetchWorkspaceCourses(),
        fetchWorkspaceEvaluations(),
      ]);
      const teacherCourses = user?.id ? allCourses.filter((course) => course.creator.id === user.id) : allCourses;
      const teacherEvaluations = user?.id
        ? allEvaluations.filter((evaluation) => evaluation.creator.id === user.id)
        : allEvaluations;

      setCourses(teacherCourses);
      setEvaluations(teacherEvaluations);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de charger les evaluations.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadAttempts(evaluationId: string) {
    try {
      const nextAttempts = await fetchWorkspaceEvaluationAttempts(evaluationId);
      setAttempts(nextAttempts);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de charger les tentatives.",
      );
    }
  }

  async function handleCreateEvaluation() {
    if (!evaluationForm.title.trim() || !evaluationForm.courseId) {
      setErrorMessage("Le titre et le cours associe sont obligatoires.");
      return;
    }

    setSubmitting("evaluation");
    try {
      const createdEvaluation = await createWorkspaceEvaluation({
        ...evaluationForm,
        slug: slugifyWorkspaceValue(evaluationForm.slug || evaluationForm.title),
      });
      setEvaluationForm(EMPTY_EVALUATION);
      setSelectedEvaluationId(createdEvaluation.id);
      setSuccessMessage("L evaluation a ete creee.");
      setErrorMessage(null);
      await loadBaseData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de creer l evaluation.",
      );
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCreateQuestion() {
    if (!selectedEvaluation || !questionForm.statement.trim() || !questionForm.correctAnswer.trim()) {
      setErrorMessage("Le libelle et la bonne reponse sont obligatoires.");
      return;
    }

    setSubmitting("question");
    try {
      await createWorkspaceEvaluationQuestion(selectedEvaluation.id, {
        ...questionForm,
        options: questionOptions
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
      });
      setQuestionForm({
        ...EMPTY_QUESTION,
        position: (selectedEvaluation.questions.at(-1)?.position ?? 0) + 2,
      });
      setQuestionOptions("");
      setSuccessMessage("La question a ete ajoutee.");
      setErrorMessage(null);
      await loadBaseData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible d ajouter la question.",
      );
    } finally {
      setSubmitting(null);
    }
  }

  async function handleGradeAttempt(attemptId: string) {
    const payload = gradeForm[attemptId];
    if (!payload) {
      setErrorMessage("Renseignez un score avant de corriger cette tentative.");
      return;
    }

    setGradingId(attemptId);
    try {
      await gradeWorkspaceEvaluationAttempt(attemptId, payload);
      setSuccessMessage("La tentative a ete corrigee.");
      setErrorMessage(null);
      await loadAttempts(selectedEvaluation?.id ?? "");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de corriger cette tentative.",
      );
    } finally {
      setGradingId(null);
    }
  }

  return (
    <TeacherShell activePath="/teacher/evaluations" title="Evaluations">
      <section>
        <h2 className={styles.sectionTitle}>QCM et corrections</h2>
        <p className={styles.sectionSub}>
          Creez vos evaluations, ajoutez des questions et corrigez les tentatives depuis le
          workspace Teacher.
        </p>
      </section>

      {errorMessage ? <p className={`${styles.sectionSub} ${styles.messageError}`}>{errorMessage}</p> : null}
      {successMessage ? (
        <p className={`${styles.sectionSub} ${styles.messageSuccess}`}>{successMessage}</p>
      ) : null}

      <section className={`${styles.gridKpi} ${styles.sectionSpacing}`}>
        <StatCard label="Evaluations" value={String(evaluations.length)} note="Creees par vous" />
        <StatCard label="Questions" value={String(evaluations.reduce((sum, item) => sum + item.questions.length, 0))} note="QCM et reponses" />
        <StatCard label="Tentatives" value={String(attempts.length)} note="Sur l evaluation selectionnee" />
        <StatCard label="A corriger" value={String(pendingAttempts.length)} note="Soumissions en attente" />
      </section>

      <section className={styles.split}>
        <article className={styles.card}>
          <h3>Nouvelle evaluation</h3>
          <div className={styles.formGrid}>
            <input className={styles.input} placeholder="Titre" value={evaluationForm.title} onChange={(event) => setEvaluationForm((current) => ({ ...current, title: event.target.value, slug: current.slug && current.slug !== slugifyWorkspaceValue(current.title) ? current.slug : slugifyWorkspaceValue(event.target.value) }))} />
            <select className={styles.select} value={evaluationForm.courseId} onChange={(event) => setEvaluationForm((current) => ({ ...current, courseId: event.target.value }))}>
              <option value="">Choisir un cours</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
            <textarea className={styles.textarea} placeholder="Instructions" value={evaluationForm.instructions} onChange={(event) => setEvaluationForm((current) => ({ ...current, instructions: event.target.value }))} />
            <div className={styles.buttonRow}>
              <select className={styles.select} value={evaluationForm.type} onChange={(event) => setEvaluationForm((current) => ({ ...current, type: event.target.value as CreateWorkspaceEvaluationPayload["type"] }))}>
                <option value="QUIZ">QCM</option>
                <option value="EXAM">Examen</option>
                <option value="ASSIGNMENT">Devoir</option>
                <option value="PRACTICE">Pratique</option>
              </select>
              <input className={styles.input} min={1} type="number" value={evaluationForm.durationInMinutes} onChange={(event) => setEvaluationForm((current) => ({ ...current, durationInMinutes: Number(event.target.value) || 1 }))} placeholder="Duree" />
            </div>
            <div className={styles.buttonRow}>
              <input className={styles.input} min={1} type="number" value={evaluationForm.maxAttempts} onChange={(event) => setEvaluationForm((current) => ({ ...current, maxAttempts: Number(event.target.value) || 1 }))} placeholder="Tentatives max" />
              <input className={styles.input} min={0} max={100} type="number" value={evaluationForm.passScore} onChange={(event) => setEvaluationForm((current) => ({ ...current, passScore: Number(event.target.value) || 0 }))} placeholder="Score de reussite" />
            </div>
            <input className={styles.input} type="datetime-local" value={toDateTimeLocalInputValue(evaluationForm.startsAt)} onChange={(event) => setEvaluationForm((current) => ({ ...current, startsAt: new Date(event.target.value).toISOString() }))} />
            <input className={styles.input} type="datetime-local" value={toDateTimeLocalInputValue(evaluationForm.endsAt, 24)} onChange={(event) => setEvaluationForm((current) => ({ ...current, endsAt: new Date(event.target.value).toISOString() }))} />
          </div>
          <div className={styles.buttonRow}>
            <button className={styles.primaryBtn} type="button" onClick={() => void handleCreateEvaluation()}>
              {submitting === "evaluation" ? "Creation..." : "Creer l evaluation"}
            </button>
          </div>
        </article>

        <article className={styles.card}>
          <h3>Ajouter une question</h3>
          <div className={styles.formGrid}>
            <select className={styles.select} value={selectedEvaluation?.id ?? ""} onChange={(event) => setSelectedEvaluationId(event.target.value)}>
              <option value="">Choisir une evaluation</option>
              {evaluations.map((evaluation) => (
                <option key={evaluation.id} value={evaluation.id}>{evaluation.title}</option>
              ))}
            </select>
            <textarea className={styles.textarea} disabled={!selectedEvaluation} placeholder="Libelle de la question" value={questionForm.statement} onChange={(event) => setQuestionForm((current) => ({ ...current, statement: event.target.value }))} />
            <textarea className={styles.textarea} disabled={!selectedEvaluation} placeholder={"Options du QCM, une par ligne"} value={questionOptions} onChange={(event) => setQuestionOptions(event.target.value)} />
            <input className={styles.input} disabled={!selectedEvaluation} placeholder="Bonne reponse" value={questionForm.correctAnswer} onChange={(event) => setQuestionForm((current) => ({ ...current, correctAnswer: event.target.value }))} />
            <div className={styles.buttonRow}>
              <input className={styles.input} disabled={!selectedEvaluation} min={1} type="number" value={questionForm.points} onChange={(event) => setQuestionForm((current) => ({ ...current, points: Number(event.target.value) || 1 }))} placeholder="Points" />
              <input className={styles.input} disabled={!selectedEvaluation} min={1} type="number" value={questionForm.position} onChange={(event) => setQuestionForm((current) => ({ ...current, position: Number(event.target.value) || 1 }))} placeholder="Position" />
            </div>
          </div>
          <div className={styles.buttonRow}>
            <button className={styles.ghostBtn} disabled={!selectedEvaluation} type="button" onClick={() => void handleCreateQuestion()}>
              {submitting === "question" ? "Ajout..." : "Ajouter la question"}
            </button>
          </div>
        </article>
      </section>

      <section className={`${styles.card} ${styles.sectionSpacing}`}>
        <h3 className={styles.sectionTitleReset}>Questions et tentatives</h3>
        {loading ? <p className={styles.sectionSub}>Chargement des evaluations...</p> : null}
        {!loading && !selectedEvaluation ? (
          <p className={styles.sectionSub}>Aucune evaluation encore disponible.</p>
        ) : null}
        {selectedEvaluation ? (
          <div className={styles.stackGridMd}>
            <div className={styles.rowWrapBetween}>
              <div>
                <strong>{selectedEvaluation.title}</strong>
                <p className={styles.sectionSub}>
                  {selectedEvaluation.course?.title ?? "Sans cours"} · commence le{" "}
                  {formatWorkspaceDateTime(selectedEvaluation.startsAt)}
                </p>
              </div>
              <span className={styles.chip}>{selectedEvaluation.isPublished ? "Publiee" : "Brouillon"}</span>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Bonne reponse</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEvaluation.questions.map((question) => (
                    <tr key={question.id}>
                      <td>{question.statement}</td>
                      <td>{question.correctAnswer ?? "A definir"}</td>
                      <td>{question.points}</td>
                    </tr>
                  ))}
                  {selectedEvaluation.questions.length === 0 ? (
                    <tr>
                      <td colSpan={3}>Aucune question pour cette evaluation.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Etudiant</th>
                    <th>Soumis le</th>
                    <th>Statut</th>
                    <th>Correction</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt) => (
                    <tr key={attempt.id}>
                      <td>{attempt.student.fullName}</td>
                      <td>{formatWorkspaceDateTime(attempt.submittedAt)}</td>
                      <td>{attempt.status}</td>
                      <td>
                        <div className={styles.stackGridSm}>
                          <input
                            className={styles.input}
                            min={0}
                            type="number"
                            value={gradeForm[attempt.id]?.score ?? attempt.score ?? 0}
                            onChange={(event) =>
                              setGradeForm((current) => ({
                                ...current,
                                [attempt.id]: {
                                  feedback: current[attempt.id]?.feedback ?? attempt.feedback ?? "",
                                  score: Number(event.target.value) || 0,
                                },
                              }))
                            }
                          />
                          <input
                            className={styles.input}
                            value={gradeForm[attempt.id]?.feedback ?? attempt.feedback ?? ""}
                            onChange={(event) =>
                              setGradeForm((current) => ({
                                ...current,
                                [attempt.id]: {
                                  feedback: event.target.value,
                                  score: current[attempt.id]?.score ?? Number(attempt.score ?? 0),
                                },
                              }))
                            }
                            placeholder="Feedback"
                          />
                          <button
                            className={styles.primaryBtn}
                            type="button"
                            onClick={() => void handleGradeAttempt(attempt.id)}
                          >
                            {gradingId === attempt.id ? "Correction..." : "Corriger"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {attempts.length === 0 ? (
                    <tr>
                      <td colSpan={4}>Aucune tentative soumise pour cette evaluation.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>
    </TeacherShell>
  );
}

function StatCard({
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
