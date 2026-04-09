"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentAuthSession } from "@/features/auth/model/useCurrentAuthSession";
import { MarketingPageFrame } from "@/features/marketing-site/MarketingPageFrame";
import { fetchCatalogCourseBySlug } from "./course-catalog.client";
import type { CatalogCourseDetailRecord } from "./course-catalog.types";
import styles from "./course-catalog.module.css";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CourseDetailsPage({ slug }: { slug: string }) {
  const { isAuthenticated } = useCurrentAuthSession();
  const [course, setCourse] = useState<CatalogCourseDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadCourse() {
      setLoading(true);

      try {
        const nextCourse = await fetchCatalogCourseBySlug(slug);
        if (!isActive) {
          return;
        }

        setCourse(nextCourse);
        setErrorMessage(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger cette formation.",
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadCourse();

    return () => {
      isActive = false;
    };
  }, [slug]);

  return (
    <MarketingPageFrame mainClassName={styles.main} pageClassName={styles.page}>
      {loading ? <p style={{ marginTop: 120 }}>Chargement de la formation...</p> : null}
      {errorMessage ? <p style={{ marginTop: 120, color: "#ba1a1a" }}>{errorMessage}</p> : null}
      {course ? (
        <div className={styles.detailStack}>
          <section className={styles.detailHero}>
            <article className={styles.detailPrimaryCard}>
              {course.thumbnailUrl ? (
                <Image
                  alt={course.title}
                  className={styles.detailHeroImage}
                  height={800}
                  src={course.thumbnailUrl}
                  width={1400}
                />
              ) : (
                <div className={styles.detailHeroPlaceholder} />
              )}
              <div className={styles.detailBody}>
                <span className={styles.pageEyebrow}>{course.level}</span>
                <h1 className={`${styles.pageTitle} ${styles.detailTitle}`}>{course.title}</h1>
                <p className={styles.detailLead}>{course.description}</p>
                <div className={styles.detailMetaRow}>
                  <span className={styles.catalogCount}>{course.enrollmentsCount} inscrits</span>
                  <span className={styles.catalogCount}>{course.durationInHours ?? "Flexible"} heures</span>
                  <span className={styles.catalogCount}>Par {course.mentorName}</span>
                </div>
              </div>
            </article>

            <aside className={styles.detailAsideCard}>
              <div>
                <span className={styles.sidebarTitle}>Souscription</span>
                <h2 className={styles.detailAsideTitle}>{formatCurrency(course.price, course.currency)}</h2>
                <p className={styles.detailAsideCopy}>
                  Acces au contenu publie, aux ressources et au parcours etudiant.
                </p>
              </div>

              <Link
                className={styles.detailActionLink}
                href={`/checkout?mode=course&slug=${encodeURIComponent(course.slug)}`}
              >
                Souscrire a cette formation
              </Link>
              {isAuthenticated ? (
                <Link
                  className={styles.detailActionSecondary}
                  href={`/student/courses/${course.slug}`}
                >
                  Ouvrir mon espace cours
                </Link>
              ) : (
                <Link
                  className={styles.detailActionSecondary}
                  href={`/auth/login?redirect=${encodeURIComponent(`/checkout?mode=course&slug=${course.slug}`)}`}
                >
                  Se connecter pour acheter
                </Link>
              )}
            </aside>
          </section>

          <section className={styles.detailProgramSection}>
            <h2 className={styles.detailProgramTitle}>Programme du cours</h2>
            <div className={styles.detailProgramList}>
              {course.modules.map((module) => (
                <article className={styles.detailProgramCard} key={module.id}>
                  <div className={styles.detailProgramHeader}>
                    <strong>{module.title}</strong>
                    <span className={styles.catalogCount}>{module.lessons.length} lecons</span>
                  </div>
                  <p className={styles.detailProgramCopy}>
                    {module.description || "Module publie pour les apprenants."}
                  </p>
                  <ul className={styles.detailLessonList}>
                    {module.lessons.map((lesson) => (
                      <li key={lesson.id}>
                        {lesson.title}
                        {lesson.durationInMinutes ? ` · ${lesson.durationInMinutes} min` : ""}
                        {lesson.isFreePreview ? " · Apercu gratuit" : ""}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </MarketingPageFrame>
  );
}
