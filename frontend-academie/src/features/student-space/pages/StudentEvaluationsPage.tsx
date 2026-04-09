"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchWorkspaceEvaluations,
  fetchWorkspaceMyEvaluationAttempts,
  submitWorkspaceEvaluationAttempt,
} from "@/features/workspace-data/api/workspace-api.client";
import type {
  WorkspaceEvaluationAttemptRecord,
  WorkspaceEvaluationRecord,
} from "@/features/workspace-data/model/workspace-api.types";
import { formatWorkspaceDateTime } from "@/features/workspace-data/model/workspace-ui.utils";
import styles from "../student-space.module.css";
import { StudentShell } from "../components/StudentShell";

export function StudentEvaluationsPage() {
  const [evaluations, setEvaluations] = useState<WorkspaceEvaluationRecord[]>([]);
  const [attempts, setAttempts] = useState<WorkspaceEvaluationAttemptRecord[]>([]);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const availableEvaluations = useMemo(
    () => evaluations.filter((evaluation) => evaluation.isPublished),
    [evaluations],
  );
  const selectedEvaluation = useMemo(
    () =>
      availableEvaluations.find((evaluation) => evaluation.id === selectedEvaluationId) ??
      availableEvaluations[0] ??
      null,
    [availableEvaluations, selectedEvaluationId],
  );
  const selectedAttempts = useMemo(
    () =>
      attempts.filter((attempt) => attempt.evaluation.id === selectedEvaluation?.id),
    [attempts, selectedEvaluation?.id],
  );

  useEffect(() => {
    void loadEvaluations();
  }, []);

  useEffect(() => {
    if (selectedEvaluation && selectedEvaluation.id !== selectedEvaluationId) {
      setSelectedEvaluationId(selectedEvaluation.id);
      setAnswers({});
    }
  }, [selectedEvaluation, selectedEvaluationId]);

  async function loadEvaluations() {
    setLoading(true);

    try {
      const [nextEvaluations, nextAttempts] = await Promise.all([
        fetchWorkspaceEvaluations(),
        fetchWorkspaceMyEvaluationAttempts(),
      ]);
      setEvaluations(nextEvaluations);
      setAttempts(nextAttempts);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de charger les evaluations.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!selectedEvaluation) {
      return;
    }

    const missingAnswer = selectedEvaluation.questions.some((question) => !answers[question.id]?.trim());
    if (missingAnswer) {
      setErrorMessage("Merci de repondre a toutes les questions avant de soumettre.");
      return;
    }

    setSubmitting(true);
    try {
      await submitWorkspaceEvaluationAttempt(selectedEvaluation.id, { answers });
      setSuccessMessage("Votre evaluation a ete soumise.");
      setErrorMessage(null);
      setAnswers({});
      await loadEvaluations();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de soumettre cette evaluation.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StudentShell activePath="/student/evaluations" topbarTitle="Mes Evaluations">
      <section className={styles.heroRow}>
        <div>
          <h1 className={styles.heroTitle}>Evaluations et QCM</h1>
          <p className={styles.heroSub}>
            Repondez a vos QCM et suivez vos tentatives reelles depuis cette page.
          </p>
          {errorMessage ? <p className={`${styles.heroSub} ${styles.messageError}`}>{errorMessage}</p> : null}
          {successMessage ? <p className={`${styles.heroSub} ${styles.messageSuccess}`}>{successMessage}</p> : null}
        </div>
      </section>

      <div className={styles.grid}>
        <article className={styles.card}>
          <h3>Choisir une evaluation</h3>
          <div className={`${styles.supportFormModern} ${styles.supportFormFlush}`}>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Evaluation</span>
              <select
                className={styles.input}
                value={selectedEvaluation?.id ?? ""}
                onChange={(event) => setSelectedEvaluationId(event.target.value)}
              >
                <option value="">Choisir une evaluation</option>
                {availableEvaluations.map((evaluation) => (
                  <option key={evaluation.id} value={evaluation.id}>
                    {evaluation.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? <p className={styles.heroSub}>Chargement des evaluations...</p> : null}
          {selectedEvaluation ? (
            <div className={styles.stackGridMd}>
              <div>
                <strong>{selectedEvaluation.title}</strong>
                <p className={styles.heroSub}>
                  {selectedEvaluation.course?.title ?? "Sans cours"} ·{" "}
                  {selectedEvaluation.durationInMinutes
                    ? `${selectedEvaluation.durationInMinutes} min`
                    : "Duree libre"}
                </p>
                <p className={styles.heroSub}>{selectedEvaluation.instructions || "Aucune consigne particuliere."}</p>
              </div>

              {selectedEvaluation.questions.map((question, index) => (
                <div key={question.id} className={styles.supportInsightCard}>
                  <span className={styles.supportInsightLabel}>Question {index + 1}</span>
                  <strong>{question.statement}</strong>
                  {question.options.length > 0 ? (
                    <div className={styles.radioOptions}>
                      {question.options.map((option) => (
                        <label key={option} className={styles.radioOption}>
                          <input
                            checked={answers[question.id] === option}
                            name={question.id}
                            onChange={() =>
                              setAnswers((current) => ({ ...current, [question.id]: option }))
                            }
                            type="radio"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      className={styles.textarea}
                      placeholder="Votre reponse"
                      rows={4}
                      value={answers[question.id] ?? ""}
                      onChange={(event) =>
                        setAnswers((current) => ({ ...current, [question.id]: event.target.value }))
                      }
                    />
                  )}
                </div>
              ))}

              <div className={styles.actionRow}>
                <button className={styles.primaryBtn} type="button" onClick={() => void handleSubmit()}>
                  {submitting ? "Soumission..." : "Soumettre mes reponses"}
                </button>
              </div>
            </div>
          ) : (
            !loading && <p className={styles.heroSub}>Aucune evaluation publiee disponible.</p>
          )}
        </article>

        <article className={styles.card}>
          <h3>Historique de mes tentatives</h3>
          <div className={styles.timeline}>
            {selectedAttempts.map((attempt) => (
              <div key={attempt.id} className={styles.timelineItem}>
                <div>
                  <strong>{attempt.evaluation.title}</strong>
                  <p className={styles.heroSub}>{attempt.status}</p>
                </div>
                <span>
                  {attempt.score !== null ? `${attempt.score}/${attempt.maxScore}` : "En attente"}
                  <br />
                  {formatWorkspaceDateTime(attempt.submittedAt)}
                </span>
              </div>
            ))}
            {!loading && selectedAttempts.length === 0 ? (
              <p className={styles.heroSub}>Aucune tentative pour cette evaluation.</p>
            ) : null}
          </div>
        </article>
      </div>
    </StudentShell>
  );
}
