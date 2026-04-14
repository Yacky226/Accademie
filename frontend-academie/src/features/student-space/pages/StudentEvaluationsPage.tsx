"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  useRouter,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";
import {
  fetchWorkspaceEvaluations,
  fetchWorkspaceMyEvaluationAttempts,
  submitWorkspaceEvaluationAttempt,
} from "@/features/workspace-data/api/workspace-api.client";
import type {
  CreateWorkspaceEvaluationPayload,
  WorkspaceEvaluationAttemptRecord,
  WorkspaceEvaluationQuestionRecord,
  WorkspaceEvaluationRecord,
} from "@/features/workspace-data/model/workspace-api.types";
import { formatWorkspaceDateTime } from "@/features/workspace-data/model/workspace-ui.utils";
import { StudentShell } from "../components/StudentShell";
import styles from "../student-space.module.css";

const EVALUATIONS_PER_PAGE = 6;

type EvaluationTypeFilter = "all" | CreateWorkspaceEvaluationPayload["type"];

const evaluationFilters: Array<{
  id: EvaluationTypeFilter;
  label: string;
}> = [
  { id: "all", label: "Tous" },
  { id: "QUIZ", label: "QCM" },
  { id: "EXAM", label: "Examens" },
  { id: "ASSIGNMENT", label: "Devoirs" },
  { id: "PRACTICE", label: "Pratiques" },
];

function parseEvaluationFilter(value: string | null): EvaluationTypeFilter {
  if (
    value === "QUIZ" ||
    value === "EXAM" ||
    value === "ASSIGNMENT" ||
    value === "PRACTICE"
  ) {
    return value;
  }

  return "all";
}

function parsePageNumber(value: string | null) {
  const parsedValue = Number.parseInt(value ?? "1", 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return 1;
  }

  return parsedValue;
}

function buildPaginationItems(totalPages: number, currentPage: number) {
  if (totalPages <= 1) {
    return [1];
  }

  const pages = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);
  const orderedPages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
  const paginationItems: Array<number | string> = [];

  orderedPages.forEach((page, index) => {
    const previousPage = orderedPages[index - 1];

    if (previousPage && page - previousPage > 1) {
      paginationItems.push(`dots-${previousPage}-${page}`);
    }

    paginationItems.push(page);
  });

  return paginationItems;
}

function buildEvaluationsHref(
  searchParams: ReadonlyURLSearchParams,
  updates: Record<string, string | null | undefined>,
) {
  const nextSearchParams = new URLSearchParams(searchParams.toString());

  Object.entries(updates).forEach(([key, value]) => {
    if (!value) {
      nextSearchParams.delete(key);
      return;
    }

    nextSearchParams.set(key, value);
  });

  const nextQuery = nextSearchParams.toString();
  return nextQuery
    ? `/student/evaluations?${nextQuery}`
    : "/student/evaluations";
}

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

function formatQuestionType(questionType: string) {
  if (questionType === "MULTIPLE_CHOICE") {
    return "Une reponse";
  }

  if (questionType === "MULTIPLE_RESPONSE") {
    return "Plusieurs reponses";
  }

  if (questionType === "FILL_BLANK") {
    return "Completer";
  }

  return "Texte libre";
}

function formatAttemptScore(attempt: WorkspaceEvaluationAttemptRecord) {
  if (attempt.score === null) {
    return attempt.status === "GRADED"
      ? `0 / ${attempt.maxScore}`
      : "En attente de correction";
  }

  return `${attempt.score} / ${attempt.maxScore}`;
}

function formatAttemptStatus(attempt: WorkspaceEvaluationAttemptRecord) {
  if (attempt.status === "GRADED") {
    return attempt.score !== null ? `Corrigee: ${formatAttemptScore(attempt)}` : "Corrigee";
  }

  if (attempt.status === "SUBMITTED") {
    return "Soumise";
  }

  return attempt.status;
}

function formatAnswerPreview(answer: unknown) {
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

function getDefaultAnswerForQuestion(question: WorkspaceEvaluationQuestionRecord) {
  return question.questionType === "MULTIPLE_RESPONSE" ? [] : "";
}

function normalizeAnswerForSubmission(
  question: WorkspaceEvaluationQuestionRecord,
  answer: unknown,
) {
  if (question.questionType === "MULTIPLE_RESPONSE") {
    if (!Array.isArray(answer)) {
      return [];
    }

    return answer
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (typeof answer === "string") {
    return answer.trim();
  }

  return "";
}

function isAnswerMissing(answer: unknown) {
  if (Array.isArray(answer)) {
    return answer.length === 0;
  }

  if (typeof answer === "string") {
    return answer.trim().length === 0;
  }

  return true;
}

function getEvaluationAvailability(
  evaluation: WorkspaceEvaluationRecord,
  attemptsUsed: number,
) {
  const now = Date.now();
  const startsAt = evaluation.startsAt ? new Date(evaluation.startsAt).getTime() : null;
  const endsAt = evaluation.endsAt ? new Date(evaluation.endsAt).getTime() : null;

  if (!evaluation.questions.length) {
    return {
      canSolve: false,
      note: "Aucune question n est encore publiee.",
    };
  }

  if (startsAt && startsAt > now) {
    return {
      canSolve: false,
      note: `Ouverture le ${formatWorkspaceDateTime(evaluation.startsAt)}`,
    };
  }

  if (endsAt && endsAt < now) {
    return {
      canSolve: false,
      note: "La fenetre de soumission est fermee.",
    };
  }

  if (attemptsUsed >= evaluation.maxAttempts) {
    return {
      canSolve: false,
      note: "Toutes vos tentatives ont deja ete utilisees.",
    };
  }

  return {
    canSolve: true,
    note: `${evaluation.maxAttempts - attemptsUsed} tentative(s) restante(s)`,
  };
}

function EvaluationLibraryLoadingState() {
  return (
    <section className={styles.problemLibraryListPanel}>
      <div className={styles.problemLibraryListHeader}>
        <span className={styles.problemLibraryListHeaderCell}>Titre</span>
        <span
          className={`${styles.problemLibraryListHeaderCell} ${styles.problemLibraryListHeaderCellCentered}`}
        >
          Categorie
        </span>
        <span
          className={`${styles.problemLibraryListHeaderCell} ${styles.problemLibraryListHeaderCellCentered}`}
        >
          Questions
        </span>
        <span
          className={`${styles.problemLibraryListHeaderCell} ${styles.problemLibraryListHeaderCellEnd}`}
        >
          Action
        </span>
      </div>
    </section>
  );
}

export function StudentEvaluationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRouting, startRouting] = useTransition();
  const [evaluations, setEvaluations] = useState<WorkspaceEvaluationRecord[]>([]);
  const [attempts, setAttempts] = useState<WorkspaceEvaluationAttemptRecord[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [status, setStatus] = useState<"loading" | "succeeded" | "failed">("loading");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedEvaluationSlug = searchParams.get("evaluation")?.trim() || null;
  const activeFilter = parseEvaluationFilter(searchParams.get("type"));
  const requestedPage = parsePageNumber(searchParams.get("page"));

  useEffect(() => {
    let isMounted = true;

    async function loadEvaluationsWorkspace() {
      try {
        setStatus("loading");
        const [nextEvaluations, nextAttempts] = await Promise.all([
          fetchWorkspaceEvaluations(),
          fetchWorkspaceMyEvaluationAttempts(),
        ]);

        if (!isMounted) {
          return;
        }

        setEvaluations(nextEvaluations);
        setAttempts(nextAttempts);
        setErrorMessage(null);
        setStatus("succeeded");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setEvaluations([]);
        setAttempts([]);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger les evaluations.",
        );
        setStatus("failed");
      }
    }

    void loadEvaluationsWorkspace();

    return () => {
      isMounted = false;
    };
  }, []);

  const attemptsByEvaluation = useMemo(() => {
    return attempts.reduce<Record<string, WorkspaceEvaluationAttemptRecord[]>>(
      (groups, attempt) => {
        if (!groups[attempt.evaluation.id]) {
          groups[attempt.evaluation.id] = [];
        }

        groups[attempt.evaluation.id].push(attempt);
        return groups;
      },
      {},
    );
  }, [attempts]);

  const filterCounts = useMemo(() => {
    return evaluations.reduce<
      Record<CreateWorkspaceEvaluationPayload["type"], number>
    >(
      (counts, evaluation) => {
        if (
          evaluation.type === "QUIZ" ||
          evaluation.type === "EXAM" ||
          evaluation.type === "ASSIGNMENT" ||
          evaluation.type === "PRACTICE"
        ) {
          counts[evaluation.type] += 1;
        }

        return counts;
      },
      {
        QUIZ: 0,
        EXAM: 0,
        ASSIGNMENT: 0,
        PRACTICE: 0,
      },
    );
  }, [evaluations]);

  const filteredEvaluations = useMemo(() => {
    if (activeFilter === "all") {
      return evaluations;
    }

    return evaluations.filter((evaluation) => evaluation.type === activeFilter);
  }, [activeFilter, evaluations]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEvaluations.length / EVALUATIONS_PER_PAGE),
  );
  const currentPage = Math.min(requestedPage, totalPages);
  const paginatedEvaluations = filteredEvaluations.slice(
    (currentPage - 1) * EVALUATIONS_PER_PAGE,
    currentPage * EVALUATIONS_PER_PAGE,
  );
  const paginationItems = buildPaginationItems(totalPages, currentPage);

  const selectedEvaluation = useMemo(
    () =>
      evaluations.find(
        (evaluation) =>
          evaluation.slug === selectedEvaluationSlug ||
          evaluation.id === selectedEvaluationSlug,
      ) ?? null,
    [evaluations, selectedEvaluationSlug],
  );

  const selectedQuestions = useMemo(
    () =>
      [...(selectedEvaluation?.questions ?? [])].sort(
        (left, right) => left.position - right.position,
      ),
    [selectedEvaluation?.questions],
  );

  const selectedAttempts = useMemo(() => {
    if (!selectedEvaluation) {
      return [];
    }

    return [...(attemptsByEvaluation[selectedEvaluation.id] ?? [])].sort(
      (left, right) =>
        new Date(right.submittedAt ?? right.createdAt ?? 0).getTime() -
        new Date(left.submittedAt ?? left.createdAt ?? 0).getTime(),
    );
  }, [attemptsByEvaluation, selectedEvaluation]);

  const latestAttempt = selectedAttempts[0] ?? null;
  const attemptsUsed = selectedEvaluation ? selectedAttempts.length : 0;
  const attemptsRemaining = selectedEvaluation
    ? Math.max(0, selectedEvaluation.maxAttempts - attemptsUsed)
    : 0;

  useEffect(() => {
    if (!selectedEvaluation) {
      setAnswers({});
      return;
    }

    setAnswers((current) =>
      selectedQuestions.reduce<Record<string, unknown>>((nextAnswers, question) => {
        const currentValue = current[question.id];

        if (question.questionType === "MULTIPLE_RESPONSE") {
          nextAnswers[question.id] = Array.isArray(currentValue) ? currentValue : [];
          return nextAnswers;
        }

        nextAnswers[question.id] = typeof currentValue === "string" ? currentValue : "";
        return nextAnswers;
      }, {}),
    );
    setSuccessMessage(null);
  }, [selectedEvaluation, selectedQuestions]);

  function navigateToEvaluations(
    updates: Record<string, string | null | undefined>,
    mode: "push" | "replace" = "replace",
  ) {
    const nextHref = buildEvaluationsHref(searchParams, updates);

    startRouting(() => {
      if (mode === "push") {
        router.push(nextHref);
        return;
      }

      router.replace(nextHref);
    });
  }

  async function refreshAttempts() {
    const nextAttempts = await fetchWorkspaceMyEvaluationAttempts();
    setAttempts(nextAttempts);
  }

  async function handleSubmitEvaluation() {
    if (!selectedEvaluation) {
      return;
    }

    if (attemptsRemaining <= 0) {
      setErrorMessage("Vous avez deja utilise toutes vos tentatives pour cette evaluation.");
      return;
    }

    const normalizedAnswers = selectedQuestions.reduce<Record<string, unknown>>(
      (payload, question) => {
        payload[question.id] = normalizeAnswerForSubmission(
          question,
          answers[question.id],
        );
        return payload;
      },
      {},
    );
    const missingQuestion = selectedQuestions.find((question) =>
      isAnswerMissing(normalizedAnswers[question.id]),
    );

    if (missingQuestion) {
      setErrorMessage("Toutes les questions doivent etre renseignees avant la soumission.");
      return;
    }

    setSubmitting(true);

    try {
      const attempt = await submitWorkspaceEvaluationAttempt(selectedEvaluation.id, {
        answers: normalizedAnswers,
      });

      await refreshAttempts();
      setErrorMessage(null);
      setSuccessMessage(
        `Soumission envoyee. Resultat instantane: ${formatAttemptScore(attempt)}.`,
      );
      setAnswers(
        selectedQuestions.reduce<Record<string, unknown>>((nextAnswers, question) => {
          nextAnswers[question.id] = getDefaultAnswerForQuestion(question);
          return nextAnswers;
        }, {}),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de soumettre cette evaluation.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleSingleAnswerChange(questionId: string, value: string) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  }

  function handleMultipleAnswerToggle(questionId: string, option: string) {
    setAnswers((current) => {
      const currentAnswers = Array.isArray(current[questionId])
        ? current[questionId].filter(
            (value): value is string => typeof value === "string",
          )
        : [];
      const nextAnswers = currentAnswers.includes(option)
        ? currentAnswers.filter((value) => value !== option)
        : [...currentAnswers, option];

      return {
        ...current,
        [questionId]: nextAnswers,
      };
    });
  }

  if (selectedEvaluationSlug) {
    const backToLibraryHref = buildEvaluationsHref(searchParams, {
      evaluation: null,
      page: String(currentPage),
    });

    return (
      <StudentShell
        activePath="/student/evaluations"
        topbarTitle={selectedEvaluation?.title ?? "Evaluations"}
        widePage
      >
        <div className={styles.evaluationRunnerShell}>
          {status === "loading" ? (
            <section className={`${styles.card} ${styles.stackGridSm}`}>
              <h2 className={styles.heroTitle}>Chargement de l evaluation...</h2>
              <p className={styles.heroSub}>
                Nous recuperons les questions et votre historique de tentatives.
              </p>
            </section>
          ) : null}

          {status === "failed" ? (
            <section className={`${styles.card} ${styles.stackGridSm}`}>
              <h2 className={styles.heroTitle}>Impossible d ouvrir cette evaluation</h2>
              <p className={`${styles.heroSub} ${styles.messageError}`}>{errorMessage}</p>
              <div className={`${styles.actionRow} ${styles.actionRowSpaced}`}>
                <button
                  className={styles.ghostBtn}
                  onClick={() => navigateToEvaluations({ evaluation: null }, "push")}
                  type="button"
                >
                  Retour a la liste
                </button>
              </div>
            </section>
          ) : null}

          {status === "succeeded" && !selectedEvaluation ? (
            <section className={`${styles.card} ${styles.stackGridSm}`}>
              <h2 className={styles.heroTitle}>Evaluation introuvable</h2>
              <p className={styles.heroSub}>
                Cette evaluation n est plus disponible ou n est pas encore publiee.
              </p>
              <div className={`${styles.actionRow} ${styles.actionRowSpaced}`}>
                <button
                  className={styles.ghostBtn}
                  onClick={() => navigateToEvaluations({ evaluation: null }, "push")}
                  type="button"
                >
                  Retour a la liste
                </button>
              </div>
            </section>
          ) : null}

          {status === "succeeded" && selectedEvaluation ? (
            <>
              <section className={`${styles.card} ${styles.evaluationRunnerHero}`}>
                <div className={styles.evaluationRunnerHeader}>
                  <div className={styles.evaluationRunnerHeaderCopy}>
                    <span className={styles.problemLibraryEyebrow}>
                      {formatEvaluationType(selectedEvaluation.type)}
                    </span>
                    <h1>{selectedEvaluation.title}</h1>
                    <p>
                      {selectedEvaluation.instructions ||
                        selectedEvaluation.description ||
                        "Repondez a chaque question puis soumettez votre tentative."}
                    </p>
                  </div>

                  <div className={styles.evaluationRunnerMeta}>
                    <article className={styles.evaluationRunnerMetaCard}>
                      <span>Questions</span>
                      <strong>{selectedQuestions.length}</strong>
                      <small>Dans cette evaluation</small>
                    </article>
                    <article className={styles.evaluationRunnerMetaCard}>
                      <span>Tentatives</span>
                      <strong>{attemptsRemaining}</strong>
                      <small>Restantes sur {selectedEvaluation.maxAttempts}</small>
                    </article>
                    <article className={styles.evaluationRunnerMetaCard}>
                      <span>Score cible</span>
                      <strong>{selectedEvaluation.passScore}%</strong>
                      <small>Pour valider l evaluation</small>
                    </article>
                  </div>
                </div>

                <div className={styles.evaluationRunnerInfoRow}>
                  {selectedEvaluation.course ? (
                    <span className={styles.problemLibraryCategoryBadge}>
                      {selectedEvaluation.course.title}
                    </span>
                  ) : null}
                  {selectedEvaluation.durationInMinutes ? (
                    <span className={styles.evaluationInlineMeta}>
                      Duree conseillee: {selectedEvaluation.durationInMinutes} min
                    </span>
                  ) : null}
                  {selectedEvaluation.endsAt ? (
                    <span className={styles.evaluationInlineMeta}>
                      Cloture: {formatWorkspaceDateTime(selectedEvaluation.endsAt)}
                    </span>
                  ) : null}
                </div>
              </section>

              {errorMessage ? (
                <p className={`${styles.heroSub} ${styles.messageError}`}>{errorMessage}</p>
              ) : null}
              {successMessage ? (
                <p className={`${styles.heroSub} ${styles.messageSuccess}`}>{successMessage}</p>
              ) : null}

              <div className={styles.evaluationRunnerLayout}>
                <section className={`${styles.card} ${styles.evaluationRunnerMain}`}>
                  <div className={styles.evaluationSectionHeader}>
                    <div>
                      <h2>Questions</h2>
                      <p>
                        Chaque reponse compte pour votre note et alimente ensuite la gamification.
                      </p>
                    </div>
                    <div className={styles.actionRow}>
                      <button
                        className={styles.ghostBtn}
                        onClick={() => router.push(backToLibraryHref)}
                        type="button"
                      >
                        Retour a la liste
                      </button>
                      <button
                        className={styles.primaryBtn}
                        disabled={
                          submitting ||
                          attemptsRemaining <= 0 ||
                          selectedQuestions.length === 0
                        }
                        onClick={() => void handleSubmitEvaluation()}
                        type="button"
                      >
                        {submitting ? "Soumission..." : "Submit"}
                      </button>
                    </div>
                  </div>

                  {attemptsRemaining <= 0 ? (
                    <p className={`${styles.heroSub} ${styles.messageError}`}>
                      Vous ne pouvez plus soumettre cette evaluation depuis ce compte.
                    </p>
                  ) : null}

                  <div className={styles.evaluationQuestionList}>
                    {selectedQuestions.map((question, index) => (
                      <article key={question.id} className={styles.evaluationQuestionCard}>
                        <div className={styles.evaluationQuestionHeader}>
                          <div>
                            <span className={styles.problemLibraryEyebrow}>
                              Question {index + 1}
                            </span>
                            <h3>{question.statement}</h3>
                          </div>
                          <div className={styles.evaluationQuestionMeta}>
                            <span>{formatQuestionType(question.questionType)}</span>
                            <strong>{question.points} pt(s)</strong>
                          </div>
                        </div>

                        {question.questionType === "MULTIPLE_CHOICE" ? (
                          <div className={styles.radioOptions}>
                            {question.options.map((option) => (
                              <label
                                key={`${question.id}-${option}`}
                                className={styles.evaluationChoiceCard}
                              >
                                <input
                                  checked={answers[question.id] === option}
                                  name={question.id}
                                  onChange={() =>
                                    handleSingleAnswerChange(question.id, option)
                                  }
                                  type="radio"
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        ) : null}

                        {question.questionType === "MULTIPLE_RESPONSE" ? (
                          <div className={styles.radioOptions}>
                            {question.options.map((option) => {
                              const currentAnswer = answers[question.id];

                              return (
                                <label
                                  key={`${question.id}-${option}`}
                                  className={styles.evaluationChoiceCard}
                                >
                                  <input
                                    checked={
                                      Array.isArray(currentAnswer) &&
                                      currentAnswer.some(
                                        (value: unknown) => value === option,
                                      )
                                    }
                                    onChange={() =>
                                      handleMultipleAnswerToggle(question.id, option)
                                    }
                                    type="checkbox"
                                  />
                                  <span>{option}</span>
                                </label>
                              );
                            })}
                          </div>
                        ) : null}

                        {question.questionType === "FILL_BLANK" ? (
                          <div className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>Votre reponse</span>
                            <input
                              className={styles.input}
                              onChange={(event) =>
                                handleSingleAnswerChange(question.id, event.target.value)
                              }
                              placeholder="Completez la bonne reponse"
                              type="text"
                              value={
                                typeof answers[question.id] === "string"
                                  ? String(answers[question.id])
                                  : ""
                              }
                            />
                          </div>
                        ) : null}

                        {question.questionType !== "MULTIPLE_CHOICE" &&
                        question.questionType !== "MULTIPLE_RESPONSE" &&
                        question.questionType !== "FILL_BLANK" ? (
                          <div className={styles.fieldGroup}>
                            <span className={styles.fieldLabel}>Votre reponse</span>
                            <textarea
                              className={styles.textarea}
                              onChange={(event) =>
                                handleSingleAnswerChange(question.id, event.target.value)
                              }
                              placeholder="Saisissez votre reponse"
                              value={
                                typeof answers[question.id] === "string"
                                  ? String(answers[question.id])
                                  : ""
                              }
                            />
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </section>

                <aside className={styles.evaluationRunnerAside}>
                  <section className={`${styles.card} ${styles.stackGridSm}`}>
                    <div className={styles.evaluationSectionHeader}>
                      <div>
                        <h2>Dernier resultat</h2>
                        <p>Retrouvez ici votre etat le plus recent.</p>
                      </div>
                    </div>

                    {latestAttempt ? (
                      <div className={styles.evaluationAttemptSummary}>
                        <span className={styles.problemLibraryEyebrow}>
                          {formatAttemptStatus(latestAttempt)}
                        </span>
                        <strong>{formatAttemptScore(latestAttempt)}</strong>
                        <p>
                          Soumis le{" "}
                          {formatWorkspaceDateTime(
                            latestAttempt.submittedAt ?? latestAttempt.createdAt,
                          )}
                        </p>
                        {latestAttempt.feedback ? (
                          <p className={styles.evaluationFeedback}>
                            {latestAttempt.feedback}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className={styles.heroSub}>
                        Aucune tentative soumise pour le moment.
                      </p>
                    )}
                  </section>

                  <section className={`${styles.card} ${styles.stackGridSm}`}>
                    <div className={styles.evaluationSectionHeader}>
                      <div>
                        <h2>Historique</h2>
                        <p>Vos tentatives precedentes pour cette evaluation.</p>
                      </div>
                    </div>

                    {selectedAttempts.length > 0 ? (
                      <div className={styles.evaluationAttemptList}>
                        {selectedAttempts.map((attempt) => (
                          <article key={attempt.id} className={styles.evaluationAttemptCard}>
                            <div className={styles.evaluationAttemptHeader}>
                              <strong>{formatAttemptStatus(attempt)}</strong>
                              <span>{formatAttemptScore(attempt)}</span>
                            </div>
                            <small>
                              {formatWorkspaceDateTime(
                                attempt.submittedAt ?? attempt.createdAt,
                              )}
                            </small>
                            {attempt.feedback ? (
                              <p className={styles.evaluationFeedback}>
                                {attempt.feedback}
                              </p>
                            ) : null}
                            {attempt.answers ? (
                              <div className={styles.evaluationAttemptAnswers}>
                                {selectedQuestions.map((question) => {
                                  const answerPreview = formatAnswerPreview(
                                    attempt.answers?.[question.id],
                                  );

                                  if (!answerPreview) {
                                    return null;
                                  }

                                  return (
                                    <div
                                      key={`${attempt.id}-${question.id}`}
                                      className={styles.evaluationAttemptAnswerRow}
                                    >
                                      <span>{question.statement}</span>
                                      <strong>{answerPreview}</strong>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.heroSub}>
                        Votre historique apparaitra ici apres la premiere soumission.
                      </p>
                    )}
                  </section>
                </aside>
              </div>
            </>
          ) : null}
        </div>
      </StudentShell>
    );
  }

  return (
    <StudentShell activePath="/student/evaluations" topbarTitle="Evaluations" widePage>
      <div className={styles.problemLibraryShell}>
        <section className={styles.problemLibraryHeader}>
          <div className={styles.problemLibraryHeaderCopy}>
            <h1>QCM et evaluations</h1>
            <p>
              Filtrez par categorie, ouvrez l evaluation voulue avec
              <strong> Solve</strong>, puis soumettez vos reponses.
            </p>
            {errorMessage ? (
              <p className={`${styles.heroSub} ${styles.messageError}`}>
                {errorMessage}
              </p>
            ) : null}
          </div>
        </section>

        <section className={styles.problemLibraryToolbar}>
          <div className={styles.problemLibraryFilterGroup}>
            <span className={styles.problemLibraryFilterLabel}>Categories</span>
            <div className={styles.problemLibraryFilterRow}>
              {evaluationFilters.map((filter) => {
                const count =
                  filter.id === "all" ? evaluations.length : filterCounts[filter.id];

                return (
                  <button
                    key={filter.id}
                    aria-pressed={activeFilter === filter.id}
                    className={
                      activeFilter === filter.id
                        ? styles.problemLibraryFilterChipActive
                        : styles.problemLibraryFilterChip
                    }
                    onClick={() =>
                      navigateToEvaluations({
                        type: filter.id === "all" ? null : filter.id,
                        page: "1",
                      })
                    }
                    type="button"
                  >
                    {filter.label}
                    <span>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {status === "loading" ? <EvaluationLibraryLoadingState /> : null}

        {status === "succeeded" && paginatedEvaluations.length > 0 ? (
          <section className={styles.problemLibraryListPanel}>
            <div className={styles.problemLibraryListHeader}>
              <span className={styles.problemLibraryListHeaderCell}>Titre</span>
              <span
                className={`${styles.problemLibraryListHeaderCell} ${styles.problemLibraryListHeaderCellCentered}`}
              >
                Categorie
              </span>
              <span
                className={`${styles.problemLibraryListHeaderCell} ${styles.problemLibraryListHeaderCellCentered}`}
              >
                Questions
              </span>
              <span
                className={`${styles.problemLibraryListHeaderCell} ${styles.problemLibraryListHeaderCellEnd}`}
              >
                Action
              </span>
            </div>

            {paginatedEvaluations.map((evaluation) => {
              const attemptsUsedCount = attemptsByEvaluation[evaluation.id]?.length ?? 0;
              const availability = getEvaluationAvailability(
                evaluation,
                attemptsUsedCount,
              );

              return (
                <article key={evaluation.id} className={styles.problemLibraryListRow}>
                  <div className={styles.problemLibraryListMain}>
                    <h2>{evaluation.title}</h2>
                    <p>
                      {availability.note}
                      {evaluation.course ? ` · ${evaluation.course.title}` : ""}
                    </p>
                  </div>

                  <div
                    className={`${styles.problemLibraryListCell} ${styles.problemLibraryListCellCentered} ${styles.problemLibraryListCategory}`}
                  >
                    <span className={styles.problemLibraryCategoryBadge}>
                      {formatEvaluationType(evaluation.type)}
                    </span>
                  </div>

                  <div
                    className={`${styles.problemLibraryListCell} ${styles.problemLibraryListCellCentered}`}
                  >
                    <span className={styles.evaluationQuestionCount}>
                      {evaluation.questions.length}
                    </span>
                  </div>

                  <div className={styles.problemLibraryListAction}>
                    <button
                      className={styles.problemLibrarySolveButton}
                      disabled={!availability.canSolve || isRouting}
                      onClick={() =>
                        navigateToEvaluations(
                          {
                            page: String(currentPage),
                            evaluation: evaluation.slug,
                          },
                          "push",
                        )
                      }
                      type="button"
                    >
                      Solve
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        ) : null}

        {status === "succeeded" && filteredEvaluations.length === 0 ? (
          <section className={styles.problemLibraryEmptyState}>
            <h2>Aucune evaluation ne correspond a ce filtre</h2>
            <p>
              Essayez une autre categorie pour afficher plus de titres dans la
              bibliotheque.
            </p>
            <button
              className={styles.problemLibraryResetButton}
              onClick={() =>
                navigateToEvaluations({
                  type: null,
                  page: "1",
                })
              }
              type="button"
            >
              Reinitialiser les filtres
            </button>
          </section>
        ) : null}

        {status === "failed" ? (
          <section className={styles.problemLibraryEmptyState}>
            <h2>Le catalogue des evaluations est indisponible</h2>
            <p>Rechargez cette page dans quelques instants pour reessayer.</p>
          </section>
        ) : null}

        {status === "succeeded" && filteredEvaluations.length > 0 ? (
          <nav
            aria-label="Pagination des evaluations"
            className={styles.problemLibraryPagination}
          >
            <button
              className={styles.problemLibraryPaginationButton}
              disabled={currentPage === 1 || isRouting}
              onClick={() =>
                navigateToEvaluations({
                  page: String(Math.max(1, currentPage - 1)),
                })
              }
              type="button"
            >
              Previous
            </button>

            <div className={styles.problemLibraryPaginationPages}>
              {paginationItems.map((item) =>
                typeof item === "number" ? (
                  <button
                    key={`evaluation-page-${item}`}
                    aria-current={item === currentPage ? "page" : undefined}
                    className={
                      item === currentPage
                        ? styles.problemLibraryPaginationButtonActive
                        : styles.problemLibraryPaginationButton
                    }
                    disabled={isRouting}
                    onClick={() =>
                      navigateToEvaluations({
                        page: String(item),
                      })
                    }
                    type="button"
                  >
                    {item}
                  </button>
                ) : (
                  <span key={item} className={styles.problemLibraryPaginationDots}>
                    ...
                  </span>
                ),
              )}
            </div>

            <button
              className={styles.problemLibraryPaginationButton}
              disabled={currentPage === totalPages || isRouting}
              onClick={() =>
                navigateToEvaluations({
                  page: String(Math.min(totalPages, currentPage + 1)),
                })
              }
              type="button"
            >
              Next
            </button>
          </nav>
        ) : null}
      </div>
    </StudentShell>
  );
}
