"use client";

import { useState } from "react";
import { MarketingPageFrame } from "../marketing-site/MarketingPageFrame";
import {
  catalogCourses,
  catalogFilters,
  catalogTotalCourses,
} from "./course-catalog.data";
import styles from "./course-catalog.module.css";

type CatalogIconName =
  | "bookmark"
  | "chevronLeft"
  | "chevronRight"
  | "search"
  | "star";

interface CatalogIconProps {
  name: CatalogIconName;
  className?: string;
  filled?: boolean;
}

const paginationItems = [1, 2, 3, "ellipsis", 12] as const;
const difficultyOptions = [
  { label: "Easy", checked: false },
  { label: "Medium", checked: true },
  { label: "Hard", checked: false },
] as const;
const durationOptions = ["Under 10 Hours", "10 - 40 Hours", "40+ Hours"] as const;

function CatalogIcon({ className, filled = false, name }: CatalogIconProps) {
  const commonProps = {
    "aria-hidden": true,
    className,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "search":
      return (
        <svg {...commonProps}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16L20 20" />
        </svg>
      );
    case "bookmark":
      return (
        <svg {...commonProps}>
          <path d="M8 4.5h8A1.5 1.5 0 0 1 17.5 6v13l-5.5-3.5L6.5 19V6A1.5 1.5 0 0 1 8 4.5Z" />
        </svg>
      );
    case "star":
      if (filled) {
        return (
          <svg
            aria-hidden
            className={className}
            fill="currentColor"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth={1}
            viewBox="0 0 24 24"
          >
            <path d="M12 3.8l2.6 5.28 5.83.85-4.22 4.12 1 5.8L12 17.1l-5.21 2.75 1-5.8-4.21-4.12 5.82-.85L12 3.8Z" />
          </svg>
        );
      }

      return (
        <svg {...commonProps}>
          <path d="M12 3.8l2.6 5.28 5.83.85-4.22 4.12 1 5.8L12 17.1l-5.21 2.75 1-5.8-4.21-4.12 5.82-.85L12 3.8Z" />
        </svg>
      );
    case "chevronLeft":
      return (
        <svg {...commonProps}>
          <path d="M14.5 6.5L9 12l5.5 5.5" />
        </svg>
      );
    case "chevronRight":
      return (
        <svg {...commonProps}>
          <path d="M9.5 6.5L15 12l-5.5 5.5" />
        </svg>
      );
  }
}

export function CourseCatalogPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(
    catalogFilters.find((filter) => filter.active)?.label ?? "All Modules",
  );

  const normalizedQuery = query.trim().toLowerCase();
  const visibleCourses = catalogCourses.filter((course) => {
    const categoryMatches =
      activeFilter === "All Modules" || course.category.toLowerCase() === activeFilter.toLowerCase();
    const textMatches =
      normalizedQuery.length === 0 ||
      course.title.toLowerCase().includes(normalizedQuery) ||
      course.mentor.toLowerCase().includes(normalizedQuery) ||
      course.category.toLowerCase().includes(normalizedQuery);

    return categoryMatches && textMatches;
  });

  return (
    <MarketingPageFrame mainClassName={styles.main} pageClassName={styles.page}>
      <section className={styles.headingSection}>
        <div className={styles.headingRow}>
          <div>
            <span className={styles.pageEyebrow}>Course discovery</span>
            <h1 className={styles.pageTitle}>Engineering Catalog</h1>
          </div>
          <span className={styles.catalogCount}>{catalogTotalCourses} courses available</span>
        </div>

        <label className={styles.contentSearchShell}>
          <CatalogIcon className={styles.contentSearchIcon} name="search" />
          <input
            aria-label="Search architecture"
            className={styles.contentSearchInput}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search modules, mentors, technologies..."
            value={query}
          />
        </label>

        <div className={styles.categoryFilters}>
          {catalogFilters.map((filter) => (
            <button
              key={filter.label}
              aria-pressed={activeFilter === filter.label}
              className={
                activeFilter === filter.label ? styles.categoryFilterActive : styles.categoryFilter
              }
              onClick={() => setActiveFilter(filter.label)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <div className={styles.catalogLayout}>
        <aside className={styles.sidebar}>
          <section className={styles.sidebarGroup}>
            <h2 className={styles.sidebarTitle}>Difficulty Level</h2>
            <div className={styles.fieldStack}>
              {difficultyOptions.map((option) => (
                <label className={styles.optionLabel} key={option.label}>
                  <input defaultChecked={option.checked} type="checkbox" />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className={styles.sidebarGroup}>
            <h2 className={styles.sidebarTitle}>Course Duration</h2>
            <div className={styles.fieldStack}>
              {durationOptions.map((option) => (
                <label className={styles.optionLabel} key={option}>
                  <input name="duration" type="radio" />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </section>

          <section className={styles.sidebarGroup}>
            <h2 className={styles.sidebarTitle}>Price Range</h2>
            <div className={styles.rangeBlock}>
              <input
                aria-label="Maximum price"
                className={styles.rangeInput}
                defaultValue={58}
                max={100}
                min={0}
                type="range"
              />
              <div className={styles.rangeLegend}>
                <span>$0</span>
                <span>$500</span>
              </div>
            </div>
          </section>

          <section className={styles.sidebarGroup}>
            <h2 className={styles.sidebarTitle}>Minimum Rating</h2>
            <div className={styles.ratingThreshold}>
              {[0, 1, 2, 3].map((index) => (
                <CatalogIcon className={styles.ratingThresholdIcon} filled key={index} name="star" />
              ))}
              <CatalogIcon className={styles.ratingThresholdIcon} name="star" />
              <span className={styles.ratingThresholdLabel}>&amp; up</span>
            </div>
          </section>
        </aside>

        <section className={styles.catalogContent}>
          <div className={styles.grid}>
            {visibleCourses.map((course) => (
              <article className={styles.card} key={course.title}>
                <div className={styles.cardMedia}>
                  <img alt={course.imageAlt} className={styles.cardImage} src={course.imageUrl} />
                  <span className={styles.cardCategory}>{course.category}</span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardHeading}>
                    <h2 className={styles.cardTitle}>{course.title}</h2>
                    <button
                      aria-label={`Save ${course.title}`}
                      className={styles.bookmarkButton}
                      type="button"
                    >
                      <CatalogIcon className={styles.bookmarkIcon} name="bookmark" />
                    </button>
                  </div>

                  <div className={styles.mentorRow}>
                    <img
                      alt={course.mentorAvatarAlt}
                      className={styles.mentorAvatar}
                      src={course.mentorAvatarUrl}
                    />
                    <span className={styles.mentorName}>{course.mentor}</span>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.priceBlock}>
                      <span className={styles.priceValue}>{course.price}</span>
                      <span className={styles.priceLabel}>{course.paymentLabel}</span>
                    </div>

                    <div className={styles.cardMeta}>
                      <span className={styles.qualityBadge}>{course.qualityBadge}</span>
                      <div className={styles.ratingRow}>
                        <CatalogIcon className={styles.cardRatingIcon} filled name="star" />
                        <span className={styles.ratingValue}>{course.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {visibleCourses.length === 0 ? (
              <article className={styles.emptyState}>
                <h2>No course found</h2>
                <p>Try another keyword or switch category filters.</p>
              </article>
            ) : null}
          </div>

          {visibleCourses.length > 0 ? (
            <nav aria-label="Catalog pagination" className={styles.pagination}>
              <button
                aria-label="Previous page"
                className={styles.paginationArrow}
                type="button"
              >
                <CatalogIcon className={styles.paginationIcon} name="chevronLeft" />
              </button>

              {paginationItems.map((item) =>
                item === "ellipsis" ? (
                  <span className={styles.paginationDots} key={item}>
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    aria-current={item === 1 ? "page" : undefined}
                    className={item === 1 ? styles.paginationActive : styles.paginationButton}
                    type="button"
                  >
                    {item}
                  </button>
                ),
              )}

              <button aria-label="Next page" className={styles.paginationArrow} type="button">
                <CatalogIcon className={styles.paginationIcon} name="chevronRight" />
              </button>
            </nav>
          ) : null}
        </section>
      </div>
    </MarketingPageFrame>
  );
}
