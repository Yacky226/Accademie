"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MarketingPageFrame } from "../marketing-site/MarketingPageFrame";
import { fetchCatalogCourses } from "./course-catalog.client";
import type { CatalogCourseRecord } from "./course-catalog.types";
import styles from "./course-catalog.module.css";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDurationLabel(hours: number | null) {
  return hours ? `${hours} heures` : "Duree flexible";
}

export function CourseCatalogPage() {
  const [courses, setCourses] = useState<CatalogCourseRecord[]>([]);
  const [query, setQuery] = useState("");
  const [activeLevel, setActiveLevel] = useState("Tous");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const levelFilters = useMemo(() => {
    const levels = Array.from(new Set(courses.map((course) => course.level)));
    return ["Tous", ...levels];
  }, [courses]);

  const visibleCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesLevel = activeLevel === "Tous" || course.level === activeLevel;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        course.title.toLowerCase().includes(normalizedQuery) ||
        course.shortDescription.toLowerCase().includes(normalizedQuery) ||
        course.mentorName.toLowerCase().includes(normalizedQuery);

      return matchesLevel && matchesQuery;
    });
  }, [activeLevel, courses, query]);
  const hasFiltersApplied = query.trim().length > 0 || activeLevel !== "Tous";

  useEffect(() => {
    let isActive = true;

    async function loadCatalog() {
      setLoading(true);

      try {
        const nextCourses = await fetchCatalogCourses();
        if (!isActive) {
          return;
        }

        setCourses(nextCourses);
        setErrorMessage(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Impossible de charger le catalogue.");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadCatalog();

    return () => {
      isActive = false;
    };
  }, []);

  function resetFilters() {
    setQuery("");
    setActiveLevel("Tous");
  }

  return (
    <MarketingPageFrame mainClassName={styles.main} pageClassName={styles.page}>
      <section className={styles.headingSection}>
        <div className={styles.headingRow}>
          <div>
            <span className={styles.pageEyebrow}>Course discovery</span>
            <h1 className={styles.pageTitle}>Catalogue des formations</h1>
          </div>
          <span className={styles.catalogCount}>{courses.length} formations publiees</span>
        </div>

        <label className={styles.contentSearchShell}>
          <input
            aria-label="Rechercher une formation"
            className={styles.contentSearchInput}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un cours, un mentor, un niveau..."
            value={query}
          />
        </label>

        <div className={styles.categoryFilters}>
          {levelFilters.map((level) => (
            <button
              key={level}
              aria-pressed={activeLevel === level}
              className={activeLevel === level ? styles.categoryFilterActive : styles.categoryFilter}
              onClick={() => setActiveLevel(level)}
              type="button"
            >
              {level}
            </button>
          ))}
        </div>

        {errorMessage ? <p className={styles.statusNoticeError}>{errorMessage}</p> : null}
      </section>

      <div className={styles.catalogLayout}>
        <aside className={styles.sidebar}>
          <section className={styles.sidebarGroup}>
            <h2 className={styles.sidebarTitle}>Etat du catalogue</h2>
            <div className={styles.fieldStack}>
              <span>{loading ? "Chargement..." : `${visibleCourses.length} formation(s) visibles`}</span>
              <span>{courses.length} cours au total</span>
            </div>
          </section>

          <section className={styles.sidebarGroup}>
            <h2 className={styles.sidebarTitle}>Par niveau</h2>
            <div className={styles.fieldStack}>
              {levelFilters.map((level) => (
                <label className={styles.optionLabel} key={level}>
                  <input
                    checked={activeLevel === level}
                    onChange={() => setActiveLevel(level)}
                    type="radio"
                  />
                  <span>{level}</span>
                </label>
              ))}
            </div>
          </section>
        </aside>

        <section className={styles.catalogContent}>
          {!loading && visibleCourses.length === 0 ? (
            <div className={styles.emptyStateWrap}>
              <article className={styles.emptyState}>
                <h2>{errorMessage ? "Catalogue temporairement indisponible" : "Aucune formation trouvee"}</h2>
                <p>
                  {errorMessage
                    ? "Le catalogue n a pas pu etre charge pour le moment. Vous pouvez reessayer ou contacter l equipe."
                    : "Essayez un autre mot-cle ou changez le filtre de niveau pour elargir les resultats."}
                </p>
                <div className={styles.emptyStateActions}>
                  {hasFiltersApplied ? (
                    <button className={styles.categoryFilter} onClick={resetFilters} type="button">
                      Reinitialiser les filtres
                    </button>
                  ) : null}
                  <Link className={styles.categoryFilterActive} href="/contact">
                    Parler a l equipe
                  </Link>
                </div>
              </article>
            </div>
          ) : (
            <div className={styles.grid}>
              {visibleCourses.map((course) => (
                <Link className={styles.card} href={`/formations/${course.slug}`} key={course.id}>
                  <div className={styles.cardMedia}>
                    {course.thumbnailUrl ? (
                      <Image
                        alt={course.title}
                        className={styles.cardImage}
                        height={720}
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        src={course.thumbnailUrl}
                        width={1280}
                      />
                    ) : (
                      <div className={styles.cardImage} style={{ background: "linear-gradient(135deg, #dbe7ff, #eef4ff)" }} />
                    )}
                    <span className={styles.cardCategory}>{course.categoryLabel}</span>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardHeading}>
                      <h2 className={styles.cardTitle}>{course.title}</h2>
                    </div>

                    <div className={styles.mentorRow}>
                      <span className={styles.mentorName}>Par {course.mentorName}</span>
                    </div>

                    <p className={styles.cardDescription}>{course.shortDescription}</p>

                    <div className={styles.cardFooter}>
                      <div className={styles.priceBlock}>
                        <span className={styles.priceValue}>
                          {formatCurrency(course.price, course.currency)}
                        </span>
                        <span className={styles.priceLabel}>{getDurationLabel(course.durationInHours)}</span>
                      </div>

                      <div className={styles.cardMeta}>
                        <span className={styles.qualityBadge}>{course.enrollmentsCount} inscrits</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </MarketingPageFrame>
  );
}
