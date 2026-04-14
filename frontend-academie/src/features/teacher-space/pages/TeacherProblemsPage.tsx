"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCurrentAuthSession } from "@/features/auth/model/useCurrentAuthSession";
import {
  formatWorkspaceDateTime,
  slugifyWorkspaceValue,
} from "@/features/workspace-data/model/workspace-ui.utils";
import {
  attachTeacherProblemTag,
  createTeacherProblem,
  createTeacherProblemTag,
  createTeacherProblemTestCase,
  deleteTeacherProblemTestCase,
  detachTeacherProblemTag,
  fetchTeacherProblems,
  fetchTeacherProblemTags,
  fetchTeacherSupportedLanguages,
  updateTeacherProblem,
} from "../teacher-problems.client";
import styles from "../teacher-space.module.css";
import type {
  CreateTeacherProblemPayload,
  CreateTeacherProblemTagPayload,
  CreateTeacherProblemTestCasePayload,
  TeacherProblemRecord,
  TeacherProblemTagRecord,
  TeacherSupportedLanguageRecord,
} from "../teacher-space.types";
import { TeacherShell } from "../components/TeacherShell";

const EMPTY_PROBLEM_FORM: CreateTeacherProblemPayload = {
  title: "",
  slug: "",
  statement: "",
  inputFormat: "",
  outputFormat: "",
  constraints: "",
  sampleInput: "",
  sampleOutput: "",
  explanation: "",
  difficulty: "EASY",
  status: "DRAFT",
  timeLimitMs: 1000,
  memoryLimitMb: 256,
  isPublished: false,
};

const EMPTY_TAG_FORM: CreateTeacherProblemTagPayload = {
  name: "",
  slug: "",
};

const EMPTY_TEST_CASE_FORM: CreateTeacherProblemTestCasePayload = {
  expectedOutput: "",
  input: "",
  isHidden: true,
  points: 0,
  position: 1,
};

function sanitizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function toProblemForm(problem: TeacherProblemRecord): CreateTeacherProblemPayload {
  return {
    difficulty: problem.difficulty,
    explanation: problem.explanation ?? "",
    inputFormat: problem.inputFormat ?? "",
    isPublished: problem.isPublished,
    memoryLimitMb: problem.memoryLimitMb,
    outputFormat: problem.outputFormat ?? "",
    sampleInput: problem.sampleInput ?? "",
    sampleOutput: problem.sampleOutput ?? "",
    slug: problem.slug,
    statement: problem.statement,
    status: problem.status,
    timeLimitMs: problem.timeLimitMs,
    title: problem.title,
    constraints: problem.constraints ?? "",
  };
}

function formatProblemDifficulty(difficulty: TeacherProblemRecord["difficulty"]) {
  if (difficulty === "EASY") {
    return "Facile";
  }

  if (difficulty === "HARD") {
    return "Difficile";
  }

  return "Intermediaire";
}

function formatProblemStatus(status: TeacherProblemRecord["status"]) {
  if (status === "PUBLISHED") {
    return "Publie";
  }

  if (status === "ARCHIVED") {
    return "Archive";
  }

  return "Brouillon";
}

export function TeacherProblemsPage() {
  const { user } = useCurrentAuthSession();
  const [problems, setProblems] = useState<TeacherProblemRecord[]>([]);
  const [tags, setTags] = useState<TeacherProblemTagRecord[]>([]);
  const [languages, setLanguages] = useState<TeacherSupportedLanguageRecord[]>([]);
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [problemForm, setProblemForm] = useState<CreateTeacherProblemPayload>(EMPTY_PROBLEM_FORM);
  const [tagForm, setTagForm] = useState<CreateTeacherProblemTagPayload>(EMPTY_TAG_FORM);
  const [testCaseForm, setTestCaseForm] =
    useState<CreateTeacherProblemTestCasePayload>(EMPTY_TEST_CASE_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<
    "problem" | "tag" | "testcase" | "tag-link" | null
  >(null);
  const [busyTagId, setBusyTagId] = useState<string | null>(null);
  const [busyTestCaseId, setBusyTestCaseId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedProblem = useMemo(
    () => problems.find((problem) => problem.id === selectedProblemId) ?? problems[0] ?? null,
    [problems, selectedProblemId],
  );

  const availableTags = useMemo(() => {
    if (!selectedProblem) {
      return tags;
    }

    return tags.filter(
      (tag) => !selectedProblem.tags.some((attachedTag) => attachedTag.id === tag.id),
    );
  }, [selectedProblem, tags]);

  const publishedProblemsCount = problems.filter((problem) => problem.isPublished).length;
  const totalTestCases = problems.reduce((sum, problem) => sum + problem.testCases.length, 0);
  const activeLanguages = languages.filter((language) => language.isActive);

  const loadWorkspace = useCallback(
    async (preferredProblemId?: string) => {
      setLoading(true);

      try {
        const [allProblems, allTags, allLanguages] = await Promise.all([
          fetchTeacherProblems(),
          fetchTeacherProblemTags(),
          fetchTeacherSupportedLanguages(),
        ]);

        const ownedProblems = user?.id
          ? allProblems.filter((problem) => problem.creator.id === user.id)
          : allProblems;
        const nextSelectedProblemId =
          preferredProblemId && ownedProblems.some((problem) => problem.id === preferredProblemId)
            ? preferredProblemId
            : ownedProblems[0]?.id ?? "";

        setProblems(ownedProblems);
        setTags(allTags);
        setLanguages(allLanguages);
        setSelectedProblemId(nextSelectedProblemId);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger le studio de problemes.",
        );
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!selectedProblem) {
      setProblemForm(EMPTY_PROBLEM_FORM);
      setTestCaseForm(EMPTY_TEST_CASE_FORM);
      return;
    }

    setProblemForm(toProblemForm(selectedProblem));
    setTestCaseForm({
      ...EMPTY_TEST_CASE_FORM,
      position: (selectedProblem.testCases.at(-1)?.position ?? 0) + 1,
    });
  }, [selectedProblem]);

  async function handleSaveProblem() {
    if (!problemForm.title.trim() || !problemForm.statement.trim()) {
      setErrorMessage("Le titre et l enonce sont obligatoires.");
      return;
    }

    setSubmitting("problem");

    try {
      const payload: CreateTeacherProblemPayload = {
        difficulty: problemForm.difficulty,
        explanation: sanitizeOptionalText(problemForm.explanation ?? ""),
        inputFormat: sanitizeOptionalText(problemForm.inputFormat ?? ""),
        isPublished: problemForm.isPublished,
        memoryLimitMb: problemForm.memoryLimitMb,
        outputFormat: sanitizeOptionalText(problemForm.outputFormat ?? ""),
        sampleInput: sanitizeOptionalText(problemForm.sampleInput ?? ""),
        sampleOutput: sanitizeOptionalText(problemForm.sampleOutput ?? ""),
        slug: slugifyWorkspaceValue(problemForm.slug || problemForm.title),
        statement: problemForm.statement.trim(),
        status: problemForm.status,
        timeLimitMs: problemForm.timeLimitMs,
        title: problemForm.title.trim(),
        constraints: sanitizeOptionalText(problemForm.constraints ?? ""),
      };

      const savedProblem = selectedProblem
        ? await updateTeacherProblem(selectedProblem.id, payload)
        : await createTeacherProblem(payload);

      setSuccessMessage(
        selectedProblem ? "Le probleme a ete mis a jour." : "Le probleme a ete cree.",
      );
      setErrorMessage(null);
      await loadWorkspace(savedProblem.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible d enregistrer ce probleme.",
      );
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCreateTag() {
    if (!tagForm.name.trim()) {
      setErrorMessage("Le nom du tag est obligatoire.");
      return;
    }

    setSubmitting("tag");

    try {
      await createTeacherProblemTag({
        name: tagForm.name.trim(),
        slug: slugifyWorkspaceValue(tagForm.slug || tagForm.name),
      });
      setTagForm(EMPTY_TAG_FORM);
      setSuccessMessage("Le tag a ete cree.");
      setErrorMessage(null);
      await loadWorkspace(selectedProblem?.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de creer ce tag.",
      );
    } finally {
      setSubmitting(null);
    }
  }

  async function handleAttachTag(tagId: string) {
    if (!selectedProblem) {
      setErrorMessage("Creez ou selectionnez un probleme avant de gerer ses tags.");
      return;
    }

    setSubmitting("tag-link");
    setBusyTagId(tagId);

    try {
      await attachTeacherProblemTag(selectedProblem.id, tagId);
      setSuccessMessage("Le tag a ete associe au probleme.");
      setErrorMessage(null);
      await loadWorkspace(selectedProblem.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible d associer ce tag.",
      );
    } finally {
      setBusyTagId(null);
      setSubmitting(null);
    }
  }

  async function handleDetachTag(tagId: string) {
    if (!selectedProblem) {
      return;
    }

    setSubmitting("tag-link");
    setBusyTagId(tagId);

    try {
      await detachTeacherProblemTag(selectedProblem.id, tagId);
      setSuccessMessage("Le tag a ete retire du probleme.");
      setErrorMessage(null);
      await loadWorkspace(selectedProblem.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de retirer ce tag.",
      );
    } finally {
      setBusyTagId(null);
      setSubmitting(null);
    }
  }

  async function handleCreateTestCase() {
    if (!selectedProblem) {
      setErrorMessage("Creez ou selectionnez un probleme avant d ajouter un test case.");
      return;
    }

    if (!testCaseForm.input.trim() || !testCaseForm.expectedOutput.trim()) {
      setErrorMessage("L entree et la sortie attendue sont obligatoires.");
      return;
    }

    setSubmitting("testcase");

    try {
      await createTeacherProblemTestCase(selectedProblem.id, {
        expectedOutput: testCaseForm.expectedOutput.trim(),
        input: testCaseForm.input.trim(),
        isHidden: testCaseForm.isHidden,
        points: testCaseForm.points,
        position: testCaseForm.position,
      });
      setSuccessMessage("Le test case a ete ajoute.");
      setErrorMessage(null);
      await loadWorkspace(selectedProblem.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible d ajouter ce test case.",
      );
    } finally {
      setSubmitting(null);
    }
  }

  async function handleDeleteTestCase(testCaseId: string) {
    if (!selectedProblem) {
      return;
    }

    setSubmitting("testcase");
    setBusyTestCaseId(testCaseId);

    try {
      await deleteTeacherProblemTestCase(selectedProblem.id, testCaseId);
      setSuccessMessage("Le test case a ete supprime.");
      setErrorMessage(null);
      await loadWorkspace(selectedProblem.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de supprimer ce test case.",
      );
    } finally {
      setBusyTestCaseId(null);
      setSubmitting(null);
    }
  }

  function handleStartNewProblem() {
    setSelectedProblemId("");
    setProblemForm(EMPTY_PROBLEM_FORM);
    setSuccessMessage(null);
    setErrorMessage(null);
  }

  return (
    <TeacherShell activePath="/teacher/problems" title="Problems">
      <section>
        <h2 className={styles.sectionTitle}>Studio de problemes</h2>
        <p className={styles.sectionSub}>
          Creez vos exercices, structurez les tags, ajoutez les test cases caches et
          publiez vos challenges depuis le workspace Teacher.
        </p>
      </section>

      {errorMessage ? <p className={`${styles.sectionSub} ${styles.messageError}`}>{errorMessage}</p> : null}
      {successMessage ? (
        <p className={`${styles.sectionSub} ${styles.messageSuccess}`}>{successMessage}</p>
      ) : null}

      <section className={`${styles.gridKpi} ${styles.sectionSpacing}`}>
        <StatCard label="Problemes" value={String(problems.length)} note="Crees dans votre bibliotheque" />
        <StatCard label="Publies" value={String(publishedProblemsCount)} note="Visibles dans l espace student" />
        <StatCard label="Tags" value={String(tags.length)} note="Disponibles pour classifier les exercices" />
        <StatCard label="Test cases" value={String(totalTestCases)} note="Caches et publics confondus" />
      </section>

      <section className={styles.problemWorkspaceLayout}>
        <article className={styles.card}>
          <div className={styles.problemWorkspaceHeader}>
            <div>
              <h3>{selectedProblem ? "Modifier le probleme" : "Nouveau probleme"}</h3>
              <p className={styles.sectionSub}>
                {selectedProblem
                  ? `Selection actuelle: ${selectedProblem.title}`
                  : "Commencez par renseigner les informations de base du challenge."}
              </p>
            </div>
            <button className={styles.ghostBtn} onClick={handleStartNewProblem} type="button">
              Nouveau
            </button>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.buttonRow}>
              <input
                className={styles.input}
                placeholder="Titre du probleme"
                value={problemForm.title}
                onChange={(event) =>
                  setProblemForm((current) => ({
                    ...current,
                    title: event.target.value,
                    slug:
                      current.slug && current.slug !== slugifyWorkspaceValue(current.title)
                        ? current.slug
                        : slugifyWorkspaceValue(event.target.value),
                  }))
                }
              />
              <input
                className={styles.input}
                placeholder="slug-probleme"
                value={problemForm.slug}
                onChange={(event) =>
                  setProblemForm((current) => ({ ...current, slug: event.target.value }))
                }
              />
            </div>

            <textarea
              className={styles.textarea}
              placeholder="Enonce detaille"
              value={problemForm.statement}
              onChange={(event) =>
                setProblemForm((current) => ({ ...current, statement: event.target.value }))
              }
            />

            <div className={styles.buttonRow}>
              <select
                className={styles.select}
                value={problemForm.difficulty}
                onChange={(event) =>
                  setProblemForm((current) => ({
                    ...current,
                    difficulty: event.target.value as CreateTeacherProblemPayload["difficulty"],
                  }))
                }
              >
                <option value="EASY">Facile</option>
                <option value="MEDIUM">Intermediaire</option>
                <option value="HARD">Difficile</option>
              </select>
              <select
                className={styles.select}
                value={problemForm.status}
                onChange={(event) =>
                  setProblemForm((current) => ({
                    ...current,
                    status: event.target.value as CreateTeacherProblemPayload["status"],
                  }))
                }
              >
                <option value="DRAFT">Brouillon</option>
                <option value="PUBLISHED">Publie</option>
                <option value="ARCHIVED">Archive</option>
              </select>
            </div>

            <div className={styles.buttonRow}>
              <input
                className={styles.input}
                min={100}
                placeholder="Temps max (ms)"
                type="number"
                value={problemForm.timeLimitMs}
                onChange={(event) =>
                  setProblemForm((current) => ({
                    ...current,
                    timeLimitMs: Number(event.target.value) || 100,
                  }))
                }
              />
              <input
                className={styles.input}
                min={32}
                placeholder="Memoire max (MB)"
                type="number"
                value={problemForm.memoryLimitMb}
                onChange={(event) =>
                  setProblemForm((current) => ({
                    ...current,
                    memoryLimitMb: Number(event.target.value) || 32,
                  }))
                }
              />
            </div>

            <textarea
              className={styles.textarea}
              placeholder="Format d entree"
              value={problemForm.inputFormat}
              onChange={(event) =>
                setProblemForm((current) => ({ ...current, inputFormat: event.target.value }))
              }
            />
            <textarea
              className={styles.textarea}
              placeholder="Format de sortie"
              value={problemForm.outputFormat}
              onChange={(event) =>
                setProblemForm((current) => ({ ...current, outputFormat: event.target.value }))
              }
            />
            <textarea
              className={styles.textarea}
              placeholder="Contraintes"
              value={problemForm.constraints}
              onChange={(event) =>
                setProblemForm((current) => ({ ...current, constraints: event.target.value }))
              }
            />
            <textarea
              className={styles.textarea}
              placeholder="Explication"
              value={problemForm.explanation}
              onChange={(event) =>
                setProblemForm((current) => ({ ...current, explanation: event.target.value }))
              }
            />

            <div className={styles.buttonRow}>
              <textarea
                className={styles.textarea}
                placeholder="Sample input"
                value={problemForm.sampleInput}
                onChange={(event) =>
                  setProblemForm((current) => ({ ...current, sampleInput: event.target.value }))
                }
              />
              <textarea
                className={styles.textarea}
                placeholder="Sample output"
                value={problemForm.sampleOutput}
                onChange={(event) =>
                  setProblemForm((current) => ({ ...current, sampleOutput: event.target.value }))
                }
              />
            </div>

            <label className={styles.problemCheckboxRow}>
              <input
                checked={problemForm.isPublished}
                onChange={(event) =>
                  setProblemForm((current) => ({
                    ...current,
                    isPublished: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span>Afficher ce probleme dans la bibliotheque student</span>
            </label>

            <div className={styles.buttonRow}>
              <button
                className={styles.primaryBtn}
                disabled={submitting === "problem"}
                onClick={handleSaveProblem}
                type="button"
              >
                {submitting === "problem"
                  ? "Enregistrement..."
                  : selectedProblem
                    ? "Mettre a jour"
                    : "Creer le probleme"}
              </button>
            </div>
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.problemWorkspaceHeader}>
            <div>
              <h3>Bibliotheque</h3>
              <p className={styles.sectionSub}>
                {loading
                  ? "Chargement de vos problemes..."
                  : `${problems.length} probleme(s) visible(s) dans votre studio.`}
              </p>
            </div>
          </div>

          <div className={styles.problemList}>
            {problems.map((problem) => (
              <button
                key={problem.id}
                className={
                  selectedProblem?.id === problem.id
                    ? styles.problemListItemActive
                    : styles.problemListItem
                }
                onClick={() => setSelectedProblemId(problem.id)}
                type="button"
              >
                <div className={styles.problemListTitleRow}>
                  <strong>{problem.title}</strong>
                  <span className={styles.chip}>{formatProblemDifficulty(problem.difficulty)}</span>
                </div>
                <p>{problem.slug}</p>
                <div className={styles.problemListMeta}>
                  <span>{formatProblemStatus(problem.status)}</span>
                  <span>{problem.testCasesCount} tests</span>
                  <span>{problem.isPublished ? "Visible student" : "Masque"}</span>
                </div>
              </button>
            ))}

            {!loading && problems.length === 0 ? (
              <div className={styles.problemNotice}>
                Aucun probleme n est encore rattache a votre compte teacher.
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className={styles.problemWorkspaceLayout}>
        <article className={styles.card}>
          <div className={styles.problemWorkspaceHeader}>
            <div>
              <h3>Tags</h3>
              <p className={styles.sectionSub}>
                Creez des tags reutilisables puis associez-les au probleme selectionne.
              </p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.buttonRow}>
              <input
                className={styles.input}
                placeholder="Nom du tag"
                value={tagForm.name}
                onChange={(event) =>
                  setTagForm((current) => ({
                    ...current,
                    name: event.target.value,
                    slug:
                      current.slug && current.slug !== slugifyWorkspaceValue(current.name)
                        ? current.slug
                        : slugifyWorkspaceValue(event.target.value),
                  }))
                }
              />
              <input
                className={styles.input}
                placeholder="slug-tag"
                value={tagForm.slug}
                onChange={(event) =>
                  setTagForm((current) => ({ ...current, slug: event.target.value }))
                }
              />
            </div>

            <div className={styles.buttonRow}>
              <button
                className={styles.primaryBtn}
                disabled={submitting === "tag"}
                onClick={handleCreateTag}
                type="button"
              >
                {submitting === "tag" ? "Creation..." : "Creer le tag"}
              </button>
            </div>

            <div className={styles.problemTagCloud}>
              {selectedProblem?.tags.map((tag) => (
                <button
                  key={tag.id}
                  className={styles.problemTagButtonActive}
                  disabled={submitting === "tag-link" && busyTagId === tag.id}
                  onClick={() => void handleDetachTag(tag.id)}
                  type="button"
                >
                  {tag.name}
                </button>
              ))}

              {selectedProblem && selectedProblem.tags.length === 0 ? (
                <div className={styles.problemNotice}>
                  Aucun tag rattache pour le moment.
                </div>
              ) : null}
            </div>

            <div className={styles.problemTagCloud}>
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  className={styles.problemTagButton}
                  disabled={!selectedProblem || (submitting === "tag-link" && busyTagId === tag.id)}
                  onClick={() => void handleAttachTag(tag.id)}
                  type="button"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.problemWorkspaceHeader}>
            <div>
              <h3>Runtimes actifs</h3>
              <p className={styles.sectionSub}>
                Les soumissions student utilisent ces environnements actuellement disponibles.
              </p>
            </div>
          </div>

          <div className={styles.problemLanguageList}>
            {activeLanguages.map((language) => (
              <div key={language.id} className={styles.problemLanguageItem}>
                <strong>{language.name}</strong>
                <span>{language.version ? `${language.slug} / ${language.version}` : language.slug}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.card}>
        <div className={styles.problemWorkspaceHeader}>
          <div>
            <h3>Test cases</h3>
            <p className={styles.sectionSub}>
              Ajoutez les cas publics et caches qui seront executes lors de la soumission.
            </p>
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.buttonRow}>
            <input
              className={styles.input}
              min={1}
              placeholder="Position"
              type="number"
              value={testCaseForm.position}
              onChange={(event) =>
                setTestCaseForm((current) => ({
                  ...current,
                  position: Number(event.target.value) || 1,
                }))
              }
            />
            <input
              className={styles.input}
              min={0}
              placeholder="Points"
              step="0.25"
              type="number"
              value={testCaseForm.points ?? 0}
              onChange={(event) =>
                setTestCaseForm((current) => ({
                  ...current,
                  points: Number(event.target.value) || 0,
                }))
              }
            />
          </div>

          <div className={styles.buttonRow}>
            <textarea
              className={styles.textarea}
              placeholder="Input"
              value={testCaseForm.input}
              onChange={(event) =>
                setTestCaseForm((current) => ({ ...current, input: event.target.value }))
              }
            />
            <textarea
              className={styles.textarea}
              placeholder="Expected output"
              value={testCaseForm.expectedOutput}
              onChange={(event) =>
                setTestCaseForm((current) => ({
                  ...current,
                  expectedOutput: event.target.value,
                }))
              }
            />
          </div>

          <label className={styles.problemCheckboxRow}>
            <input
              checked={Boolean(testCaseForm.isHidden)}
              onChange={(event) =>
                setTestCaseForm((current) => ({
                  ...current,
                  isHidden: event.target.checked,
                }))
              }
              type="checkbox"
            />
            <span>Masquer ce test case dans le retour student</span>
          </label>

          <div className={styles.buttonRow}>
            <button
              className={styles.primaryBtn}
              disabled={!selectedProblem || submitting === "testcase"}
              onClick={handleCreateTestCase}
              type="button"
            >
              {submitting === "testcase" ? "Ajout..." : "Ajouter le test case"}
            </button>
          </div>
        </div>

        <div className={styles.problemTestCaseList}>
          {selectedProblem?.testCases.map((testCase) => (
            <article key={testCase.id} className={styles.problemTestCaseCard}>
              <div className={styles.problemListTitleRow}>
                <strong>Case #{testCase.position}</strong>
                <span className={styles.chip}>
                  {testCase.isHidden ? "Cache" : "Public"}
                </span>
              </div>
              <p>Points: {testCase.points}</p>
              <p>Input: {testCase.input}</p>
              <p>Expected: {testCase.expectedOutput}</p>
              <div className={styles.problemTestCaseFooter}>
                <span>{formatWorkspaceDateTime(testCase.updatedAt)}</span>
                <button
                  className={styles.ghostBtn}
                  disabled={submitting === "testcase" && busyTestCaseId === testCase.id}
                  onClick={() => void handleDeleteTestCase(testCase.id)}
                  type="button"
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}

          {selectedProblem && selectedProblem.testCases.length === 0 ? (
            <div className={styles.problemNotice}>
              Aucun test case configure pour le moment.
            </div>
          ) : null}

          {!selectedProblem ? (
            <div className={styles.problemNotice}>
              Creez ou selectionnez un probleme pour commencer a ajouter des cas de test.
            </div>
          ) : null}
        </div>
      </section>
    </TeacherShell>
  );
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className={styles.card}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
      <p className={styles.sectionSub}>{note}</p>
    </article>
  );
}
