"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  useRouter,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";
import { fetchStudentProblemLibrary } from "@/features/student-code-editor/api/student-code-editor.service";
import type {
  StudentCodingDifficulty,
  StudentCodingDifficultyFilter,
  StudentCodingProblemSummary,
} from "@/features/student-code-editor/model/student-code-editor.contracts";
import { StudentCodeEditorWorkspace } from "../components/StudentCodeEditorWorkspace";
import { StudentShell } from "../components/StudentShell";
import styles from "../student-space.module.css";

const PROBLEMS_PER_PAGE = 6;
const difficultyFilters: Array<{
  id: StudentCodingDifficultyFilter;
  label: string;
}> = [
  { id: "all", label: "Tous" },
  { id: "Facile", label: "Facile" },
  { id: "Intermediaire", label: "Intermediaire" },
  { id: "Difficile", label: "Difficile" },
];

function parseDifficultyFilter(
  value: string | null,
): StudentCodingDifficultyFilter {
  if (
    value === "Facile" ||
    value === "Intermediaire" ||
    value === "Difficile"
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

function normalizeDifficulty(
  difficulty: string,
): StudentCodingDifficulty {
  const normalizedDifficulty = difficulty.trim().toLowerCase();

  if (normalizedDifficulty === "facile" || normalizedDifficulty === "easy") {
    return "Facile";
  }

  if (
    normalizedDifficulty === "difficile" ||
    normalizedDifficulty === "hard"
  ) {
    return "Difficile";
  }

  return "Intermediaire";
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

function buildProblemsHref(
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
  return nextQuery ? `/student/problems?${nextQuery}` : "/student/problems";
}

function ProblemLibraryLoadingState() {
  return (
    <section className={styles.problemLibraryListPanel}>
      <div className={styles.problemLibraryListHeader}>
        <span className={styles.problemLibraryListHeaderCell}>Probleme</span>
        <span
          className={`${styles.problemLibraryListHeaderCell} ${styles.problemLibraryListHeaderCellCentered}`}
        >
          Difficulte
        </span>
        <span
          className={`${styles.problemLibraryListHeaderCell} ${styles.problemLibraryListHeaderCellCentered}`}
        >
          Categorie
        </span>
        <span
          className={`${styles.problemLibraryListHeaderCell} ${styles.problemLibraryListHeaderCellEnd}`}
        >
          Action
        </span>
      </div>

      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={`problem-skeleton-${index + 1}`}
          className={`${styles.problemLibraryListRow} ${styles.problemLibraryListRowSkeleton}`}
        >
          <div className={styles.problemLibraryListMain}>
            <span className={styles.problemLibrarySkeletonTitle} />
          </div>
          <div
            className={`${styles.problemLibraryListCell} ${styles.problemLibraryListCellCentered} ${styles.problemLibraryListDifficulty}`}
          >
            <span className={styles.problemLibrarySkeletonBadge} />
          </div>
          <div
            className={`${styles.problemLibraryListCell} ${styles.problemLibraryListCellCentered} ${styles.problemLibraryListCategory}`}
          >
            <span className={styles.problemLibrarySkeletonBadge} />
          </div>
          <div className={styles.problemLibraryListAction}>
            <span className={styles.problemLibrarySkeletonButton} />
          </div>
        </div>
      ))}
    </section>
  );
}

export function StudentCodeEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRouting, startRouting] = useTransition();
  const [problems, setProblems] = useState<StudentCodingProblemSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "succeeded" | "failed">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedProblemSlug = searchParams.get("problem")?.trim() || null;
  const activeDifficultyFilter = parseDifficultyFilter(
    searchParams.get("difficulty"),
  );
  const requestedPage = parsePageNumber(searchParams.get("page"));

  useEffect(() => {
    if (selectedProblemSlug) {
      return;
    }

    let isMounted = true;

    async function loadProblems() {
      try {
        setStatus("loading");
        const nextProblems = await fetchStudentProblemLibrary();
        if (!isMounted) {
          return;
        }

        setProblems(nextProblems);
        setErrorMessage(null);
        setStatus("succeeded");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger la bibliotheque de problemes.",
        );
        setProblems([]);
        setStatus("failed");
      }
    }

    void loadProblems();

    return () => {
      isMounted = false;
    };
  }, [selectedProblemSlug]);

  const difficultyCounts = useMemo(() => {
    return problems.reduce<Record<StudentCodingDifficulty, number>>(
      (counts, problem) => {
        const normalizedDifficulty = normalizeDifficulty(problem.difficulty);
        counts[normalizedDifficulty] += 1;
        return counts;
      },
      {
        Facile: 0,
        Intermediaire: 0,
        Difficile: 0,
      },
    );
  }, [problems]);

  const filteredProblems = useMemo(() => {
    if (activeDifficultyFilter === "all") {
      return problems;
    }

    return problems.filter(
      (problem) =>
        normalizeDifficulty(problem.difficulty) === activeDifficultyFilter,
    );
  }, [activeDifficultyFilter, problems]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProblems.length / PROBLEMS_PER_PAGE),
  );
  const currentPage = Math.min(requestedPage, totalPages);
  const paginatedProblems = filteredProblems.slice(
    (currentPage - 1) * PROBLEMS_PER_PAGE,
    currentPage * PROBLEMS_PER_PAGE,
  );
  const paginationItems = buildPaginationItems(totalPages, currentPage);
  const activeProblem = problems.find(
    (problem) =>
      problem.id === selectedProblemSlug || problem.slug === selectedProblemSlug,
  );
  const backToLibraryHref = buildProblemsHref(searchParams, {
    problem: null,
    page: String(currentPage),
  });

  function navigateToProblems(
    updates: Record<string, string | null | undefined>,
    mode: "push" | "replace" = "replace",
  ) {
    const nextHref = buildProblemsHref(searchParams, updates);

    startRouting(() => {
      if (mode === "push") {
        router.push(nextHref);
        return;
      }

      router.replace(nextHref);
    });
  }

  if (selectedProblemSlug) {
    return (
      <StudentShell
        activePath="/student/problems"
        hideFooter
        hideTopbar
        lockPageScroll
        topbarTitle={activeProblem?.title ?? "Code Studio"}
        widePage
      >
        <StudentCodeEditorWorkspace
          backHref={backToLibraryHref}
          backLabel="Back to problem list"
          problemSlug={selectedProblemSlug}
        />
      </StudentShell>
    );
  }

  return (
    <StudentShell
      activePath="/student/problems"
      topbarTitle="Code Editor"
      widePage
    >
      <div className={styles.problemLibraryShell}>
        <section className={styles.problemLibraryHeader}>
          <div className={styles.problemLibraryHeaderCopy}>
            <h1>Programming Problems</h1>
            <p>
              Choisissez un probleme dans la liste puis ouvrez-le avec
              <strong> Solve</strong>.
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
            <span className={styles.problemLibraryFilterLabel}>
              Difficultes
            </span>
            <div className={styles.problemLibraryFilterRow}>
              {difficultyFilters.map((filter) => {
                const count =
                  filter.id === "all"
                    ? problems.length
                    : difficultyCounts[filter.id];

                return (
                  <button
                    key={filter.id}
                    aria-pressed={activeDifficultyFilter === filter.id}
                    className={
                      activeDifficultyFilter === filter.id
                        ? styles.problemLibraryFilterChipActive
                        : styles.problemLibraryFilterChip
                    }
                    onClick={() =>
                      navigateToProblems({
                        difficulty: filter.id === "all" ? null : filter.id,
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

        {status === "loading" ? <ProblemLibraryLoadingState /> : null}

        {status === "succeeded" && paginatedProblems.length > 0 ? (
          <section className={styles.problemLibraryListPanel}>
            <div className={styles.problemLibraryListHeader}>
              <span className={styles.problemLibraryListHeaderCell}>
                Probleme
              </span>
              <span
                className={`${styles.problemLibraryListHeaderCell} ${styles.problemLibraryListHeaderCellCentered}`}
              >
                Difficulte
              </span>
              <span
                className={`${styles.problemLibraryListHeaderCell} ${styles.problemLibraryListHeaderCellCentered}`}
              >
                Categorie
              </span>
              <span
                className={`${styles.problemLibraryListHeaderCell} ${styles.problemLibraryListHeaderCellEnd}`}
              >
                Action
              </span>
            </div>

            {paginatedProblems.map((problem) => {
              const normalizedDifficulty = normalizeDifficulty(
                problem.difficulty,
              );

              return (
                <article
                  key={problem.id}
                  className={styles.problemLibraryListRow}
                >
                  <div className={styles.problemLibraryListMain}>
                    <h2>{problem.title}</h2>
                  </div>

                  <div
                    className={`${styles.problemLibraryListCell} ${styles.problemLibraryListCellCentered} ${styles.problemLibraryListDifficulty}`}
                  >
                    <span
                      className={
                        normalizedDifficulty === "Facile"
                          ? styles.problemLibraryDifficultyEasy
                          : normalizedDifficulty === "Difficile"
                            ? styles.problemLibraryDifficultyHard
                            : styles.problemLibraryDifficultyMedium
                      }
                    >
                      {normalizedDifficulty}
                    </span>
                  </div>

                  <div
                    className={`${styles.problemLibraryListCell} ${styles.problemLibraryListCellCentered} ${styles.problemLibraryListCategory}`}
                  >
                    <span className={styles.problemLibraryCategoryBadge}>
                      {problem.category}
                    </span>
                  </div>

                  <div className={styles.problemLibraryListAction}>
                    <button
                      className={styles.problemLibrarySolveButton}
                      onClick={() =>
                        navigateToProblems(
                          {
                            page: String(currentPage),
                            problem: problem.slug,
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

        {status === "succeeded" && filteredProblems.length === 0 ? (
          <section className={styles.problemLibraryEmptyState}>
            <h2>Aucun probleme ne correspond a ce filtre</h2>
            <p>
              Essayez un autre niveau pour afficher davantage de challenges dans
              la bibliotheque.
            </p>
            <button
              className={styles.problemLibraryResetButton}
              onClick={() =>
                navigateToProblems({
                  difficulty: null,
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
            <h2>La bibliotheque est temporairement indisponible</h2>
            <p>
              Rechargez cette page dans quelques instants pour reessayer.
            </p>
          </section>
        ) : null}

        {status === "succeeded" && filteredProblems.length > 0 ? (
          <nav
            aria-label="Pagination des problemes"
            className={styles.problemLibraryPagination}
          >
            <button
              className={styles.problemLibraryPaginationButton}
              disabled={currentPage === 1 || isRouting}
              onClick={() =>
                navigateToProblems({
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
                    key={`page-${item}`}
                    aria-current={item === currentPage ? "page" : undefined}
                    className={
                      item === currentPage
                        ? styles.problemLibraryPaginationButtonActive
                        : styles.problemLibraryPaginationButton
                    }
                    disabled={isRouting}
                    onClick={() =>
                      navigateToProblems({
                        page: String(item),
                      })
                    }
                    type="button"
                  >
                    {item}
                  </button>
                ) : (
                  <span
                    key={item}
                    className={styles.problemLibraryPaginationDots}
                  >
                    ...
                  </span>
                ),
              )}
            </div>

            <button
              className={styles.problemLibraryPaginationButton}
              disabled={currentPage === totalPages || isRouting}
              onClick={() =>
                navigateToProblems({
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
