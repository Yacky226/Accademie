"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/core/store/app-store-hooks";
import {
  createJudgeRunThunk,
  createSubmissionThunk,
  fetchStudentCodeEditorBootstrapThunk,
  pollJudgeRunThunk,
  pollSubmissionThunk,
} from "@/features/student-code-editor/model/student-code-editor.slice";
import {
  selectLatestJudgeRun,
  selectLatestSubmission,
  selectStudentCodeEditorError,
  selectStudentCodeEditorRunStatus,
  selectStudentCodeEditorStatus,
  selectStudentCodeEditorSubmitStatus,
  selectStudentCodeExercise,
} from "@/features/student-code-editor/model/student-code-editor.selectors";
import {
  studentCodeConsoleBoot,
  studentCodeExercise as fallbackStudentCodeExercise,
} from "@/features/student-code-editor/model/student-code-editor.catalog";
import type {
  StudentCodingLanguageId,
  StudentConsoleEntry,
} from "@/features/student-code-editor/model/student-code-editor.contracts";
import { StudentMonacoEditor } from "./StudentMonacoEditor";
import styles from "../student-space.module.css";

type ProblemTabId = "description" | "examples" | "constraints" | "hints";
type WorkspaceFileId = "solution" | "tests";

const problemTabs: Array<{ id: ProblemTabId; label: string }> = [
  { id: "description", label: "Description" },
  { id: "examples", label: "Examples" },
  { id: "constraints", label: "Constraints" },
  { id: "hints", label: "Hints" },
];

function buildTimeLabel() {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function toMonacoLanguage(languageId: StudentCodingLanguageId) {
  if (languageId === "python") {
    return "python";
  }

  if (languageId === "java") {
    return "java";
  }

  if (languageId === "cpp") {
    return "cpp";
  }

  return "typescript";
}

function isExecutionPending(status: string) {
  return status === "PENDING" || status === "RUNNING";
}

function EditorFocusToggleIcon({ isActive }: { isActive: boolean }) {
  return (
    <svg
      aria-hidden
      className={styles.codeStudioFocusIcon}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 20 20"
    >
      {isActive ? (
        <>
          <path d="M7 2.75H2.75V7" />
          <path d="M13 2.75h4.25V7" />
          <path d="M2.75 13V17.25H7" />
          <path d="M17.25 13v4.25H13" />
        </>
      ) : (
        <>
          <path d="M2.75 7H7V2.75" />
          <path d="M13 2.75V7h4.25" />
          <path d="M7 17.25V13H2.75" />
          <path d="M17.25 13H13v4.25" />
        </>
      )}
    </svg>
  );
}

export function StudentCodeEditorWorkspace() {
  const dispatch = useAppDispatch();
  const studentCodeExercise = useAppSelector(selectStudentCodeExercise);
  const workspaceStatus = useAppSelector(selectStudentCodeEditorStatus);
  const runStatus = useAppSelector(selectStudentCodeEditorRunStatus);
  const submitStatus = useAppSelector(selectStudentCodeEditorSubmitStatus);
  const editorErrorMessage = useAppSelector(selectStudentCodeEditorError);
  const latestRun = useAppSelector(selectLatestJudgeRun);
  const latestSubmission = useAppSelector(selectLatestSubmission);
  const [activeLanguageId, setActiveLanguageId] =
    useState<StudentCodingLanguageId>(
      fallbackStudentCodeExercise.languages[0].id,
    );
  const [activeProblemTab, setActiveProblemTab] =
    useState<ProblemTabId>("description");
  const [activeFile, setActiveFile] = useState<WorkspaceFileId>("solution");
  const [isEditorFocus, setIsEditorFocus] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [consoleEntries, setConsoleEntries] = useState<StudentConsoleEntry[]>(
    studentCodeConsoleBoot,
  );
  const [codeByLanguage, setCodeByLanguage] = useState<
    Record<StudentCodingLanguageId, string>
  >(
    () =>
      Object.fromEntries(
        fallbackStudentCodeExercise.languages.map((language) => [
          language.id,
          language.starterCode,
        ]),
      ) as Record<StudentCodingLanguageId, string>,
  );

  useEffect(() => {
    if (workspaceStatus === "idle") {
      void dispatch(fetchStudentCodeEditorBootstrapThunk());
    }
  }, [dispatch, workspaceStatus]);
  const resolvedActiveLanguageId = studentCodeExercise.languages.some(
    (language) => language.id === activeLanguageId,
  )
    ? activeLanguageId
    : (studentCodeExercise.languages[0]?.id ?? activeLanguageId);

  const activeLanguage =
    studentCodeExercise.languages.find(
      (language) => language.id === resolvedActiveLanguageId,
    ) ?? studentCodeExercise.languages[0];
  const currentCode = codeByLanguage[activeLanguage.id];
  const lineCount = currentCode.split("\n").length;
  const characterCount = currentCode.length;
  const monacoLanguage = toMonacoLanguage(activeLanguage.id);
  const monacoPath = `file:///workspace/${activeLanguage.fileName}`;

  const fileItems = [
    {
      id: "solution" as const,
      label: activeLanguage.fileName,
      meta: `${activeLanguage.label} starter`,
    },
    {
      id: "tests" as const,
      label: "tests.txt",
      meta: `${studentCodeExercise.tests.length} tracked cases`,
    },
  ];

  function handleCodeChange(nextValue: string) {
    setCodeByLanguage((current) => ({
      ...current,
      [activeLanguage.id]: nextValue,
    }));
  }

  function handleLanguageChange(nextLanguageId: StudentCodingLanguageId) {
    const nextLanguage =
      studentCodeExercise.languages.find(
        (language) => language.id === nextLanguageId,
      ) ?? studentCodeExercise.languages[0];

    setActiveLanguageId(nextLanguageId);
    setActiveFile("solution");
    setConsoleEntries([
      {
        tone: "muted",
        message: `${buildTimeLabel()} > Switched to ${nextLanguage.label}.`,
      },
      {
        tone: "info",
        message:
          "Monaco preserved a dedicated draft for each language workspace.",
      },
    ]);
  }

  async function handleRun() {
    try {
      const run = await dispatch(
        createJudgeRunThunk({
          sourceCode: currentCode,
          languageId: activeLanguage.id,
          stdin: studentCodeExercise.examples[0]?.input,
          expectedOutput: studentCodeExercise.examples[0]?.output,
        }),
      ).unwrap();

      setConsoleEntries([
        {
          tone: "muted",
          message: `${buildTimeLabel()} > Judge run ${run.id.slice(0, 8)} ${
            isExecutionPending(run.status) ? "queued" : "completed"
          } for ${activeLanguage.fileName}.`,
        },
        {
          tone: run.verdict === "ACCEPTED" ? "success" : "info",
          message:
            run.verdict === "ACCEPTED"
              ? activeLanguage.runSummary
              : `Backend status: ${run.status}${run.verdict ? ` / ${run.verdict}` : ""}.`,
        },
        {
          tone: "info",
          message:
            run.stdout?.trim() ||
            run.stderr?.trim() ||
            run.compileOutput?.trim() ||
            (isExecutionPending(run.status)
              ? "The run was created successfully. Results will appear here once the judge processes it."
              : "The judge completed this run without returning extra console output."),
        },
      ]);
      setIsConsoleOpen(true);

      if (isExecutionPending(run.status)) {
        void dispatch(pollJudgeRunThunk(run.id))
          .unwrap()
          .then((resolvedRun) => {
            if (isExecutionPending(resolvedRun.status)) {
              setConsoleEntries([
                {
                  tone: "muted",
                  message: `${buildTimeLabel()} > Judge run ${resolvedRun.id.slice(0, 8)} is still processing for ${activeLanguage.fileName}.`,
                },
                {
                  tone: "info",
                  message:
                    "The run is still queued in the backend. Keep this tab open or refresh the workspace shortly.",
                },
              ]);
              setIsConsoleOpen(true);
              return;
            }

            setConsoleEntries([
              {
                tone: "muted",
                message: `${buildTimeLabel()} > Judge run ${resolvedRun.id.slice(0, 8)} completed for ${activeLanguage.fileName}.`,
              },
              {
                tone: resolvedRun.verdict === "ACCEPTED" ? "success" : "info",
                message:
                  resolvedRun.verdict === "ACCEPTED"
                    ? activeLanguage.runSummary
                    : `Backend status: ${resolvedRun.status}${
                        resolvedRun.verdict ? ` / ${resolvedRun.verdict}` : ""
                      }.`,
              },
              {
                tone: resolvedRun.verdict === "ACCEPTED" ? "success" : "info",
                message:
                  resolvedRun.stdout?.trim() ||
                  resolvedRun.stderr?.trim() ||
                  resolvedRun.compileOutput?.trim() ||
                  "The judge completed this run without returning extra console output.",
              },
            ]);
          })
          .catch((error) => {
            setConsoleEntries([
              {
                tone: "muted",
                message: `${buildTimeLabel()} > Run tracking failed for ${activeLanguage.fileName}.`,
              },
              {
                tone: "warning",
                message:
                  error instanceof Error
                    ? error.message
                    : "Unable to refresh this run right now.",
              },
            ]);
            setIsConsoleOpen(true);
          });
      }
    } catch (error) {
      setConsoleEntries([
        {
          tone: "muted",
          message: `${buildTimeLabel()} > Run failed for ${activeLanguage.fileName}.`,
        },
        {
          tone: "warning",
          message:
            error instanceof Error
              ? error.message
              : "Unable to start this run right now.",
        },
      ]);
      setIsConsoleOpen(true);
    }
  }

  async function handleSubmit() {
    try {
      const submission = await dispatch(
        createSubmissionThunk({
          sourceCode: currentCode,
          languageId: activeLanguage.id,
          stdin: studentCodeExercise.examples[0]?.input,
          expectedOutput: studentCodeExercise.examples[0]?.output,
        }),
      ).unwrap();

      setConsoleEntries([
        {
          tone: "muted",
          message: `${buildTimeLabel()} > Submission ${submission.id.slice(0, 8)} ${
            isExecutionPending(submission.status) ? "queued" : "evaluated"
          } for ${activeLanguage.fileName}.`,
        },
        {
          tone: submission.verdict === "ACCEPTED" ? "success" : "info",
          message:
            submission.verdict === "ACCEPTED"
              ? activeLanguage.submitSummary
              : `Backend status: ${submission.status}${
                  submission.verdict ? ` / ${submission.verdict}` : ""
                }.`,
        },
        {
          tone: submission.verdict === "ACCEPTED" ? "success" : "info",
          message:
            submission.stdout?.trim() ||
            submission.stderr?.trim() ||
            submission.compileOutput?.trim() ||
            (isExecutionPending(submission.status)
              ? "The submission is stored in the backend and is waiting for evaluation."
              : "The secured test suite finished without extra console output."),
        },
      ]);
      setIsConsoleOpen(true);

      if (isExecutionPending(submission.status)) {
        void dispatch(pollSubmissionThunk(submission.id))
          .unwrap()
          .then((resolvedSubmission) => {
            if (isExecutionPending(resolvedSubmission.status)) {
              setConsoleEntries([
                {
                  tone: "muted",
                  message: `${buildTimeLabel()} > Submission ${resolvedSubmission.id.slice(0, 8)} is still processing for ${activeLanguage.fileName}.`,
                },
                {
                  tone: "info",
                  message:
                    "The secured test suite is still running in the backend. Keep this tab open or refresh again shortly.",
                },
              ]);
              setIsConsoleOpen(true);
              return;
            }

            setConsoleEntries([
              {
                tone: "muted",
                message: `${buildTimeLabel()} > Submission ${resolvedSubmission.id.slice(0, 8)} evaluated for ${activeLanguage.fileName}.`,
              },
              {
                tone:
                  resolvedSubmission.verdict === "ACCEPTED"
                    ? "success"
                    : "info",
                message:
                  resolvedSubmission.verdict === "ACCEPTED"
                    ? activeLanguage.submitSummary
                    : `Backend status: ${resolvedSubmission.status}${
                        resolvedSubmission.verdict
                          ? ` / ${resolvedSubmission.verdict}`
                          : ""
                      }.`,
              },
              {
                tone:
                  resolvedSubmission.verdict === "ACCEPTED"
                    ? "success"
                    : "info",
                message:
                  resolvedSubmission.stdout?.trim() ||
                  resolvedSubmission.stderr?.trim() ||
                  resolvedSubmission.compileOutput?.trim() ||
                  "The secured test suite finished without extra console output.",
              },
            ]);
            setIsConsoleOpen(true);
          })
          .catch((error) => {
            setConsoleEntries([
              {
                tone: "muted",
                message: `${buildTimeLabel()} > Submission tracking failed for ${activeLanguage.fileName}.`,
              },
              {
                tone: "warning",
                message:
                  error instanceof Error
                    ? error.message
                    : "Unable to refresh this submission right now.",
              },
            ]);
            setIsConsoleOpen(true);
          });
      }
    } catch (error) {
      setConsoleEntries([
        {
          tone: "muted",
          message: `${buildTimeLabel()} > Submission failed for ${activeLanguage.fileName}.`,
        },
        {
          tone: "warning",
          message:
            error instanceof Error
              ? error.message
              : "Unable to submit this solution right now.",
        },
      ]);
      setIsConsoleOpen(true);
    }
  }

  function handleReset() {
    setCodeByLanguage((current) => ({
      ...current,
      [activeLanguage.id]: activeLanguage.starterCode,
    }));
    setConsoleEntries([
      {
        tone: "muted",
        message: `${buildTimeLabel()} > Restored ${activeLanguage.fileName} to the starter template.`,
      },
      {
        tone: "info",
        message: "Your drafts in the other languages stayed untouched.",
      },
    ]);
  }

  function renderProblemTab() {
    if (activeProblemTab === "examples") {
      return (
        <div className={styles.codeStudioExampleStack}>
          {studentCodeExercise.examples.map((example) => (
            <article
              key={example.title}
              className={styles.codeStudioExampleCard}
            >
              <div className={styles.codeStudioSectionHead}>
                <h3>{example.title}</h3>
              </div>
              <div className={styles.codeStudioExampleBlock}>
                <strong>Input</strong>
                <code>{example.input}</code>
              </div>
              <div className={styles.codeStudioExampleBlock}>
                <strong>Output</strong>
                <code>{example.output}</code>
              </div>
              <p>{example.explanation}</p>
            </article>
          ))}
        </div>
      );
    }

    if (activeProblemTab === "constraints") {
      return (
        <div className={styles.codeStudioConstraintStack}>
          <div className={styles.codeStudioLimitGrid}>
            <article className={styles.codeStudioLimitCard}>
              <span>Time limit</span>
              <strong>{studentCodeExercise.timeLimit}</strong>
            </article>
            <article className={styles.codeStudioLimitCard}>
              <span>Memory</span>
              <strong>{studentCodeExercise.memoryLimit}</strong>
            </article>
            <article className={styles.codeStudioLimitCard}>
              <span>Acceptance</span>
              <strong>{studentCodeExercise.acceptanceRate}</strong>
            </article>
          </div>

          <ul className={styles.codeStudioBulletList}>
            {studentCodeExercise.constraints.map((constraint) => (
              <li key={constraint}>{constraint}</li>
            ))}
          </ul>
        </div>
      );
    }

    if (activeProblemTab === "hints") {
      return (
        <div className={styles.codeStudioHintStack}>
          {studentCodeExercise.hints.map((hint, index) => (
            <article key={hint} className={styles.codeStudioHintCard}>
              <span>Hint {index + 1}</span>
              <p>{hint}</p>
            </article>
          ))}
        </div>
      );
    }

    return (
      <div className={styles.codeStudioDescriptionStack}>
        <p className={styles.codeStudioLeadCopy}>
          {studentCodeExercise.description}
        </p>
        <p className={styles.codeStudioBodyCopy}>
          {studentCodeExercise.detail}
        </p>

        <figure className={styles.codeStudioDiagramCard}>
          <Image
            alt={studentCodeExercise.diagramAlt}
            className={styles.codeStudioDiagram}
            height={720}
            sizes="(max-width: 1200px) 100vw, 40vw"
            src={studentCodeExercise.diagramUrl}
            width={1280}
          />
          <figcaption>{studentCodeExercise.diagramCaption}</figcaption>
        </figure>

        <div className={styles.codeStudioTagRow}>
          {studentCodeExercise.tags.map((tag) => (
            <span key={tag} className={styles.codeStudioTag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.codeStudioShell}>
      <header className={styles.codeStudioTopbar}>
        <div className={styles.codeStudioTopbarCopy}>
          <div className={styles.codeStudioHeadingRow}>
            <h1>{studentCodeExercise.title}</h1>
            <span className={styles.codeStudioDifficultyPill}>
              {studentCodeExercise.difficulty}
            </span>
          </div>
          {editorErrorMessage ? (
            <p className={`${styles.heroSub} ${styles.messageError}`}>{editorErrorMessage}</p>
          ) : null}
        </div>

        <div className={styles.codeStudioTopbarActions}>
          <Link className={styles.codeStudioBackLink} href="/student/courses">
            Back to courses
          </Link>
        </div>
      </header>

      <div
        className={`${styles.codeStudioLayout} ${
          isEditorFocus ? styles.codeStudioLayoutEditorFocus : ""
        }`}
      >
        {!isEditorFocus ? (
          <section className={styles.codeStudioProblemPanel}>
            <div className={styles.codeStudioDocTabs}>
              {problemTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={
                    activeProblemTab === tab.id
                      ? styles.codeStudioDocTabActive
                      : styles.codeStudioDocTab
                  }
                  onClick={() => setActiveProblemTab(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className={styles.codeStudioProblemBody}>
              {renderProblemTab()}
            </div>
          </section>
        ) : null}

        <section className={styles.codeStudioEditorPanel}>
          <header className={styles.codeStudioEditorHeader}>
            <div className={styles.codeStudioEditorHeaderPrimary}>
              <div className={styles.codeStudioFileTabs}>
                {fileItems.map((file) => (
                  <button
                    key={file.id}
                    className={
                      activeFile === file.id
                        ? styles.codeStudioFileTabActive
                        : styles.codeStudioFileTab
                    }
                    onClick={() => setActiveFile(file.id)}
                    type="button"
                  >
                    {file.label}
                  </button>
                ))}
              </div>

              <button
                aria-label={
                  isEditorFocus ? "Restore split view" : "Expand editor and hide brief"
                }
                aria-pressed={isEditorFocus}
                className={
                  isEditorFocus
                    ? styles.codeStudioEditorFocusButtonActive
                    : styles.codeStudioEditorFocusButton
                }
                onClick={() => setIsEditorFocus((current) => !current)}
                title={isEditorFocus ? "Restore split view" : "Expand editor"}
                type="button"
              >
                <EditorFocusToggleIcon isActive={isEditorFocus} />
              </button>
            </div>

            <div className={styles.codeStudioEditorActions}>
              <label className={styles.codeStudioLanguageSelectWrap}>
                <span>Language</span>
                <select
                  className={styles.codeStudioLanguageSelect}
                  onChange={(event) =>
                    handleLanguageChange(
                      event.target.value as StudentCodingLanguageId,
                    )
                  }
                  value={resolvedActiveLanguageId}
                >
                  {studentCodeExercise.languages.map((language) => (
                    <option key={language.id} value={language.id}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                className={styles.codeStudioGhostButton}
                onClick={handleReset}
                type="button"
              >
                Reset starter
              </button>
              <button
                className={styles.codeStudioRunButton}
                onClick={() => void handleRun()}
                type="button"
              >
                {runStatus === "loading" ? "Running..." : "Run"}
              </button>
              <button
                className={styles.codeStudioSubmitButton}
                onClick={() => void handleSubmit()}
                type="button"
              >
                {submitStatus === "loading" ? "Submitting..." : "Submit"}
              </button>
            </div>
          </header>

          <div
            className={`${styles.codeStudioEditorShell} ${
              isEditorFocus ? styles.codeStudioEditorShellFocus : ""
            }`}
          >
            {!isEditorFocus ? (
              <aside className={styles.codeStudioExplorer}>
                <div className={styles.codeStudioExplorerHead}>
                  <span>Workspace</span>
                  <strong>{activeLanguage.runtime}</strong>
                </div>

                <div className={styles.codeStudioExplorerList}>
                  {fileItems.map((file) => (
                    <button
                      key={file.id}
                      className={
                        activeFile === file.id
                          ? styles.codeStudioExplorerItemActive
                          : styles.codeStudioExplorerItem
                      }
                      onClick={() => setActiveFile(file.id)}
                      type="button"
                    >
                      <strong>{file.label}</strong>
                      <span>{file.meta}</span>
                    </button>
                  ))}
                </div>

                <div className={styles.codeStudioExplorerSummary}>
                  <span>Tracked tests</span>
                  <strong>
                    {
                      studentCodeExercise.tests.filter(
                        (testCase) => testCase.status === "passed",
                      ).length
                    }
                    /{studentCodeExercise.tests.length}
                  </strong>
                </div>
              </aside>
            ) : null}

            <div className={styles.codeStudioWorkspace}>
              {activeFile === "tests" ? (
                <div className={styles.codeStudioTestsView}>
                  <div className={styles.codeStudioTestsHead}>
                    <h2>Execution matrix</h2>
                    <p>
                      Review the cases you should satisfy before final
                      submission.
                    </p>
                  </div>

                  <div className={styles.codeStudioTestsList}>
                    {studentCodeExercise.tests.map((testCase) => (
                      <article
                        key={testCase.label}
                        className={styles.codeStudioTestCard}
                      >
                        <div className={styles.codeStudioTestHeader}>
                          <strong>{testCase.label}</strong>
                          <span
                            className={`${styles.codeStudioTestStatus} ${
                              testCase.status === "passed"
                                ? styles.codeStudioTestStatusPassed
                                : testCase.status === "warning"
                                  ? styles.codeStudioTestStatusWarning
                                  : styles.codeStudioTestStatusPending
                            }`}
                          >
                            {testCase.status}
                          </span>
                        </div>
                        <p>{testCase.detail}</p>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.codeStudioEditorCanvas}>
                  <StudentMonacoEditor
                    language={monacoLanguage}
                    onChange={handleCodeChange}
                    path={monacoPath}
                    value={currentCode}
                    wordWrap="off"
                  />
                </div>
              )}

              {isConsoleOpen ? (
                <section className={styles.codeStudioConsole}>
                  <div className={styles.codeStudioConsoleHeader}>
                    <span>Execution console</span>
                    <button
                      className={styles.codeStudioConsoleButton}
                      onClick={() => setConsoleEntries(studentCodeConsoleBoot)}
                      type="button"
                    >
                      Clear
                    </button>
                  </div>

                  <div className={styles.codeStudioConsoleBody}>
                    {consoleEntries.map((entry, index) => (
                      <p
                        key={`${entry.message}-${index}`}
                        className={`${styles.codeStudioConsoleLine} ${
                          entry.tone === "success"
                            ? styles.codeStudioConsoleSuccess
                            : entry.tone === "warning"
                              ? styles.codeStudioConsoleWarning
                              : entry.tone === "info"
                                ? styles.codeStudioConsoleInfo
                                : styles.codeStudioConsoleMuted
                        }`}
                      >
                        {entry.message}
                      </p>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </div>

          <footer className={styles.codeStudioStatusBar}>
            <button
              className={styles.codeStudioConsoleToggle}
              onClick={() => setIsConsoleOpen((current) => !current)}
              type="button"
            >
              {isConsoleOpen ? "Hide console" : "Show console"}
            </button>

            <div className={styles.codeStudioStatusMeta}>
              <span>{activeLanguage.label}</span>
              <span>{lineCount} lines</span>
              <span>{characterCount} chars</span>
              {latestRun ? <span>Run {latestRun.status}</span> : null}
              {latestSubmission ? (
                <span>Submission {latestSubmission.status}</span>
              ) : null}
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}
