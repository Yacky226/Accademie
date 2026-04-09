"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  fetchMyCourseLessonView,
  updateMyCourseProgress,
  type LessonCourseRecord,
} from "./lesson-view.client";
import styles from "./lesson-view.module.css";

function getEmbedUrl(videoUrl: string) {
  if (videoUrl.includes("youtube.com/watch?v=")) {
    return videoUrl.replace("watch?v=", "embed/");
  }

  if (videoUrl.includes("youtu.be/")) {
    return videoUrl.replace("youtu.be/", "www.youtube.com/embed/");
  }

  return videoUrl;
}

export function LessonViewPage({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonSlug = searchParams.get("lesson");
  const [course, setCourse] = useState<LessonCourseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const allLessons = useMemo(
    () => course?.modules.flatMap((module) => module.lessons) ?? [],
    [course],
  );
  const selectedLesson = useMemo(() => {
    if (allLessons.length === 0) {
      return null;
    }

    return allLessons.find((lesson) => lesson.slug === lessonSlug) ?? allLessons[0];
  }, [allLessons, lessonSlug]);
  const selectedModule = useMemo(
    () =>
      course?.modules.find((module) =>
        module.lessons.some((lesson) => lesson.id === selectedLesson?.id),
      ) ?? null,
    [course, selectedLesson?.id],
  );

  useEffect(() => {
    let isActive = true;

    async function loadCourse() {
      setLoading(true);

      try {
        const nextCourse = await fetchMyCourseLessonView(slug);
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
          error instanceof Error ? error.message : "Impossible de charger ce cours.",
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

  async function handleMarkAsCompleted() {
    if (!course || !selectedLesson) {
      return;
    }

    const lessonIndex = allLessons.findIndex((lesson) => lesson.id === selectedLesson.id);
    const nextProgress = ((lessonIndex + 1) / Math.max(allLessons.length, 1)) * 100;

    setMarking(true);
    try {
      const progressPercent = await updateMyCourseProgress(slug, nextProgress);
      setCourse((current) => (current ? { ...current, progressPercent } : current));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de marquer cette lecon.",
      );
    } finally {
      setMarking(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <section className={styles.player}>
          {loading ? <p style={{ padding: "1.2rem" }}>Chargement du cours...</p> : null}
          {errorMessage ? (
            <p style={{ padding: "1.2rem", color: "#ba1a1a" }}>{errorMessage}</p>
          ) : null}
          {course && selectedLesson ? (
            <>
              <div className={styles.video}>
                {selectedLesson.videoUrl ? (
                  selectedLesson.videoUrl.includes("youtube.com") ||
                  selectedLesson.videoUrl.includes("youtu.be") ? (
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      src={getEmbedUrl(selectedLesson.videoUrl)}
                      style={{ width: "100%", height: "100%", border: 0 }}
                      title={selectedLesson.title}
                    />
                  ) : (
                    <video
                      controls
                      src={selectedLesson.videoUrl}
                      style={{ width: "100%", height: "100%" }}
                    />
                  )
                ) : (
                  <div style={{ padding: "2rem", color: "#ffffff" }}>
                    Aucune video fournie pour cette lecon. Le contenu detaille reste disponible
                    ci-dessous.
                  </div>
                )}
              </div>
              <div className={styles.lessonInfo}>
                <p className={styles.kicker}>
                  {selectedModule?.title ?? "Cours"} - {selectedLesson.durationInMinutes ?? 0} min
                </p>
                <h1>{selectedLesson.title}</h1>
                <p>{selectedLesson.content || course.description}</p>
                <div className={styles.progress}>
                  <span style={{ width: `${course.progressPercent}%` }} />
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
                  <button
                    className={styles.play}
                    onClick={() => void handleMarkAsCompleted()}
                    type="button"
                  >
                    {marking ? "Mise a jour..." : "Marquer comme terminee"}
                  </button>
                  {selectedLesson.resourceUrl ? (
                    <Link
                      href={selectedLesson.resourceUrl}
                      style={{
                        alignSelf: "center",
                        color: "#1a73e8",
                        fontWeight: 700,
                        textDecoration: "underline",
                      }}
                      target="_blank"
                    >
                      Ouvrir la ressource du cours
                    </Link>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </section>

        <aside className={styles.sidebar}>
          <div>
            <h2>Timeline du cours</h2>
            <ul className={styles.playlist}>
              {course?.modules.map((module) =>
                module.lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    style={{
                      background: lesson.id === selectedLesson?.id ? "#eef4ff" : undefined,
                    }}
                  >
                    <button
                      onClick={() => {
                        const nextParams = new URLSearchParams(searchParams.toString());
                        nextParams.set("lesson", lesson.slug);
                        router.replace(`/student/courses/${slug}?${nextParams.toString()}`);
                      }}
                      style={{
                        display: "flex",
                        width: "100%",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "0.7rem",
                        border: 0,
                        background: "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        padding: 0,
                      }}
                      type="button"
                    >
                      <span>{lesson.title}</span>
                      <strong>
                        {lesson.durationInMinutes ? `${lesson.durationInMinutes}m` : "ouvrir"}
                      </strong>
                    </button>
                  </li>
                )),
              )}
            </ul>
          </div>
          <div>
            <h2>Ressources</h2>
            <ul className={styles.resources}>
              {selectedLesson?.resourceUrl ? (
                <li>
                  <Link href={selectedLesson.resourceUrl} target="_blank">
                    Telecharger la ressource du module
                  </Link>
                </li>
              ) : (
                <li>Aucune ressource pour cette lecon.</li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
