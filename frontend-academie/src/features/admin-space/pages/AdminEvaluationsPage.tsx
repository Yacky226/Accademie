"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createAdminEvaluation,
  createAdminEvaluationQuestion,
  deleteAdminEvaluation,
  deleteAdminEvaluationQuestion,
  fetchAdminCourses,
  fetchAdminEvaluationAttempts,
  fetchAdminEvaluations,
  updateAdminEvaluation,
} from "../admin-space.client";
import type {
  AdminEvaluationAttemptRecord,
  AdminEvaluationRecord,
  AdminWorkspaceCourseRecord,
} from "../admin-space.types";
import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";
import type { CreateWorkspaceEvaluationQuestionPayload } from "@/features/workspace-data/model/workspace-api.types";
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
import {
  formatWorkspaceDateTime,
  slugifyWorkspaceValue,
  toDateTimeLocalInputValue,
} from "@/features/workspace-data/model/workspace-ui.utils";

type EvaluationFormState = {
  title: string;
  slug: string;
  description: string;
  type: "QUIZ" | "EXAM" | "ASSIGNMENT" | "PRACTICE";
  instructions: string;
  durationInMinutes: number;
  maxAttempts: number;
  passScore: number;
  startsAt: string;
  endsAt: string;
  courseId: string;
};

type QuestionFormState = {
  statement: string;
  questionType: "MULTIPLE_CHOICE" | "MULTIPLE_RESPONSE" | "FILL_BLANK" | "TEXT";
  points: number;
  position: number;
};

type EvaluationInventoryFilter = "ALL" | "PUBLISHED" | "DRAFT";

const INITIAL_EVALUATION_FORM: EvaluationFormState = {
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
  courseId: "",
};

const INITIAL_QUESTION_FORM: QuestionFormState = {
  statement: "",
  questionType: "MULTIPLE_CHOICE",
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

function statusClassName(isPublished: boolean) {
  return isPublished ? styles.statusActive : styles.statusPending;
}

function buildEvaluationUpdatePayload(
  evaluation: AdminEvaluationRecord,
  isPublished: boolean,
) {
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
    startsAt: evaluation.startsAt ?? undefined,
    endsAt: evaluation.endsAt ?? undefined,
    isPublished,
    courseId: evaluation.course?.id ?? undefined,
  };
}

export function AdminEvaluationsPage() {
  const [courses, setCourses] = useState<AdminWorkspaceCourseRecord[]>([]);
  const [evaluations, setEvaluations] = useState<AdminEvaluationRecord[]>([]);
  const [attempts, setAttempts] = useState<AdminEvaluationAttemptRecord[]>([]);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState<EvaluationInventoryFilter>("ALL");
  const [evaluationForm, setEvaluationForm] = useState<EvaluationFormState>(
    INITIAL_EVALUATION_FORM,
  );
  const [creationQuestionForm, setCreationQuestionForm] = useState<EvaluationQuestionDraftRecord>(
    createEmptyEvaluationQuestionDraft(1),
  );
  const [creationQuestions, setCreationQuestions] = useState<EvaluationQuestionDraftRecord[]>([]);
  const [editingCreationQuestionId, setEditingCreationQuestionId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionFormState>(INITIAL_QUESTION_FORM);
  const [questionOptions, setQuestionOptions] = useState("");
  const [questionAnswerKey, setQuestionAnswerKey] = useState("");
  const [questionCorrectSelections, setQuestionCorrectSelections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<"evaluation" | "question" | null>(null);
  const [savingEvaluationId, setSavingEvaluationId] = useState<string | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const inventorySectionRef = useRef<HTMLElement | null>(null);

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

  const metrics = useMemo(() => {
    return {
      attempts: evaluations.reduce((sum, evaluation) => sum + evaluation.attemptsCount, 0),
      published: evaluations.filter((evaluation) => evaluation.isPublished).length,
      questions: evaluations.reduce((sum, evaluation) => sum + evaluation.questions.length, 0),
      total: evaluations.length,
    };
  }, [evaluations]);

  const visibleEvaluations = useMemo(() => {
    return evaluations.filter(
      (evaluation) =>
        inventoryFilter === "ALL" ||
        (inventoryFilter === "PUBLISHED" ? evaluation.isPublished : !evaluation.isPublished),
    );
  }, [evaluations, inventoryFilter]);

  useEffect(() => {
    let isActive = true;

    async function loadBaseData() {
      setLoading(true);

      try {
        const [nextCourses, nextEvaluations] = await Promise.all([
          fetchAdminCourses(),
          fetchAdminEvaluations(),
        ]);

        if (!isActive) {
          return;
        }

        setCourses(nextCourses);
        setEvaluations(nextEvaluations);
        setErrorMessage(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger les evaluations.",
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadBaseData();

    return () => {
      isActive = false;
    };
  }, []);

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
    let isActive = true;

    async function loadAttempts() {
      if (!selectedEvaluation) {
        setAttempts([]);
        return;
      }

      try {
        const nextAttempts = await fetchAdminEvaluationAttempts(selectedEvaluation.id);

        if (!isActive) {
          return;
        }

        setAttempts(nextAttempts);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger les tentatives de l evaluation.",
        );
      }
    }

    void loadAttempts();

    return () => {
      isActive = false;
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

  async function refreshBaseData() {
    setLoading(true);

    try {
      const [nextCourses, nextEvaluations] = await Promise.all([
        fetchAdminCourses(),
        fetchAdminEvaluations(),
      ]);

      setCourses(nextCourses);
      setEvaluations(nextEvaluations);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de charger les evaluations.",
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

  async function handleCreateEvaluation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
      const createdEvaluation = await createAdminEvaluation({
        title: evaluationForm.title.trim(),
        slug: slugifyWorkspaceValue(evaluationForm.slug || evaluationForm.title),
        description: evaluationForm.description.trim(),
        type: evaluationForm.type,
        instructions: evaluationForm.instructions.trim(),
        durationInMinutes: evaluationForm.durationInMinutes,
        maxAttempts: evaluationForm.maxAttempts,
        passScore: evaluationForm.passScore,
        startsAt: evaluationForm.startsAt,
        endsAt: evaluationForm.endsAt,
        courseId: evaluationForm.courseId,
        questions: questionPayloads,
      });

      setEvaluationForm(INITIAL_EVALUATION_FORM);
      setCreationQuestions([]);
      setCreationQuestionForm(createEmptyEvaluationQuestionDraft(1));
      setEditingCreationQuestionId(null);
      setSelectedEvaluationId(createdEvaluation.id);
      setQuestionForm(INITIAL_QUESTION_FORM);
      setQuestionOptions("");
      setQuestionAnswerKey("");
      setQuestionCorrectSelections([]);
      setSuccessMessage(
        `L evaluation "${createdEvaluation.title}" et ses questions ont ete creees.`,
      );
      setErrorMessage(null);
      await refreshBaseData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de creer cette evaluation.",
      );
      setSuccessMessage(null);
    } finally {
      setSubmitting(null);
    }
  }

  function buildQuestionPayload() {
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
        setErrorMessage("Ajoutez au moins deux options pour un QCM multiple.");
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
      setErrorMessage("Ajoutez la reponse exacte attendue.");
      return null;
    }

    return {
      ...questionForm,
      options: [],
      correctAnswer: questionAnswerKey.trim(),
    };
  }

  async function handleCreateQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedEvaluation) {
      setErrorMessage("Selectionnez d abord une evaluation.");
      return;
    }

    const payload = buildQuestionPayload();
    if (!payload) {
      return;
    }

    setSubmitting("question");

    try {
      await createAdminEvaluationQuestion(selectedEvaluation.id, payload);
      setQuestionForm({
        ...INITIAL_QUESTION_FORM,
        position: payload.position + 1,
      });
      setQuestionOptions("");
      setQuestionAnswerKey("");
      setQuestionCorrectSelections([]);
      setSuccessMessage("La question a ete ajoutee.");
      setErrorMessage(null);
      await refreshBaseData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible d ajouter cette question.",
      );
      setSuccessMessage(null);
    } finally {
      setSubmitting(null);
    }
  }

  async function handleTogglePublished(evaluation: AdminEvaluationRecord) {
    setSavingEvaluationId(evaluation.id);

    try {
      const updatedEvaluation = await updateAdminEvaluation(
        evaluation.id,
        buildEvaluationUpdatePayload(evaluation, !evaluation.isPublished),
      );

      setEvaluations((current) =>
        current.map((item) => (item.id === evaluation.id ? updatedEvaluation : item)),
      );
      setSuccessMessage(
        updatedEvaluation.isPublished
          ? `${updatedEvaluation.title} est maintenant publiee et diffusee aux inscrits.`
          : `${updatedEvaluation.title} est repassee en brouillon.`,
      );
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de modifier le statut de cette evaluation.",
      );
      setSuccessMessage(null);
    } finally {
      setSavingEvaluationId(null);
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!selectedEvaluation) {
      return;
    }

    setDeletingQuestionId(questionId);

    try {
      await deleteAdminEvaluationQuestion(selectedEvaluation.id, questionId);
      setSuccessMessage("La question a ete supprimee.");
      setErrorMessage(null);
      await refreshBaseData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer cette question.",
      );
      setSuccessMessage(null);
    } finally {
      setDeletingQuestionId(null);
    }
  }

  async function handleDeleteEvaluation(evaluation: AdminEvaluationRecord) {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        `Supprimer definitivement l evaluation "${evaluation.title}" ?`,
      );

      if (!confirmed) {
        return;
      }
    }

    setSavingEvaluationId(evaluation.id);

    try {
      await deleteAdminEvaluation(evaluation.id);
      setEvaluations((current) => current.filter((item) => item.id !== evaluation.id));
      setSuccessMessage(`${evaluation.title} a ete supprimee.`);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer cette evaluation.",
      );
      setSuccessMessage(null);
    } finally {
      setSavingEvaluationId(null);
    }
  }

  function scrollToInventory() {
    inventorySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <AdminShell activePath="/admin/evaluations" title="Evaluations">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>Evaluations & diffusion</h1>
          <p className={styles.heroSub}>
            L admin peut maintenant creer, completer, publier et superviser les QCM,
            examens et leurs resultats depuis le back-office.
          </p>
          {errorMessage ? <p className={`${styles.heroSub} ${styles.messageError}`}>{errorMessage}</p> : null}
          {successMessage ? <p className={`${styles.heroSub} ${styles.messageSuccess}`}>{successMessage}</p> : null}
        </div>
        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.ghostBtn}
            onClick={() => {
              setInventoryFilter("ALL");
              scrollToInventory();
            }}
          >
            {loading ? "Chargement..." : `Voir ${metrics.total} evaluation(s)`}
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => {
              setInventoryFilter("PUBLISHED");
              scrollToInventory();
            }}
          >
            {loading ? "..." : `Voir ${metrics.published} publiee(s)`}
          </button>
        </div>
      </section>

      <section className={styles.grid4}>
        <article className={styles.kpi}>
          <p>Total</p>
          <strong>{loading ? "..." : metrics.total}</strong>
          <span>Toutes les evaluations de la plateforme.</span>
        </article>
        <article className={styles.kpi}>
          <p>Publiees</p>
          <strong>{loading ? "..." : metrics.published}</strong>
          <span>Diffusion automatique aux etudiants inscrits.</span>
        </article>
        <article className={styles.kpi}>
          <p>Questions</p>
          <strong>{loading ? "..." : metrics.questions}</strong>
          <span>Banque de questions configuree.</span>
        </article>
        <article className={styles.kpi}>
          <p>Tentatives</p>
          <strong>{loading ? "..." : metrics.attempts}</strong>
          <span>Soumissions deja corrigees automatiquement.</span>
        </article>
      </section>

      <section className={styles.split}>
        <article className={styles.panel}>
          <header className={styles.panelHead}>
            <h3>Creer une evaluation</h3>
          </header>
          <div className={styles.panelBody}>
            <form className={styles.panelForm} onSubmit={handleCreateEvaluation}>
              <div className={styles.settingsFieldGrid}>
                <label className={styles.settingsField}>
                  <span>Titre</span>
                  <input
                    className={styles.settingsInput}
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
                </label>
                <label className={styles.settingsField}>
                  <span>Slug</span>
                  <input
                    className={styles.settingsInput}
                    value={evaluationForm.slug}
                    onChange={(event) =>
                      setEvaluationForm((current) => ({
                        ...current,
                        slug: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className={styles.settingsField}>
                  <span>Cours associe</span>
                  <select
                    className={styles.settingsInput}
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
                </label>
                <label className={styles.settingsField}>
                  <span>Type</span>
                  <select
                    className={styles.settingsInput}
                    value={evaluationForm.type}
                    onChange={(event) =>
                      setEvaluationForm((current) => ({
                        ...current,
                        type: event.target.value as EvaluationFormState["type"],
                      }))
                    }
                  >
                    <option value="QUIZ">QCM</option>
                    <option value="EXAM">Examen</option>
                    <option value="ASSIGNMENT">Devoir</option>
                    <option value="PRACTICE">Pratique</option>
                  </select>
                </label>
                <label className={styles.settingsField}>
                  <span>Duree (minutes)</span>
                  <input
                    className={styles.settingsInput}
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
                </label>
                <label className={styles.settingsField}>
                  <span>Nombre de tentatives</span>
                  <input
                    className={styles.settingsInput}
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
                </label>
                <label className={styles.settingsField}>
                  <span>Score de validation</span>
                  <input
                    className={styles.settingsInput}
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
                </label>
                <label className={styles.settingsField}>
                  <span>Debut</span>
                  <input
                    className={styles.settingsInput}
                    type="datetime-local"
                    value={toDateTimeLocalInputValue(evaluationForm.startsAt)}
                    onChange={(event) =>
                      setEvaluationForm((current) => ({
                        ...current,
                        startsAt: new Date(event.target.value).toISOString(),
                      }))
                    }
                  />
                </label>
                <label className={styles.settingsField}>
                  <span>Fin</span>
                  <input
                    className={styles.settingsInput}
                    type="datetime-local"
                    value={toDateTimeLocalInputValue(evaluationForm.endsAt, 24)}
                    onChange={(event) =>
                      setEvaluationForm((current) => ({
                        ...current,
                        endsAt: new Date(event.target.value).toISOString(),
                      }))
                    }
                  />
                </label>
              </div>

              <label className={styles.settingsField}>
                <span>Description</span>
                <input
                  className={styles.settingsInput}
                  value={evaluationForm.description}
                  onChange={(event) =>
                    setEvaluationForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>

              <label className={styles.settingsField}>
                <span>Instructions</span>
                <textarea
                  className={styles.settingsTextarea}
                  value={evaluationForm.instructions}
                  onChange={(event) =>
                    setEvaluationForm((current) => ({
                      ...current,
                      instructions: event.target.value,
                    }))
                  }
                />
              </label>

              <p className={styles.settingsFieldHint}>
                L evaluation est preparee en une seule fois avec toutes ses questions, puis
                publiee quand vous etes satisfait du contenu.
              </p>

              <div className={styles.authoringQuestionPanel}>
                <div className={styles.authoringQuestionHeader}>
                  <strong>Questions incluses a la creation</strong>
                  <span className={styles.badge}>{creationQuestions.length} prete(s)</span>
                </div>

                <label className={styles.settingsField}>
                  <span>Libelle de la question</span>
                  <textarea
                    className={styles.settingsTextarea}
                    value={creationQuestionForm.statement}
                    onChange={(event) =>
                      setCreationQuestionForm((current) => ({
                        ...current,
                        statement: event.target.value,
                      }))
                    }
                  />
                </label>

                <div className={styles.settingsFieldGrid}>
                  <label className={styles.settingsField}>
                    <span>Type</span>
                    <select
                      className={styles.settingsInput}
                      value={creationQuestionForm.questionType}
                      onChange={(event) =>
                        setCreationQuestionForm((current) => ({
                          ...current,
                          questionType:
                            event.target.value as EvaluationQuestionDraftRecord["questionType"],
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
                  </label>
                  <label className={styles.settingsField}>
                    <span>Points</span>
                    <input
                      className={styles.settingsInput}
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
                  </label>
                  <label className={styles.settingsField}>
                    <span>Position</span>
                    <input
                      className={styles.settingsInput}
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
                  </label>
                </div>

                {(creationQuestionForm.questionType === "MULTIPLE_CHOICE" ||
                  creationQuestionForm.questionType === "MULTIPLE_RESPONSE") ? (
                  <>
                    <label className={styles.settingsField}>
                      <span>Options (une par ligne)</span>
                      <textarea
                        className={styles.settingsTextarea}
                        value={creationQuestionForm.optionText}
                        onChange={(event) =>
                          setCreationQuestionForm((current) => ({
                            ...current,
                            optionText: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <div className={styles.integrationList}>
                      {parseEvaluationAuthoringLines(creationQuestionForm.optionText).map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={styles.integrationRow}
                          onClick={() =>
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
                        >
                          <div>
                            <strong>{option}</strong>
                            <p>
                              {creationQuestionForm.correctSelections.includes(option)
                                ? "Bonne reponse selectionnee"
                                : "Cliquer pour definir la bonne reponse"}
                            </p>
                          </div>
                          <span
                            className={`${styles.adminToggle} ${
                              creationQuestionForm.correctSelections.includes(option)
                                ? styles.adminToggleOn
                                : ""
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}

                {creationQuestionForm.questionType === "FILL_BLANK" ? (
                  <label className={styles.settingsField}>
                    <span>Reponses acceptees (une par ligne)</span>
                    <textarea
                      className={styles.settingsTextarea}
                      value={creationQuestionForm.answerText}
                      onChange={(event) =>
                        setCreationQuestionForm((current) => ({
                          ...current,
                          answerText: event.target.value,
                        }))
                      }
                    />
                  </label>
                ) : null}

                {creationQuestionForm.questionType === "TEXT" ? (
                  <label className={styles.settingsField}>
                    <span>Reponse exacte attendue</span>
                    <textarea
                      className={styles.settingsTextarea}
                      value={creationQuestionForm.answerText}
                      onChange={(event) =>
                        setCreationQuestionForm((current) => ({
                          ...current,
                          answerText: event.target.value,
                        }))
                      }
                    />
                  </label>
                ) : null}

                <div className={styles.actionRow}>
                  <button
                    type="button"
                    className={styles.ghostBtn}
                    onClick={handleQueueCreationQuestion}
                  >
                    {editingCreationQuestionId
                      ? "Mettre a jour la question"
                      : "Ajouter au brouillon"}
                  </button>
                  <button
                    type="button"
                    className={styles.ghostBtn}
                    onClick={resetCreationQuestionComposer}
                  >
                    Reinitialiser
                  </button>
                </div>

                <div className={styles.authoringQuestionList}>
                  {creationQuestions.map((question) => {
                    const result = buildEvaluationQuestionPayloadFromDraft(question);
                    const preview = result.payload
                      ? formatEvaluationCorrectAnswerPreview(result.payload.correctAnswer)
                      : result.errorMessage ?? "Configuration incomplete";

                    return (
                      <div key={question.id} className={styles.authoringQuestionCard}>
                        <div className={styles.authoringQuestionMeta}>
                          <div>
                            <strong>
                              Q{question.position}.{" "}
                              {formatEvaluationQuestionTypeLabel(question.questionType)}
                            </strong>
                            <p className={styles.tableMeta}>{question.statement}</p>
                          </div>
                          <span className={styles.badge}>{question.points} pt(s)</span>
                        </div>
                        <p className={styles.authoringAnswerPreview}>Bonne reponse: {preview}</p>
                        <div className={styles.actionRow}>
                          <button
                            type="button"
                            className={styles.ghostBtn}
                            onClick={() => handleEditCreationQuestion(question.id)}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            className={styles.ghostBtn}
                            onClick={() => handleRemoveCreationQuestion(question.id)}
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {!creationQuestions.length ? (
                    <p className={styles.settingsFieldHint}>
                      Ajoutez ici toutes les questions a embarquer des la creation de
                      l evaluation.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className={styles.actionRow}>
                <button type="submit" className={styles.primaryBtn} disabled={submitting === "evaluation"}>
                  {submitting === "evaluation" ? "Creation..." : "Creer l evaluation"}
                </button>
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={() => {
                    setEvaluationForm(INITIAL_EVALUATION_FORM);
                    setCreationQuestions([]);
                    resetCreationQuestionComposer();
                  }}
                  disabled={submitting === "evaluation"}
                >
                  Reinitialiser
                </button>
              </div>
            </form>
          </div>
        </article>

        <article className={styles.panel}>
          <header className={styles.panelHead}>
            <h3>Composer une question</h3>
          </header>
          <div className={styles.panelBody}>
            <form className={styles.panelForm} onSubmit={handleCreateQuestion}>
              <label className={styles.settingsField}>
                <span>Evaluation</span>
                <select
                  className={styles.settingsInput}
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
              </label>

              <label className={styles.settingsField}>
                <span>Question</span>
                <textarea
                  className={styles.settingsTextarea}
                  disabled={!selectedEvaluation}
                  value={questionForm.statement}
                  onChange={(event) =>
                    setQuestionForm((current) => ({
                      ...current,
                      statement: event.target.value,
                    }))
                  }
                />
              </label>

              <div className={styles.settingsFieldGrid}>
                <label className={styles.settingsField}>
                  <span>Type</span>
                  <select
                    className={styles.settingsInput}
                    disabled={!selectedEvaluation}
                    value={questionForm.questionType}
                    onChange={(event) =>
                      setQuestionForm((current) => ({
                        ...current,
                        questionType: event.target.value as QuestionFormState["questionType"],
                      }))
                    }
                  >
                    {EVALUATION_QUESTION_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.settingsField}>
                  <span>Points</span>
                  <input
                    className={styles.settingsInput}
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
                </label>
                <label className={styles.settingsField}>
                  <span>Position</span>
                  <input
                    className={styles.settingsInput}
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
                </label>
              </div>

              {(questionForm.questionType === "MULTIPLE_CHOICE" ||
                questionForm.questionType === "MULTIPLE_RESPONSE") ? (
                <>
                  <label className={styles.settingsField}>
                    <span>Options (une par ligne)</span>
                    <textarea
                      className={styles.settingsTextarea}
                      disabled={!selectedEvaluation}
                      value={questionOptions}
                      onChange={(event) => setQuestionOptions(event.target.value)}
                    />
                  </label>
                  <div className={styles.integrationList}>
                    {parsedQuestionOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={styles.integrationRow}
                        onClick={() =>
                          setQuestionCorrectSelections((current) => {
                            if (questionForm.questionType === "MULTIPLE_CHOICE") {
                              return current.includes(option) ? [] : [option];
                            }

                            return current.includes(option)
                              ? current.filter((value) => value !== option)
                              : [...current, option];
                          })
                        }
                      >
                        <div>
                          <strong>{option}</strong>
                          <p>
                            {questionCorrectSelections.includes(option)
                              ? "Bonne reponse selectionnee"
                              : "Cliquer pour definir la bonne reponse"}
                          </p>
                        </div>
                        <span
                          className={`${styles.adminToggle} ${
                            questionCorrectSelections.includes(option) ? styles.adminToggleOn : ""
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {questionForm.questionType === "FILL_BLANK" ? (
                <label className={styles.settingsField}>
                  <span>Reponses acceptees (une par ligne)</span>
                  <textarea
                    className={styles.settingsTextarea}
                    disabled={!selectedEvaluation}
                    value={questionAnswerKey}
                    onChange={(event) => setQuestionAnswerKey(event.target.value)}
                  />
                </label>
              ) : null}

              {questionForm.questionType === "TEXT" ? (
                <label className={styles.settingsField}>
                  <span>Reponse exacte attendue</span>
                  <textarea
                    className={styles.settingsTextarea}
                    disabled={!selectedEvaluation}
                    value={questionAnswerKey}
                    onChange={(event) => setQuestionAnswerKey(event.target.value)}
                  />
                </label>
              ) : null}

              <div className={styles.actionRow}>
                <button type="submit" className={styles.primaryBtn} disabled={!selectedEvaluation || submitting === "question"}>
                  {submitting === "question" ? "Ajout..." : "Ajouter la question"}
                </button>
              </div>
            </form>
          </div>
        </article>
      </section>

      <section ref={inventorySectionRef} className={styles.panel}>
        <header className={styles.panelHead}>
          <h3>Inventaire des evaluations</h3>
          <select
            className={styles.settingsInput}
            value={inventoryFilter}
            onChange={(event) =>
              setInventoryFilter(event.target.value as EvaluationInventoryFilter)
            }
          >
            <option value="ALL">Toutes</option>
            <option value="PUBLISHED">Publiees</option>
            <option value="DRAFT">Brouillons</option>
          </select>
        </header>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Evaluation</th>
                <th>Type</th>
                <th>Cours</th>
                <th>Questions</th>
                <th>Tentatives</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleEvaluations.map((evaluation) => (
                <tr key={evaluation.id}>
                  <td>
                    <strong>{evaluation.title}</strong>
                    <p className={styles.tableMeta}>
                      {evaluation.creatorName} - {formatWorkspaceDateTime(evaluation.startsAt)}
                    </p>
                  </td>
                  <td>{formatEvaluationType(evaluation.type)}</td>
                  <td>{evaluation.course?.title ?? "Sans cours"}</td>
                  <td>{evaluation.questions.length}</td>
                  <td>{evaluation.attemptsCount}</td>
                  <td>
                    <span className={`${styles.badge} ${statusClassName(evaluation.isPublished)}`}>
                      {evaluation.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.tableActions}>
                      <button
                        type="button"
                        className={styles.ghostBtn}
                        disabled={savingEvaluationId === evaluation.id}
                        onClick={() => setSelectedEvaluationId(evaluation.id)}
                      >
                        Ouvrir
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        disabled={savingEvaluationId === evaluation.id}
                        onClick={() => void handleTogglePublished(evaluation)}
                      >
                        {evaluation.isPublished ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        disabled={savingEvaluationId === evaluation.id}
                        onClick={() => void handleDeleteEvaluation(evaluation)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && visibleEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={7}>Aucune evaluation ne correspond au filtre selectionne.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h3>Pilotage de l evaluation selectionnee</h3>
        </header>
        <div className={styles.panelBody}>
          {!selectedEvaluation ? (
            <p className={styles.heroSub}>Selectionnez une evaluation pour voir son detail.</p>
          ) : (
            <>
              <div className={styles.heroRow}>
                <div>
                  <h3>{selectedEvaluation.title}</h3>
                  <p className={styles.heroSub}>
                    {formatEvaluationType(selectedEvaluation.type)} -{" "}
                    {selectedEvaluation.course?.title ?? "Sans cours"} - ouverture le{" "}
                    {formatWorkspaceDateTime(selectedEvaluation.startsAt)}
                  </p>
                  <p className={styles.heroSub}>
                    La publication d un QCM ou examen declenche maintenant une notification
                    automatique vers tous les etudiants inscrits a la formation associee.
                  </p>
                </div>
                <div className={styles.actionRow}>
                  <span className={`${styles.badge} ${statusClassName(selectedEvaluation.isPublished)}`}>
                    {selectedEvaluation.isPublished ? "Published" : "Draft"}
                  </span>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    disabled={savingEvaluationId === selectedEvaluation.id}
                    onClick={() => void handleTogglePublished(selectedEvaluation)}
                  >
                    {savingEvaluationId === selectedEvaluation.id
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
                            type="button"
                            className={styles.ghostBtn}
                            disabled={deletingQuestionId === question.id}
                            onClick={() => void handleDeleteQuestion(question.id)}
                          >
                            {deletingQuestionId === question.id ? "Suppression..." : "Supprimer"}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {sortedQuestions.length === 0 ? (
                      <tr>
                        <td colSpan={5}>Aucune question configuree pour cette evaluation.</td>
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
                      <th>Soumise le</th>
                      <th>Score</th>
                      <th>Feedback</th>
                      <th>Resume des reponses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((attempt) => (
                      <tr key={attempt.id}>
                        <td>
                          <strong>{attempt.student.fullName}</strong>
                          <p className={styles.tableMeta}>{attempt.student.email}</p>
                        </td>
                        <td>{formatWorkspaceDateTime(attempt.submittedAt)}</td>
                        <td>
                          {attempt.score !== null
                            ? `${attempt.score}/${attempt.maxScore}`
                            : `-/${attempt.maxScore}`}
                        </td>
                        <td>{attempt.feedback ?? "Correction automatique instantanee."}</td>
                        <td>
                          <p className={styles.tableMeta}>
                            {sortedQuestions
                              .map((question) => {
                                const answer =
                                  formatAttemptAnswer(attempt.answers?.[question.id]) || "NR";
                                return `${question.position}. ${answer}`;
                              })
                              .join(" | ")}
                          </p>
                        </td>
                      </tr>
                    ))}
                    {attempts.length === 0 ? (
                      <tr>
                        <td colSpan={5}>Aucune tentative soumise pour cette evaluation.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
