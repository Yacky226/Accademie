"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCurrentAuthSession } from "@/features/auth/model/useCurrentAuthSession";
import {
  createWorkspaceCourse,
  createWorkspaceCourseLesson,
  createWorkspaceCourseModule,
  fetchWorkspaceCourses,
  uploadWorkspaceCourseThumbnail,
} from "@/features/workspace-data/api/workspace-api.client";
import type {
  CreateWorkspaceCoursePayload,
  CreateWorkspaceLessonPayload,
  CreateWorkspaceModulePayload,
  WorkspaceCourseRecord,
} from "@/features/workspace-data/model/workspace-api.types";
import {
  formatWorkspaceDate,
  formatWorkspacePercent,
  slugifyWorkspaceValue,
} from "@/features/workspace-data/model/workspace-ui.utils";
import styles from "../teacher-space.module.css";
import { TeacherShell } from "../components/TeacherShell";

const EMPTY_COURSE: CreateWorkspaceCoursePayload = {
  title: "",
  slug: "",
  shortDescription: "",
  description: "",
  thumbnailUrl: "",
  price: 0,
  currency: "MAD",
  level: "BEGINNER",
  status: "DRAFT",
  isPublished: false,
  durationInHours: 8,
  certificateEnabled: false,
};

const EMPTY_MODULE: CreateWorkspaceModulePayload = {
  title: "",
  description: "",
  position: 1,
  isPublished: false,
};

const EMPTY_LESSON: CreateWorkspaceLessonPayload = {
  title: "",
  slug: "",
  content: "",
  videoUrl: "",
  resourceUrl: "",
  durationInMinutes: 15,
  position: 1,
  isFreePreview: false,
  isPublished: false,
};

export function TeacherProgramsPage() {
  const { user } = useCurrentAuthSession();
  const [courses, setCourses] = useState<WorkspaceCourseRecord[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE);
  const [moduleForm, setModuleForm] = useState(EMPTY_MODULE);
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<"course" | "module" | "lesson" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? courses[0] ?? null,
    [courses, selectedCourseId],
  );
  const selectedModule = useMemo(
    () =>
      selectedCourse?.modules.find((module) => module.id === selectedModuleId) ??
      selectedCourse?.modules[0] ??
      null,
    [selectedCourse, selectedModuleId],
  );

  const totals = useMemo(() => {
    const moduleCount = courses.reduce((sum, course) => sum + course.modules.length, 0);
    const lessonCount = courses.reduce(
      (sum, course) =>
        sum + course.modules.reduce((moduleSum, module) => moduleSum + module.lessons.length, 0),
      0,
    );
    const learnerCount = courses.reduce((sum, course) => sum + course.enrollmentsCount, 0);

    return { learnerCount, lessonCount, moduleCount };
  }, [courses]);

  const loadCourses = useCallback(async () => {
    setLoading(true);

    try {
      const allCourses = await fetchWorkspaceCourses();
      setCourses(user?.id ? allCourses.filter((course) => course.creator.id === user.id) : allCourses);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de charger les cours.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (selectedCourse && selectedCourse.id !== selectedCourseId) {
      setSelectedCourseId(selectedCourse.id);
    }

    if (selectedModule && selectedModule.id !== selectedModuleId) {
      setSelectedModuleId(selectedModule.id);
    }
  }, [selectedCourse, selectedCourseId, selectedModule, selectedModuleId]);

  async function handleCreateCourse() {
    if (!courseForm.title.trim() || !courseForm.shortDescription.trim() || !courseForm.description.trim()) {
      setErrorMessage("Le titre, le resume et la description sont obligatoires.");
      return;
    }

    setSubmitting("course");
    try {
      const createdCourse = await createWorkspaceCourse({
        ...courseForm,
        slug: slugifyWorkspaceValue(courseForm.slug || courseForm.title),
      });
      setCourseForm(EMPTY_COURSE);
      setSelectedCourseId(createdCourse.id);
      setSuccessMessage("Le cours a ete cree.");
      setErrorMessage(null);
      await loadCourses();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de creer le cours.");
    } finally {
      setSubmitting(null);
    }
  }

  function openThumbnailPicker() {
    thumbnailInputRef.current?.click();
  }

  async function handleThumbnailUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setUploadingThumbnail(true);

    try {
      const uploadedUrl = await uploadWorkspaceCourseThumbnail(file);

      if (!uploadedUrl) {
        throw new Error("La miniature n a pas pu etre resolue.");
      }

      setCourseForm((current) => ({
        ...current,
        thumbnailUrl: uploadedUrl,
      }));
      setErrorMessage(null);
      setSuccessMessage("La miniature du cours a ete televersee.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de televerser cette miniature.",
      );
    } finally {
      setUploadingThumbnail(false);
    }
  }

  async function handleCreateModule() {
    if (!selectedCourse || !moduleForm.title.trim()) {
      setErrorMessage("Selectionnez un cours et renseignez le titre du module.");
      return;
    }

    setSubmitting("module");
    try {
      await createWorkspaceCourseModule(selectedCourse.id, moduleForm);
      setModuleForm({ ...EMPTY_MODULE, position: selectedCourse.modules.length + 2 });
      setSuccessMessage("Le module a ete ajoute.");
      setErrorMessage(null);
      await loadCourses();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible d ajouter le module.");
    } finally {
      setSubmitting(null);
    }
  }

  async function handleCreateLesson() {
    if (!selectedCourse || !selectedModule || !lessonForm.title.trim() || !lessonForm.content.trim()) {
      setErrorMessage("Selectionnez un module et renseignez le titre et le contenu de la lecon.");
      return;
    }

    setSubmitting("lesson");
    try {
      await createWorkspaceCourseLesson(selectedCourse.id, selectedModule.id, {
        ...lessonForm,
        slug: slugifyWorkspaceValue(lessonForm.slug || lessonForm.title),
      });
      setLessonForm({ ...EMPTY_LESSON, position: selectedModule.lessons.length + 2 });
      setSuccessMessage("La lecon a ete ajoutee.");
      setErrorMessage(null);
      await loadCourses();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible d ajouter la lecon.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <TeacherShell activePath="/teacher/programs" title="Gestion des cours">
      <section>
        <h2 className={styles.sectionTitle}>Creation de cours</h2>
        <p className={styles.sectionSub}>
          Ajoutez vos cours, vos modules et vos lecons video a partir des vraies routes Teacher.
        </p>
      </section>

      {errorMessage ? <p className={`${styles.sectionSub} ${styles.messageError}`}>{errorMessage}</p> : null}
      {successMessage ? (
        <p className={`${styles.sectionSub} ${styles.messageSuccess}`}>{successMessage}</p>
      ) : null}

      <section className={`${styles.gridKpi} ${styles.sectionSpacing}`}>
        <MetricCard label="Cours" value={String(courses.length)} note="Catalogue personnel" />
        <MetricCard label="Modules" value={String(totals.moduleCount)} note="Structure en place" />
        <MetricCard label="Lecons" value={String(totals.lessonCount)} note="Videos et supports" />
        <MetricCard label="Inscriptions" value={String(totals.learnerCount)} note="Etudiants actifs" />
      </section>

      <section className={styles.split}>
        <article className={styles.card}>
          <h3>Nouveau cours</h3>
          <div className={styles.formGrid}>
            <input className={styles.input} placeholder="Titre du cours" value={courseForm.title} onChange={(event) => setCourseForm((current) => ({ ...current, title: event.target.value, slug: current.slug && current.slug !== slugifyWorkspaceValue(current.title) ? current.slug : slugifyWorkspaceValue(event.target.value) }))} />
            <input className={styles.input} placeholder="Slug" value={courseForm.slug} onChange={(event) => setCourseForm((current) => ({ ...current, slug: slugifyWorkspaceValue(event.target.value) }))} />
            <input className={styles.input} placeholder="Resume court" value={courseForm.shortDescription} onChange={(event) => setCourseForm((current) => ({ ...current, shortDescription: event.target.value }))} />
            <div className={styles.authoringStack}>
              <div className={styles.buttonRow}>
                <input className={styles.input} placeholder="URL miniature" value={courseForm.thumbnailUrl} onChange={(event) => setCourseForm((current) => ({ ...current, thumbnailUrl: event.target.value }))} />
                <button className={styles.ghostBtn} disabled={uploadingThumbnail} type="button" onClick={openThumbnailPicker}>
                  {uploadingThumbnail ? "Upload..." : "Uploader une image"}
                </button>
              </div>
              <input
                ref={thumbnailInputRef}
                accept="image/*"
                className={styles.assetUploadInput}
                type="file"
                onChange={(event) => void handleThumbnailUpload(event)}
              />
              {courseForm.thumbnailUrl ? (
                <div className={styles.assetPreviewFrame}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Apercu de la miniature du cours"
                    className={styles.assetPreviewImage}
                    src={courseForm.thumbnailUrl}
                  />
                </div>
              ) : (
                <p className={styles.sectionSub}>
                  Ajoutez une image de couverture pour donner un vrai contexte visuel a votre cours.
                </p>
              )}
            </div>
            <textarea className={styles.textarea} placeholder="Description detaillee" value={courseForm.description} onChange={(event) => setCourseForm((current) => ({ ...current, description: event.target.value }))} />
            <div className={styles.buttonRow}>
              <select className={styles.select} value={courseForm.level} onChange={(event) => setCourseForm((current) => ({ ...current, level: event.target.value as CreateWorkspaceCoursePayload["level"] }))}>
                <option value="BEGINNER">Debutant</option>
                <option value="INTERMEDIATE">Intermediaire</option>
                <option value="ADVANCED">Avance</option>
              </select>
              <select className={styles.select} value={courseForm.status} onChange={(event) => setCourseForm((current) => ({ ...current, status: event.target.value as CreateWorkspaceCoursePayload["status"], isPublished: event.target.value === "PUBLISHED" }))}>
                <option value="DRAFT">Brouillon</option>
                <option value="PUBLISHED">Publie</option>
                <option value="ARCHIVED">Archive</option>
              </select>
            </div>
            <div className={styles.buttonRow}>
              <input className={styles.input} min={0} type="number" value={courseForm.price} onChange={(event) => setCourseForm((current) => ({ ...current, price: Number(event.target.value) || 0 }))} placeholder="Prix" />
              <input className={styles.input} min={1} type="number" value={courseForm.durationInHours} onChange={(event) => setCourseForm((current) => ({ ...current, durationInHours: Number(event.target.value) || 1 }))} placeholder="Duree" />
            </div>
          </div>
          <div className={styles.buttonRow}>
            <button className={styles.primaryBtn} type="button" onClick={() => void handleCreateCourse()}>
              {submitting === "course" ? "Creation..." : "Creer le cours"}
            </button>
          </div>
        </article>

        <article className={styles.card}>
          <h3>Modules et lecons</h3>
          <div className={styles.formGrid}>
            <select className={styles.select} value={selectedCourse?.id ?? ""} onChange={(event) => setSelectedCourseId(event.target.value)}>
              <option value="">Choisir un cours</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
            <input className={styles.input} disabled={!selectedCourse} placeholder="Titre du module" value={moduleForm.title} onChange={(event) => setModuleForm((current) => ({ ...current, title: event.target.value }))} />
            <textarea className={styles.textarea} disabled={!selectedCourse} placeholder="Description du module" value={moduleForm.description} onChange={(event) => setModuleForm((current) => ({ ...current, description: event.target.value }))} />
            <button className={styles.ghostBtn} disabled={!selectedCourse} type="button" onClick={() => void handleCreateModule()}>
              {submitting === "module" ? "Ajout..." : "Ajouter le module"}
            </button>

            <select className={styles.select} disabled={!selectedCourse || selectedCourse.modules.length === 0} value={selectedModule?.id ?? ""} onChange={(event) => setSelectedModuleId(event.target.value)}>
              <option value="">Choisir un module</option>
              {(selectedCourse?.modules ?? []).map((module) => (
                <option key={module.id} value={module.id}>{module.title}</option>
              ))}
            </select>
            <input className={styles.input} disabled={!selectedModule} placeholder="Titre de la lecon" value={lessonForm.title} onChange={(event) => setLessonForm((current) => ({ ...current, title: event.target.value, slug: current.slug && current.slug !== slugifyWorkspaceValue(current.title) ? current.slug : slugifyWorkspaceValue(event.target.value) }))} />
            <textarea className={styles.textarea} disabled={!selectedModule} placeholder="Contenu de la lecon" value={lessonForm.content} onChange={(event) => setLessonForm((current) => ({ ...current, content: event.target.value }))} />
            <input className={styles.input} disabled={!selectedModule} placeholder="URL video" value={lessonForm.videoUrl} onChange={(event) => setLessonForm((current) => ({ ...current, videoUrl: event.target.value }))} />
            <input className={styles.input} disabled={!selectedModule} placeholder="URL ressource" value={lessonForm.resourceUrl} onChange={(event) => setLessonForm((current) => ({ ...current, resourceUrl: event.target.value }))} />
            <button className={styles.primaryBtn} disabled={!selectedModule} type="button" onClick={() => void handleCreateLesson()}>
              {submitting === "lesson" ? "Ajout..." : "Ajouter la lecon"}
            </button>
          </div>
        </article>
      </section>

      <section className={`${styles.card} ${styles.sectionSpacing}`}>
        <h3 className={styles.sectionTitleReset}>Curriculum courant</h3>
        {loading ? <p className={styles.sectionSub}>Chargement du catalogue...</p> : null}
        {!loading && !selectedCourse ? (
          <p className={styles.sectionSub}>Aucun cours pour le moment. Creez-en un pour commencer.</p>
        ) : null}
        {selectedCourse ? (
          <div className={styles.stackGridMd}>
            <div className={styles.rowWrapBetween}>
              <div>
                <strong>{selectedCourse.title}</strong>
                <p className={styles.sectionSub}>{selectedCourse.shortDescription}</p>
              </div>
              <span className={styles.chip}>
                {selectedCourse.modules.length} modules · {selectedCourse.enrollmentsCount} inscrits
              </span>
            </div>

            {selectedCourse.modules.map((module) => (
              <div key={module.id} className={styles.outlineCard}>
                <div className={styles.rowWrapBetween}>
                  <strong>{module.title}</strong>
                  <span className={styles.chip}>{module.isPublished ? "Publie" : "Brouillon"}</span>
                </div>
                <p className={styles.sectionSub}>{module.description || "Aucune description."}</p>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Lecon</th>
                        <th>Type</th>
                        <th>Duree</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {module.lessons.map((lesson) => (
                        <tr key={lesson.id}>
                          <td>{lesson.title}</td>
                          <td>{lesson.videoUrl ? "Video" : lesson.resourceUrl ? "Support" : "Texte"}</td>
                          <td>{lesson.durationInMinutes ? `${lesson.durationInMinutes} min` : "Non renseigne"}</td>
                          <td>{lesson.isPublished ? "Publiee" : "Brouillon"}</td>
                        </tr>
                      ))}
                      {module.lessons.length === 0 ? (
                        <tr>
                          <td colSpan={4}>Aucune lecon pour ce module.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <div className={styles.split}>
              <article className={styles.card}>
                <span className={styles.kpiLabel}>Derniere mise a jour</span>
                <strong className={styles.kpiValue}>{formatWorkspaceDate(selectedCourse.updatedAt)}</strong>
                <p className={styles.kpiTrend}>Etat: {selectedCourse.status}</p>
              </article>
              <article className={styles.card}>
                <span className={styles.kpiLabel}>Modules publies</span>
                <strong className={styles.kpiValue}>
                  {formatWorkspacePercent(
                    (selectedCourse.modules.filter((module) => module.isPublished).length /
                      Math.max(selectedCourse.modules.length, 1)) *
                      100,
                  )}
                </strong>
                <p className={styles.kpiTrend}>Couverture de publication</p>
              </article>
            </div>
          </div>
        ) : null}
      </section>
    </TeacherShell>
  );
}

function MetricCard({
  label,
  note,
  value,
}: {
  label: string;
  note: string;
  value: string;
}) {
  return (
    <article className={styles.card}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
      <p className={styles.kpiTrend}>{note}</p>
    </article>
  );
}
