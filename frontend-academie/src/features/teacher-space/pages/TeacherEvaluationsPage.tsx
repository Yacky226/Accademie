"use client";

import { useEffect, useMemo, useState } from "react";
import { useCurrentAuthSession } from "@/features/auth/model/useCurrentAuthSession";
import {
  createWorkspaceEvaluation,
  createWorkspaceEvaluationQuestion,
  deleteWorkspaceEvaluationQuestion,
  fetchWorkspaceCourses,
  fetchWorkspaceEvaluationAttempts,
  fetchWorkspaceEvaluations,
  updateWorkspaceEvaluation,
} from "@/features/workspace-data/api/workspace-api.client";
import type {
  CreateWorkspaceEvaluationPayload,
  CreateWorkspaceEvaluationQuestionPayload,
  WorkspaceCourseRecord,
  WorkspaceEvaluationAttemptRecord,
  WorkspaceEvaluationRecord,
} from "@/features/workspace-data/model/workspace-api.types";
import {
  formatWorkspaceDateTime,
  slugifyWorkspaceValue,
  toDateTimeLocalInputValue,
} from "@/features/workspace-data/model/workspace-ui.utils";
import {
  buildEvaluationQuestionPayloadFromDraft,
  createEmptyEvaluationQuestionDraft,
  EVALUATION_QUESTION_TYPE_OPTIONS,
  formatEvaluationCorrectAnswerPreview,
  formatEvaluationQuestionTypeLabel,
  parseEvaluationAuthoringLines,
  renumberEvaluationQuestionDrafts,
  type EvaluationQuestionDraftRecord,
} from "@/features/workspace-data/model/evaluation-authoring.utils";
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

function formatEvaluationType(type: string) {
  if (type === "QUIZ") {
    return "QCM";
  }

  if (type === "EXAM") {
    return "Examen";
  }

  if (type === "ASSIGNMENT") {
    return "Devoir";
  }

  if (type === "PRACTICE") {
    return "Pratique";
  }

  return "Evaluation";
}

function formatAttemptAnswer(answer: unknown) {
  if (Array.isArray(answer)) {
    return answer
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .join(", ");
  }

  if (typeof answer === "string") {
    return answer.trim();
  }

  return "";
}

function buildEvaluationUpdatePayload(
  evaluation: WorkspaceEvaluationRecord,
  isPublished: boolean,
): Partial<CreateWorkspaceEvaluationPayload> {
  return {
    title: evaluation.title,
    slug: evaluation.slug,
    description: evaluation.description,
    type:
      evaluation.type === "QUIZ" ||
      evaluation.type === "EXAM" ||
      evaluation.type === "ASSIGNMENT" ||
      evaluation.type === "PRACTICE"
        ? evaluation.type
        : "QUIZ",
    instructions: evaluation.instructions,
    durationInMinutes: evaluation.durationInMinutes ?? 20,
    maxAttempts: evaluation.maxAttempts,
    passScore: evaluation.passScore,
    startsAt: evaluation.startsAt ?? new Date().toISOString(),
    endsAt:
      evaluation.endsAt ?? new Date(Date.now() + 86_400_000).toISOString(),
    isPublished,
    courseId: evaluation.course?.id ?? "",
  };
}

export function TeacherEvaluationsPage() {
  const { user } = useCurrentAuthSession();
  const [courses, setCourses] = useState<WorkspaceCourseRecord[]>([]);
  const [evaluations, setEvaluations] = useState<WorkspaceEvaluationRecord[]>([]);
  const [attempts, setAttempts] = useState<WorkspaceEvaluationAttemptRecord[]>([]);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState("");
  const [evaluationForm, setEvaluationForm] = useState(EMPTY_EVALUATION);
  const [creationQuestionForm, setCreationQuestionForm] = useState<EvaluationQuestionDraftRecord>(
    createEmptyEvaluationQuestionDraft(1),
  );
  const [creationQuestions, setCreationQuestions] = useState<EvaluationQuestionDraftRecord[]>([]);
  const [editingCreationQuestionId, setEditingCreationQuestionId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState(EMPTY_QUESTION);
  const [questionOptions, setQuestionOptions] = useState("");
  const [questionAnswerKey, setQuestionAnswerKey] = useState("");
  const [questionCorrectSelections, setQuestionCorrectSelections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<"evaluation" | "question" | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const parsedQuestionOptions = useMemo(
    () => parseEvaluationAuthoringLines(questionOptions),
    [questionOptions],
  );
  const selectedEvaluation = useMemo(
    () =>
      evaluations.find((evaluation) => evaluation.id === selectedEvaluationId) ??
      evaluations[0] ??
      null,
    [evaluations, selectedEvaluationId],
  );
  const sortedQuestions = useMemo(
    () =>
      [...(selectedEvaluation?.questions ?? [])].sort(
        (left, right) => left.position - right.position,
      ),
    [selectedEvaluation?.questions],
  );

  useEffect(() => {
    let isMounted = true;

    async function hydrateBaseData() {
      setLoading(true);

      try {
        const [allCourses, allEvaluations] = await Promise.all([
          fetchWorkspaceCourses(),
          fetchWorkspaceEvaluations(),
        ]);
        const teacherCourses = user?.id
          ? allCourses.filter((course) => course.creator.id === user.id)
          : allCourses;
        const teacherEvaluations = user?.id
          ? allEvaluations.filter((evaluation) => evaluation.creator.id === user.id)
          : allEvaluations;

        if (!isMounted) {
          return;
        }

        setCourses(teacherCourses);
        setEvaluations(teacherEvaluations);
        setErrorMessage(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger les evaluations.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void hydrateBaseData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!selectedEvaluationId && evaluations[0]) {
      setSelectedEvaluationId(evaluations[0].id);
      return;
    }

    if (
      selectedEvaluationId &&
      !evaluations.some((evaluation) => evaluation.id === selectedEvaluationId)
    ) {
      setSelectedEvaluationId(evaluations[0]?.id ?? "");
    }
  }, [evaluations, selectedEvaluationId]);

  useEffect(() => {
    let isMounted = true;

    async function hydrateAttempts() {
      if (!selectedEvaluation) {
        setAttempts([]);
        return;
      }

      try {
        const nextAttempts = await fetchWorkspaceEvaluationAttempts(
          selectedEvaluation.id,
        );

        if (!isMounted) {
          return;
        }

        setAttempts(nextAttempts);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger les tentatives.",
        );
      }
    }

    void hydrateAttempts();

    return () => {
      isMounted = false;
    };
  }, [selectedEvaluation]);

  useEffect(() => {
    if (!selectedEvaluation) {
      return;
    }

    const nextPosition =
      sortedQuestions.reduce(
        (maxPosition, question) => Math.max(maxPosition, question.position),
        0,
      ) + 1;

    setQuestionForm((current) => ({
      ...current,
      position: nextPosition,
    }));
  }, [selectedEvaluation, sortedQuestions]);

  useEffect(() => {
    setQuestionCorrectSelections((current) => {
      const nextSelections = current.filter((value) =>
        parsedQuestionOptions.includes(value),
      );

      if (questionForm.questionType === "MULTIPLE_CHOICE") {
        return nextSelections.slice(0, 1);
      }

      return nextSelections;
    });
  }, [parsedQuestionOptions, questionForm.questionType]);

  useEffect(() => {
    if (editingCreationQuestionId) {
      return;
    }

    setCreationQuestionForm((current) => ({
      ...current,
      position: creationQuestions.length + 1,
    }));
  }, [creationQuestions.length, editingCreationQuestionId]);

  async function loadBaseData() {
    setLoading(true);

    try {
      const [allCourses, allEvaluations] = await Promise.all([
        fetchWorkspaceCourses(),
        fetchWorkspaceEvaluations(),
      ]);
      const teacherCourses = user?.id
        ? allCourses.filter((course) => course.creator.id === user.id)
        : allCourses;
      const teacherEvaluations = user?.id
        ? allEvaluations.filter((evaluation) => evaluation.creator.id === user.id)
        : allEvaluations;

      setCourses(teacherCourses);
      setEvaluations(teacherEvaluations);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de charger les evaluations.",
      );
    } finally {
      setLoading(false);
    }
  }

  function resetCreationQuestionComposer() {
    setCreationQuestionForm(createEmptyEvaluationQuestionDraft(creationQuestions.length + 1));
    setEditingCreationQuestionId(null);
  }

  function handleQueueCreationQuestion() {
    const result = buildEvaluationQuestionPayloadFromDraft(creationQuestionForm);

    if (!result.payload) {
      setErrorMessage(result.errorMessage ?? "Impossible de preparer cette question.");
      return;
    }

    setCreationQuestions((current) => {
      if (editingCreationQuestionId) {
        return renumberEvaluationQuestionDrafts(
          current.map((question) =>
            question.id === editingCreationQuestionId ? { ...creationQuestionForm } : question,
          ),
        );
      }

      return renumberEvaluationQuestionDrafts([...current, { ...creationQuestionForm }]);
    });
    setErrorMessage(null);
    setSuccessMessage(
      editingCreationQuestionId
        ? "La question preparatoire a ete mise a jour."
        : "La question a ete ajoutee au brouillon de creation.",
    );
    resetCreationQuestionComposer();
  }

  function handleEditCreationQuestion(questionId: string) {
    const targetQuestion = creationQuestions.find((question) => question.id === questionId);

    if (!targetQuestion) {
      return;
    }

    setCreationQuestionForm({ ...targetQuestion });
    setEditingCreationQuestionId(questionId);
  }

  function handleRemoveCreationQuestion(questionId: string) {
    setCreationQuestions((current) =>
      renumberEvaluationQuestionDrafts(
        current.filter((question) => question.id !== questionId),
      ),
    );

    if (editingCreationQuestionId === questionId) {
      resetCreationQuestionComposer();
    }
  }

  async function handleCreateEvaluation() {
    if (!evaluationForm.title.trim() || !evaluationForm.courseId) {
      setErrorMessage("Le titre et le cours associe sont obligatoires.");
      return;
    }

    const questionPayloads: CreateWorkspaceEvaluationQuestionPayload[] = [];

    for (const question of creationQuestions) {
      const result = buildEvaluationQuestionPayloadFromDraft(question);
      if (!result.payload) {
        setErrorMessage(
          `Question ${question.position}: ${result.errorMessage ?? "configuration invalide."}`,
        );
        return;
      }

      questionPayloads.push(result.payload);
    }

    if (questionPayloads.length === 0) {
      setErrorMessage(
        "Ajoutez au moins une question pour creer une evaluation exploitable.",
      );
      return;
    }

    setSubmitting("evaluation");

    try {
      const createdEvaluation = await createWorkspaceEvaluation({
        ...evaluationForm,
        slug: slugifyWorkspaceValue(evaluationForm.slug || evaluationForm.title),
        questions: questionPayloads,
      });

      setEvaluationForm(EMPTY_EVALUATION);
      setCreationQuestions([]);
      setCreationQuestionForm(createEmptyEvaluationQuestionDraft(1));
      setEditingCreationQuestionId(null);
      setSelectedEvaluationId(createdEvaluation.id);
      setSuccessMessage("L evaluation et ses questions ont ete creees.");
      setErrorMessage(null);
      await loadBaseData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de creer l evaluation.",
      );
    } finally {
      setSubmitting(null);
    }
  }

  function buildQuestionPayload(): CreateWorkspaceEvaluationQuestionPayload | null {
    if (!questionForm.statement.trim()) {
      setErrorMessage("Le libelle de la question est obligatoire.");
      return null;
    }

    if (questionForm.questionType === "MULTIPLE_CHOICE") {
      if (parsedQuestionOptions.length < 2) {
        setErrorMessage("Ajoutez au moins deux options pour un QCM simple.");
        return null;
      }

      if (questionCorrectSelections.length !== 1) {
        setErrorMessage("Selectionnez une seule bonne reponse.");
        return null;
      }

      return {
        ...questionForm,
        options: parsedQuestionOptions,
        correctAnswer: questionCorrectSelections[0],
      };
    }

    if (questionForm.questionType === "MULTIPLE_RESPONSE") {
      if (parsedQuestionOptions.length < 2) {
        setErrorMessage("Ajoutez au moins deux options pour ce QCM.");
        return null;
      }

      if (questionCorrectSelections.length === 0) {
        setErrorMessage("Selectionnez au moins une bonne reponse.");
        return null;
      }

      return {
        ...questionForm,
        options: parsedQuestionOptions,
        correctAnswer: JSON.stringify(
          parsedQuestionOptions.filter((option) =>
            questionCorrectSelections.includes(option),
          ),
        ),
      };
    }

    if (questionForm.questionType === "FILL_BLANK") {
      const acceptedAnswers = parseEvaluationAuthoringLines(questionAnswerKey);

      if (!acceptedAnswers.length) {
        setErrorMessage("Ajoutez au moins une reponse acceptee.");
        return null;
      }

      return {
        ...questionForm,
        options: [],
        correctAnswer:
          acceptedAnswers.length === 1
            ? acceptedAnswers[0]
            : JSON.stringify(acceptedAnswers),
      };
    }

    if (!questionAnswerKey.trim()) {
      setErrorMessage("Ajoutez la reponse exacte attendue pour cette question.");
      return null;
    }

    return {
      ...questionForm,
      options: [],
      correctAnswer: questionAnswerKey.trim(),
    };
  }

  async function handleCreateQuestion() {
    if (!selectedEvaluation) {
      setErrorMessage("Choisissez d abord une evaluation.");
      return;
    }

    const payload = buildQuestionPayload();
    if (!payload) {
      return;
    }

    setSubmitting("question");

    try {
      await createWorkspaceEvaluationQuestion(selectedEvaluation.id, payload);
      setQuestionForm({
        ...EMPTY_QUESTION,
        position: payload.position + 1,
      });
      setQuestionOptions("");
      setQuestionAnswerKey("");
      setQuestionCorrectSelections([]);
      setSuccessMessage("La question a ete ajoutee.");
      setErrorMessage(null);
      await loadBaseData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d ajouter la question.",
      );
    } finally {
      setSubmitting(null);
    }
  }

  async function handleTogglePublished() {
    if (!selectedEvaluation) {
      return;
    }

    setPublishingId(selectedEvaluation.id);

    try {
      await updateWorkspaceEvaluation(
        selectedEvaluation.id,
        buildEvaluationUpdatePayload(
          selectedEvaluation,
          !selectedEvaluation.isPublished,
        ),
      );
      setSuccessMessage(
        selectedEvaluation.isPublished
          ? "L evaluation est repassee en brouillon."
          : "L evaluation a ete publiee.",
      );
      setErrorMessage(null);
      await loadBaseData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de mettre a jour cette evaluation.",
      );
    } finally {
      setPublishingId(null);
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!selectedEvaluation) {
      return;
    }

    setDeletingQuestionId(questionId);

    try {
      await deleteWorkspaceEvaluationQuestion(selectedEvaluation.id, questionId);
      setSuccessMessage("La question a ete supprimee.");
      setErrorMessage(null);
      await loadBaseData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer cette question.",
      );
    } finally {
      setDeletingQuestionId(null);
    }
  }

  return (
    <TeacherShell activePath="/teacher/evaluations" title="Evaluations">
      <section>
        <h2 className={styles.sectionTitle}>QCM et evaluations</h2>
        <p className={styles.sectionSub}>
          Creez les evaluations, definissez les reponses attendues, puis laissez
          le systeme corriger chaque soumission instantanement.
        </p>
      </section>

      {errorMessage ? (
        <p className={`${styles.sectionSub} ${styles.messageError}`}>{errorMessage}</p>
      ) : null}
      {successMessage ? (
        <p className={`${styles.sectionSub} ${styles.messageSuccess}`}>{successMessage}</p>
      ) : null}

      <section className={`${styles.gridKpi} ${styles.sectionSpacing}`}>
        <StatCard
          label="Evaluations"
          note="Creees par vous"
          value={String(evaluations.length)}
        />
        <StatCard
          label="Questions"
          note="Tous formats confondus"
          value={String(evaluations.reduce((sum, item) => sum + item.questions.length, 0))}
        />
        <StatCard
          label="Tentatives"
          note="Sur l evaluation selectionnee"
          value={String(attempts.length)}
        />
        <StatCard
          label="Auto-corrigees"
          note="Resultats instantanes"
          value={String(attempts.filter((attempt) => attempt.status === "GRADED").length)}
        />
      </section>

      <section className={styles.split}>
        <article className={styles.card}>
          <h3>Nouvelle evaluation</h3>
          <div className={styles.formGrid}>
            <input
              className={styles.input}
              placeholder="Titre"
              value={evaluationForm.title}
              onChange={(event) =>
                setEvaluationForm((current) => ({
                  ...current,
                  title: event.target.value,
                  slug:
                    current.slug &&
                    current.slug !== slugifyWorkspaceValue(current.title)
                      ? current.slug
                      : slugifyWorkspaceValue(event.target.value),
                }))
              }
            />
            <select
              className={styles.select}
              value={evaluationForm.courseId}
              onChange={(event) =>
                setEvaluationForm((current) => ({
                  ...current,
                  courseId: event.target.value,
                }))
              }
            >
              <option value="">Choisir un cours</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <input
              className={styles.input}
              placeholder="Description courte"
              value={evaluationForm.description}
              onChange={(event) =>
                setEvaluationForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
            <textarea
              className={styles.textarea}
              placeholder="Instructions pour les etudiants"
              value={evaluationForm.instructions}
              onChange={(event) =>
                setEvaluationForm((current) => ({
                  ...current,
                  instructions: event.target.value,
                }))
              }
            />
            <div className={styles.buttonRow}>
              <select
                className={styles.select}
                value={evaluationForm.type}
                onChange={(event) =>
                  setEvaluationForm((current) => ({
                    ...current,
                    type: event.target.value as CreateWorkspaceEvaluationPayload["type"],
                  }))
                }
              >
                <option value="QUIZ">QCM</option>
                <option value="EXAM">Examen</option>
                <option value="ASSIGNMENT">Devoir</option>
                <option value="PRACTICE">Pratique</option>
              </select>
              <input
                className={styles.input}
                min={1}
                type="number"
                value={evaluationForm.durationInMinutes}
                onChange={(event) =>
                  setEvaluationForm((current) => ({
                    ...current,
                    durationInMinutes: Number(event.target.value) || 1,
                  }))
                }
              />
            </div>
            <div className={styles.buttonRow}>
              <input
                className={styles.input}
                min={1}
                type="number"
                value={evaluationForm.maxAttempts}
                onChange={(event) =>
                  setEvaluationForm((current) => ({
                    ...current,
                    maxAttempts: Number(event.target.value) || 1,
                  }))
                }
              />
              <input
                className={styles.input}
                min={0}
                max={100}
                type="number"
                value={evaluationForm.passScore}
                onChange={(event) =>
                  setEvaluationForm((current) => ({
                    ...current,
                    passScore: Number(event.target.value) || 0,
                  }))
                }
              />
            </div>
            <input
              className={styles.input}
              type="datetime-local"
              value={toDateTimeLocalInputValue(evaluationForm.startsAt)}
              onChange={(event) =>
                setEvaluationForm((current) => ({
                  ...current,
                  startsAt: new Date(event.target.value).toISOString(),
                }))
              }
            />
            <input
              className={styles.input}
              type="datetime-local"
              value={toDateTimeLocalInputValue(evaluationForm.endsAt, 24)}
              onChange={(event) =>
                setEvaluationForm((current) => ({
                  ...current,
                  endsAt: new Date(event.target.value).toISOString(),
                }))
              }
            />
            <p className={styles.sectionSub}>
              L evaluation sera creee en brouillon. Publiez-la apres avoir ajoute
              toutes les reponses attendues.
            </p>

            <div className={styles.outlineCard}>
              <div className={styles.rowWrapBetween}>
                <strong>Questions incluses a la creation</strong>
                <span className={styles.chip}>{creationQuestions.length} prete(s)</span>
              </div>
              <div className={styles.formGrid}>
                <textarea
                  className={styles.textarea}
                  placeholder="Libelle de la question"
                  value={creationQuestionForm.statement}
                  onChange={(event) =>
                    setCreationQuestionForm((current) => ({
                      ...current,
                      statement: event.target.value,
                    }))
                  }
                />
                <select
                  className={styles.select}
                  value={creationQuestionForm.questionType}
                  onChange={(event) =>
                    setCreationQuestionForm((current) => ({
                      ...current,
                      questionType: event.target.value as EvaluationQuestionDraftRecord["questionType"],
                      correctSelections: [],
                      answerText: "",
                    }))
                  }
                >
                  {EVALUATION_QUESTION_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {(creationQuestionForm.questionType === "MULTIPLE_CHOICE" ||
                  creationQuestionForm.questionType === "MULTIPLE_RESPONSE") ? (
                  <>
                    <textarea
                      className={styles.textarea}
                      placeholder="Options, une par ligne"
                      value={creationQuestionForm.optionText}
                      onChange={(event) =>
                        setCreationQuestionForm((current) => ({
                          ...current,
                          optionText: event.target.value,
                        }))
                      }
                    />
                    <div className={styles.evaluationOptionPreview}>
                      {parseEvaluationAuthoringLines(creationQuestionForm.optionText).map((option) => (
                        <label
                          key={option}
                          className={styles.evaluationOptionPreviewItem}
                        >
                          <input
                            checked={creationQuestionForm.correctSelections.includes(option)}
                            onChange={() =>
                              setCreationQuestionForm((current) => {
                                if (current.questionType === "MULTIPLE_CHOICE") {
                                  return {
                                    ...current,
                                    correctSelections: current.correctSelections.includes(option)
                                      ? []
                                      : [option],
                                  };
                                }

                                return {
                                  ...current,
                                  correctSelections: current.correctSelections.includes(option)
                                    ? current.correctSelections.filter((value) => value !== option)
                                    : [...current.correctSelections, option],
                                };
                              })
                            }
                            type={
                              creationQuestionForm.questionType === "MULTIPLE_CHOICE"
                                ? "radio"
                                : "checkbox"
                            }
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </>
                ) : null}

                {creationQuestionForm.questionType === "FILL_BLANK" ? (
                  <textarea
                    className={styles.textarea}
                    placeholder="Reponses acceptees, une par ligne"
                    value={creationQuestionForm.answerText}
                    onChange={(event) =>
                      setCreationQuestionForm((current) => ({
                        ...current,
                        answerText: event.target.value,
                      }))
                    }
                  />
                ) : null}

                {creationQuestionForm.questionType === "TEXT" ? (
                  <textarea
                    className={styles.textarea}
                    placeholder="Reponse exacte attendue"
                    value={creationQuestionForm.answerText}
                    onChange={(event) =>
                      setCreationQuestionForm((current) => ({
                        ...current,
                        answerText: event.target.value,
                      }))
                    }
                  />
                ) : null}

                <div className={styles.buttonRow}>
                  <input
                    className={styles.input}
                    min={1}
                    type="number"
                    value={creationQuestionForm.points}
                    onChange={(event) =>
                      setCreationQuestionForm((current) => ({
                        ...current,
                        points: Number(event.target.value) || 1,
                      }))
                    }
                  />
                  <input
                    className={styles.input}
                    min={1}
                    type="number"
                    value={creationQuestionForm.position}
                    onChange={(event) =>
                      setCreationQuestionForm((current) => ({
                        ...current,
                        position: Number(event.target.value) || 1,
                      }))
                    }
                  />
                </div>
                <div className={styles.buttonRow}>
                  <button
                    className={styles.ghostBtn}
                    type="button"
                    onClick={handleQueueCreationQuestion}
                  >
                    {editingCreationQuestionId ? "Mettre a jour la question" : "Ajouter au brouillon"}
                  </button>
                  <button
                    className={styles.ghostBtn}
                    type="button"
                    onClick={resetCreationQuestionComposer}
                  >
                    Reinitialiser
                  </button>
                </div>
              </div>

              <div className={styles.problemLanguageList}>
                {creationQuestions.map((question) => {
                  const result = buildEvaluationQuestionPayloadFromDraft(question);
                  const preview = result.payload
                    ? formatEvaluationCorrectAnswerPreview(result.payload.correctAnswer)
                    : result.errorMessage ?? "Configuration incomplete";

                  return (
                    <div key={question.id} className={styles.problemLanguageItem}>
                      <div className={styles.rowWrapBetween}>
                        <strong>
                          Q{question.position}. {formatEvaluationQuestionTypeLabel(question.questionType)}
                        </strong>
                        <span className={styles.chip}>{question.points} pt(s)</span>
                      </div>
                      <span>{question.statement}</span>
                      <p className={styles.sectionSub}>Bonne reponse: {preview}</p>
                      <div className={styles.buttonRow}>
                        <button
                          className={styles.ghostBtn}
                          type="button"
                          onClick={() => handleEditCreationQuestion(question.id)}
                        >
                          Modifier
                        </button>
                        <button
                          className={styles.ghostBtn}
                          type="button"
                          onClick={() => handleRemoveCreationQuestion(question.id)}
                        >
                          Retirer
                        </button>
                      </div>
                    </div>
                  );
                })}
                {!creationQuestions.length ? (
                  <p className={styles.sectionSub}>
                    Preparez ici toutes les questions a embarquer des la creation de l evaluation.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <div className={styles.buttonRow}>
            <button
              className={styles.primaryBtn}
              type="button"
              onClick={() => void handleCreateEvaluation()}
            >
              {submitting === "evaluation" ? "Creation..." : "Creer l evaluation"}
            </button>
          </div>
        </article>

        <article className={styles.card}>
          <h3>Composer une question</h3>
          <div className={styles.formGrid}>
            <select
              className={styles.select}
              value={selectedEvaluation?.id ?? ""}
              onChange={(event) => setSelectedEvaluationId(event.target.value)}
            >
              <option value="">Choisir une evaluation</option>
              {evaluations.map((evaluation) => (
                <option key={evaluation.id} value={evaluation.id}>
                  {evaluation.title}
                </option>
              ))}
            </select>
            <textarea
              className={styles.textarea}
              disabled={!selectedEvaluation}
              placeholder="Libelle de la question"
              value={questionForm.statement}
              onChange={(event) =>
                setQuestionForm((current) => ({
                  ...current,
                  statement: event.target.value,
                }))
              }
            />
            <select
              className={styles.select}
              disabled={!selectedEvaluation}
              value={questionForm.questionType}
              onChange={(event) =>
                setQuestionForm((current) => ({
                  ...current,
                  questionType:
                    event.target.value as CreateWorkspaceEvaluationQuestionPayload["questionType"],
                }))
              }
            >
              {EVALUATION_QUESTION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {(questionForm.questionType === "MULTIPLE_CHOICE" ||
              questionForm.questionType === "MULTIPLE_RESPONSE") ? (
              <>
                <textarea
                  className={styles.textarea}
                  disabled={!selectedEvaluation}
                  placeholder="Options, une par ligne"
                  value={questionOptions}
                  onChange={(event) => setQuestionOptions(event.target.value)}
                />
                <div className={styles.evaluationOptionPreview}>
                  {parsedQuestionOptions.map((option) => (
                    <label
                      key={option}
                      className={styles.evaluationOptionPreviewItem}
                    >
                      <input
                        checked={questionCorrectSelections.includes(option)}
                        onChange={() =>
                          setQuestionCorrectSelections((current) => {
                            if (questionForm.questionType === "MULTIPLE_CHOICE") {
                              return current.includes(option) ? [] : [option];
                            }

                            return current.includes(option)
                              ? current.filter((value) => value !== option)
                              : [...current, option];
                          })
                        }
                        type={
                          questionForm.questionType === "MULTIPLE_CHOICE"
                            ? "radio"
                            : "checkbox"
                        }
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                  {!parsedQuestionOptions.length ? (
                    <p className={styles.sectionSub}>
                      Ajoutez vos options pour choisir ensuite les bonnes reponses.
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}

            {questionForm.questionType === "FILL_BLANK" ? (
              <textarea
                className={styles.textarea}
                disabled={!selectedEvaluation}
                placeholder="Reponses acceptees, une par ligne"
                value={questionAnswerKey}
                onChange={(event) => setQuestionAnswerKey(event.target.value)}
              />
            ) : null}

            {questionForm.questionType === "TEXT" ? (
              <textarea
                className={styles.textarea}
                disabled={!selectedEvaluation}
                placeholder="Reponse exacte attendue"
                value={questionAnswerKey}
                onChange={(event) => setQuestionAnswerKey(event.target.value)}
              />
            ) : null}

            <div className={styles.buttonRow}>
              <input
                className={styles.input}
                disabled={!selectedEvaluation}
                min={1}
                type="number"
                value={questionForm.points}
                onChange={(event) =>
                  setQuestionForm((current) => ({
                    ...current,
                    points: Number(event.target.value) || 1,
                  }))
                }
              />
              <input
                className={styles.input}
                disabled={!selectedEvaluation}
                min={1}
                type="number"
                value={questionForm.position}
                onChange={(event) =>
                  setQuestionForm((current) => ({
                    ...current,
                    position: Number(event.target.value) || 1,
                  }))
                }
              />
            </div>
          </div>
          <div className={styles.buttonRow}>
            <button
              className={styles.ghostBtn}
              disabled={!selectedEvaluation}
              type="button"
              onClick={() => void handleCreateQuestion()}
            >
              {submitting === "question" ? "Ajout..." : "Ajouter la question"}
            </button>
          </div>
        </article>
      </section>

      <section className={`${styles.card} ${styles.sectionSpacing}`}>
        <h3 className={styles.sectionTitleReset}>Pilotage de l evaluation</h3>
        {loading ? (
          <p className={styles.sectionSub}>Chargement des evaluations...</p>
        ) : null}
        {!loading && !selectedEvaluation ? (
          <p className={styles.sectionSub}>Aucune evaluation encore disponible.</p>
        ) : null}
        {selectedEvaluation ? (
          <div className={styles.stackGridMd}>
            <div className={styles.rowWrapBetween}>
              <div>
                <strong>{selectedEvaluation.title}</strong>
                <p className={styles.sectionSub}>
                  {formatEvaluationType(selectedEvaluation.type)} ·{" "}
                  {selectedEvaluation.course?.title ?? "Sans cours"} · ouverture le{" "}
                  {formatWorkspaceDateTime(selectedEvaluation.startsAt)}
                </p>
                <p className={styles.sectionSub}>
                  Les notes de cette evaluation alimentent les grades et la
                  gamification immediatement apres chaque soumission.
                </p>
              </div>
              <div className={styles.buttonRow}>
                <span className={styles.chip}>
                  {selectedEvaluation.isPublished ? "Publiee" : "Brouillon"}
                </span>
                <button
                  className={styles.primaryBtn}
                  type="button"
                  onClick={() => void handleTogglePublished()}
                >
                  {publishingId === selectedEvaluation.id
                    ? "Mise a jour..."
                    : selectedEvaluation.isPublished
                      ? "Passer en brouillon"
                      : "Publier"}
                </button>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Pos.</th>
                    <th>Type</th>
                    <th>Question</th>
                    <th>Bonne reponse</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedQuestions.map((question) => (
                    <tr key={question.id}>
                      <td>{question.position}</td>
                        <td>{formatEvaluationQuestionTypeLabel(question.questionType)}</td>
                        <td>{question.statement}</td>
                        <td>{formatEvaluationCorrectAnswerPreview(question.correctAnswer)}</td>
                      <td>
                        <button
                          className={styles.ghostBtn}
                          type="button"
                          onClick={() => void handleDeleteQuestion(question.id)}
                        >
                          {deletingQuestionId === question.id ? "Suppression..." : "Supprimer"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sortedQuestions.length === 0 ? (
                    <tr>
                      <td colSpan={5}>Aucune question pour cette evaluation.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className={styles.evaluationAttemptList}>
              {attempts.map((attempt) => (
                <article key={attempt.id} className={styles.evaluationAttemptCard}>
                  <div className={styles.rowWrapBetween}>
                    <div>
                      <strong>{attempt.student.fullName}</strong>
                      <p className={styles.sectionSub}>
                        Soumis le {formatWorkspaceDateTime(attempt.submittedAt)}
                      </p>
                    </div>
                    <span className={styles.chip}>
                      {attempt.status}
                      {attempt.score !== null ? ` · ${attempt.score}/${attempt.maxScore}` : ""}
                    </span>
                  </div>

                  <div className={styles.evaluationAnswerList}>
                    {sortedQuestions.map((question) => (
                      <div
                        key={`${attempt.id}-${question.id}`}
                        className={styles.evaluationAnswerRow}
                      >
                        <span>{question.statement}</span>
                        <strong>
                          {formatAttemptAnswer(attempt.answers?.[question.id]) || "Non renseignee"}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <p className={styles.sectionSub}>
                    {attempt.feedback ?? "Resultat calcule automatiquement a la soumission."}
                  </p>
                </article>
              ))}
              {attempts.length === 0 ? (
                <p className={styles.sectionSub}>
                  Aucune tentative soumise pour cette evaluation.
                </p>
              ) : null}
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
