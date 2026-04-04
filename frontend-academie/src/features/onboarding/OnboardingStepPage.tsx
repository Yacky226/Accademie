"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onboardingSteps, type OnboardingStep } from "./onboarding.data";
import styles from "./onboarding.module.css";

interface OnboardingStepPageProps {
  slug: "step-1" | "step-2" | "step-3" | "step-4";
}

type OnboardingValues = Record<string, string>;

interface StepNarrative {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  accentLabel: string;
  accentValue: string;
  accentNote: string;
}

const ONBOARDING_STORAGE_KEY = "academy-onboarding";

const stepNarratives: Record<OnboardingStepPageProps["slug"], StepNarrative> = {
  "step-1": {
    eyebrow: "Profile signal",
    title: "Nous posons la base de votre identite academique.",
    description:
      "Ces informations alimentent votre profil visible, vos futures recommandations et la personnalisation du parcours des le premier jour.",
    bullets: [
      "Votre nom et votre langue structurent l experience dans l espace etudiant.",
      "Votre email permettra de retrouver votre progression plus facilement.",
      "Les prochaines etapes seront mieux contextualisees avec ces premiers reperes.",
    ],
    accentLabel: "Impact direct",
    accentValue: "Step 1",
    accentNote: "Personalisation immediate du profil et des modules proposes.",
  },
  "step-2": {
    eyebrow: "Baseline mapping",
    title: "Nous estimons votre point de depart avec plus de finesse.",
    description:
      "Role, experience et rythme quotidien nous aident a calibrer un niveau de difficulty realiste et une trajectoire sans friction.",
    bullets: [
      "Nous alignons votre niveau sur les modules les plus pertinents.",
      "Le rythme de travail guide le volume recommande chaque semaine.",
      "Les mentors peuvent mieux comprendre votre contexte des le demarrage.",
    ],
    accentLabel: "Outcome",
    accentValue: "Step 2",
    accentNote: "Un demarrage plus precis, sans surcharge ni sous-niveau.",
  },
  "step-3": {
    eyebrow: "Goal design",
    title: "Nous transformons vos intentions en cap d apprentissage.",
    description:
      "Cette etape relie vos ambitions a une stack cible, un engagement concret et une feuille de route plus lisible sur 90 jours.",
    bullets: [
      "Votre objectif principal devient le fil conducteur du parcours.",
      "La stack cible influence les projets, les lectures et les revues.",
      "L engagement hebdomadaire aide a garder un rythme soutenable.",
    ],
    accentLabel: "Outcome",
    accentValue: "Step 3",
    accentNote: "Une trajectoire plus claire et un parcours plus actionnable.",
  },
  "step-4": {
    eyebrow: "Workspace activation",
    title: "Nous finalisons votre environnement et votre rythme de suivi.",
    description:
      "Une fois ces preferences completees, votre espace peut etre active avec des repères plus coherents pour le mentoring et les notifications.",
    bullets: [
      "Le rythme de cohorte influence la cadence de vos modules.",
      "Le mode mentor ajuste les points de contact proposes.",
      "Le fuseau horaire clarifie planning, sessions live et rappels.",
    ],
    accentLabel: "Result",
    accentValue: "Step 4",
    accentNote: "Votre espace est pret pour l activation finale et la navigation connectee.",
  },
};

function toFieldKey(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function getInputType(label: string) {
  return label.toLowerCase().includes("email") ? "email" : "text";
}

function getStepCompletion(step: OnboardingStep, values: OnboardingValues) {
  const completed = step.fields.filter((field) => {
    const key = `${step.slug}:${toFieldKey(field.label)}`;
    return (values[key] ?? "").trim().length > 0;
  }).length;

  const total = step.fields.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { completed, percent, total };
}

export function OnboardingStepPage({ slug }: OnboardingStepPageProps) {
  const currentStep = onboardingSteps.find((step) => step.slug === slug);
  const [values, setValues] = useState<OnboardingValues>({});
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const rawValue = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);

    if (!rawValue) {
      setHasHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(rawValue) as OnboardingValues;
      setValues(parsed);
    } catch {
      setValues({});
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(values));
  }, [hasHydrated, values]);

  const stepProgress = useMemo(
    () =>
      onboardingSteps.map((step) => ({
        ...step,
        ...getStepCompletion(step, values),
      })),
    [values],
  );

  if (!currentStep) {
    return null;
  }

  const currentNarrative = stepNarratives[currentStep.slug];
  const currentProgress =
    stepProgress.find((step) => step.slug === currentStep.slug) ??
    getStepCompletion(currentStep, values);
  const previousStep = onboardingSteps[currentStep.id - 2];
  const nextStep = onboardingSteps[currentStep.id];
  const completedSteps = stepProgress.filter((step) => step.percent === 100).length;
  const totalFields = stepProgress.reduce((sum, step) => sum + step.total, 0);
  const completedFields = stepProgress.reduce((sum, step) => sum + step.completed, 0);
  const overallCompletion = totalFields === 0 ? 0 : Math.round((completedFields / totalFields) * 100);
  const remainingFields = Math.max(currentProgress.total - currentProgress.completed, 0);

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.shellHeader}>
          <Link aria-label="Retour a l accueil" className={styles.brand} href="/">
            <span className={styles.brandMark}>AA</span>
            <span className={styles.brandCopy}>
              <strong>Architect Academy</strong>
              <small>Onboarding flow</small>
            </span>
          </Link>

          <div className={styles.headerActions}>
            <span className={styles.savePill}>Sauvegarde locale active</span>
            <Link className={styles.headerLink} href="/auth/login">
              Se connecter
            </Link>
          </div>
        </header>

        <div className={styles.layout}>
          <aside className={styles.aside}>
            <article className={styles.overviewCard}>
              <span className={styles.overviewEyebrow}>Learning setup</span>
              <h1>Configurez un espace calibre pour votre ambition technique.</h1>
              <p>
                Chaque etape construit un profil plus juste pour relier onboarding, recommandations
                de cours, mentoring et navigation dans votre espace connecte.
              </p>

              <div className={styles.overviewStats}>
                <article className={styles.statCard}>
                  <span>Completion</span>
                  <strong>{overallCompletion}%</strong>
                  <small>Profil total complete</small>
                </article>
                <article className={styles.statCard}>
                  <span>Validated steps</span>
                  <strong>
                    {completedSteps}/{onboardingSteps.length}
                  </strong>
                  <small>Etapes finalisees</small>
                </article>
              </div>
            </article>

            <nav aria-label="Etapes de l onboarding" className={styles.stepRail}>
              {stepProgress.map((step) => {
                const isActive = step.slug === currentStep.slug;
                const isComplete = step.percent === 100;
                const isPast = step.id < currentStep.id;
                const status = isComplete ? "Complete" : isActive ? "Active" : isPast ? "Started" : "Upcoming";

                return (
                  <Link
                    aria-current={isActive ? "step" : undefined}
                    className={`${styles.stepLink} ${
                      isActive ? styles.stepLinkActive : isComplete ? styles.stepLinkDone : ""
                    }`}
                    href={`/onboarding/${step.slug}`}
                    key={step.slug}
                  >
                    <span
                      className={`${styles.stepIndex} ${
                        isActive ? styles.stepIndexActive : isComplete ? styles.stepIndexDone : ""
                      }`}
                    >
                      {step.id}
                    </span>

                    <span className={styles.stepContent}>
                      <strong>{step.title}</strong>
                      <small>{step.percent}% complete</small>
                    </span>

                    <span className={styles.stepState}>{status}</span>
                  </Link>
                );
              })}
            </nav>

            <article className={styles.insightCard}>
              <div className={styles.insightTop}>
                <span className={styles.insightBadge}>{currentNarrative.eyebrow}</span>
                <span className={styles.insightValue}>{currentNarrative.accentValue}</span>
              </div>

              <h2>{currentNarrative.title}</h2>
              <p>{currentNarrative.description}</p>

              <ul className={styles.insightList}>
                {currentNarrative.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>

              <div className={styles.insightFoot}>
                <span>{currentNarrative.accentLabel}</span>
                <strong>{currentNarrative.accentNote}</strong>
              </div>
            </article>
          </aside>

          <section className={styles.panel}>
            <div className={styles.panelTop}>
              <div className={styles.panelCopy}>
                <span className={styles.panelEyebrow}>
                  Step {currentStep.id} of {onboardingSteps.length}
                </span>
                <h2>{currentStep.title}</h2>
                <p>{currentStep.subtitle}</p>
              </div>

              <article className={styles.progressCard}>
                <span>Current step</span>
                <strong>{currentProgress.percent}%</strong>
                <div className={styles.progressTrack}>
                  <span style={{ width: `${currentProgress.percent}%` }} />
                </div>
                <small>
                  {remainingFields === 0
                    ? "Tout est complete pour cette etape."
                    : `${remainingFields} champ${remainingFields > 1 ? "s" : ""} restant${remainingFields > 1 ? "s" : ""}.`}
                </small>
              </article>
            </div>

            <div className={styles.panelNotice}>
              <span>{currentNarrative.eyebrow}</span>
              <p>Vos reponses sont sauvegardees automatiquement dans ce navigateur.</p>
            </div>

            <form className={styles.form}>
              {currentStep.fields.map((field, index) => {
                const fieldKey = `${currentStep.slug}:${toFieldKey(field.label)}`;
                const inputId = `field-${fieldKey}`;
                const fieldValue = values[fieldKey] ?? "";

                return (
                  <label className={styles.fieldCard} htmlFor={inputId} key={field.label}>
                    <span className={styles.fieldOrder}>Field 0{index + 1}</span>
                    <span className={styles.fieldLabel}>{field.label}</span>
                    <span className={styles.fieldHint}>Exemple: {field.placeholder}</span>
                    <input
                      autoComplete={getInputType(field.label) === "email" ? "email" : "off"}
                      id={inputId}
                      name={fieldKey}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setValues((current) => ({ ...current, [fieldKey]: nextValue }));
                      }}
                      placeholder={field.placeholder}
                      type={getInputType(field.label)}
                      value={fieldValue}
                    />
                    <span className={styles.fieldStatus}>
                      {fieldValue.trim().length > 0
                        ? "Complete et pret pour la suite"
                        : "A renseigner pour de meilleures recommandations"}
                    </span>
                  </label>
                );
              })}
            </form>

            <div className={styles.panelFooter}>
              <div className={styles.footerMeta}>
                <span>Overall progress</span>
                <strong>{overallCompletion}% complete</strong>
                <p>
                  {completedSteps} etape{completedSteps > 1 ? "s" : ""} completement finalisee
                  {completedSteps > 1 ? "s" : ""}.
                </p>
              </div>

              <div className={styles.footerActions}>
                {previousStep ? (
                  <Link className={styles.secondaryButton} href={`/onboarding/${previousStep.slug}`}>
                    Back
                  </Link>
                ) : (
                  <Link className={styles.secondaryButton} href="/auth/register">
                    Cancel
                  </Link>
                )}

                {nextStep ? (
                  <Link className={styles.primaryButton} href={`/onboarding/${nextStep.slug}`}>
                    Continue
                  </Link>
                ) : (
                  <Link className={styles.primaryButton} href="/student/dashboard">
                    Activer mon espace
                  </Link>
                )}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
