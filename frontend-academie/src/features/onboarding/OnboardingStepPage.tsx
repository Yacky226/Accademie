"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { writeClientOnboardingCookies } from "@/core/auth/session-cookie-store";
import {
  getDashboardPathForRole,
  resolveSafeRedirectTarget,
} from "@/core/router/route-access-control";
import { useCurrentAuthSession } from "@/features/auth/model/useCurrentAuthSession";
import { AcademyBrandIcon } from "@/shared/ui/AcademyBrandIcon";
import {
  fetchCurrentUserProfile,
  syncCurrentUserOnboarding,
} from "@/features/users/api/user-profile.client";
import type { OnboardingProfile } from "@/features/users/model/user-profile.types";
import { onboardingSteps, type OnboardingStep } from "./onboarding.data";
import {
  buildOnboardingPath,
  resolveOnboardingProgressState,
} from "./model/onboarding-progress";
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
      "Une fois ces preferences completees, votre espace peut etre active avec des reperes plus coherents pour le mentoring et les notifications.",
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

function getInputType(fieldKey: string) {
  return fieldKey === "email" ? "email" : "text";
}

function getStepCompletion(step: OnboardingStep, values: OnboardingValues) {
  const completed = step.fields.filter((field) => (values[field.key] ?? "").trim().length > 0)
    .length;

  const total = step.fields.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { completed, percent, total };
}

function buildOnboardingProfile(values: OnboardingValues): OnboardingProfile {
  return {
    currentRole: values.currentRole?.trim() || undefined,
    dailyCodingTime: values.dailyCodingTime?.trim() || undefined,
    email: values.email?.trim() || undefined,
    fullName: values.fullName?.trim() || undefined,
    mentorInteractionMode: values.mentorInteractionMode?.trim() || undefined,
    preferredCohortPace: values.preferredCohortPace?.trim() || undefined,
    primaryGoal: values.primaryGoal?.trim() || undefined,
    primaryLanguage: values.primaryLanguage?.trim() || undefined,
    targetStack: values.targetStack?.trim() || undefined,
    timezone: values.timezone?.trim() || undefined,
    weeklyCommitment: values.weeklyCommitment?.trim() || undefined,
    yearsOfExperience: values.yearsOfExperience?.trim() || undefined,
  };
}

function splitFullName(value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    return { firstName: undefined, lastName: undefined };
  }

  const parts = normalized.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1),
  };
}

function mapProfileToValues(input: {
  email: string;
  firstName: string;
  lastName: string;
  onboardingProfile: OnboardingProfile | null;
}) {
  const onboarding = input.onboardingProfile ?? {};
  const fullName =
    onboarding.fullName?.trim() ||
    `${input.firstName} ${input.lastName}`.trim() ||
    "";

  return {
    currentRole: onboarding.currentRole ?? "",
    dailyCodingTime: onboarding.dailyCodingTime ?? "",
    email: onboarding.email ?? input.email ?? "",
    fullName,
    mentorInteractionMode: onboarding.mentorInteractionMode ?? "",
    preferredCohortPace: onboarding.preferredCohortPace ?? "",
    primaryGoal: onboarding.primaryGoal ?? "",
    primaryLanguage: onboarding.primaryLanguage ?? "",
    targetStack: onboarding.targetStack ?? "",
    timezone: onboarding.timezone ?? "",
    weeklyCommitment: onboarding.weeklyCommitment ?? "",
    yearsOfExperience: onboarding.yearsOfExperience ?? "",
  } satisfies OnboardingValues;
}

export function OnboardingStepPage({ slug }: OnboardingStepPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useCurrentAuthSession();
  const currentStep = onboardingSteps.find((step) => step.slug === slug);
  const [values, setValues] = useState<OnboardingValues>({});
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function hydrate() {
      let nextValues: OnboardingValues = {};

      const rawValue = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (rawValue) {
        try {
          nextValues = JSON.parse(rawValue) as OnboardingValues;
        } catch {
          nextValues = {};
        }
      }

      if (isAuthenticated) {
        try {
          const profile = await fetchCurrentUserProfile();
          if (!isActive) {
            return;
          }

          nextValues = {
            ...mapProfileToValues(profile),
            ...nextValues,
          };
        } catch {
          // Local onboarding can still continue even if profile sync is temporarily unavailable.
        }
      }

      if (!isActive) {
        return;
      }

      setValues(nextValues);
      setHasHydrated(true);
    }

    void hydrate();

    return () => {
      isActive = false;
    };
  }, [isAuthenticated]);

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

  const allFieldsCompleted = useMemo(
    () =>
      onboardingSteps.every((step) =>
        step.fields.every((field) => (values[field.key] ?? "").trim().length > 0),
      ),
    [values],
  );

  async function persistOnboarding(showSavedMessage: boolean) {
    if (!isAuthenticated) {
      return true;
    }

    const onboardingProfile = buildOnboardingProfile(values);
    const identity = splitFullName(onboardingProfile.fullName);

    setIsSyncing(true);
    try {
      await syncCurrentUserOnboarding({
        email: onboardingProfile.email,
        firstName: identity.firstName,
        lastName: identity.lastName,
        onboardingCompletedAt: allFieldsCompleted ? new Date().toISOString() : null,
        onboardingProfile,
      });
      const onboardingState = resolveOnboardingProgressState({
        onboardingCompletedAt: allFieldsCompleted ? new Date().toISOString() : null,
        onboardingProfile,
        role: user?.role ?? "student",
      });
      writeClientOnboardingCookies({
        onboardingCompleted: onboardingState.completed,
        onboardingNextStep: onboardingState.nextStep,
      });
      setSyncError(null);
      if (showSavedMessage) {
        setSyncMessage(
          allFieldsCompleted
            ? "Onboarding synchronise et pret pour votre espace."
            : "Brouillon d onboarding synchronise.",
        );
      }
      return true;
    } catch (error) {
      setSyncError(
        error instanceof Error ? error.message : "Impossible de synchroniser l onboarding.",
      );
      return false;
    } finally {
      setIsSyncing(false);
    }
  }

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void persistOnboarding(false);
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [allFieldsCompleted, hasHydrated, isAuthenticated, values]);

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
  const overallCompletion =
    totalFields === 0 ? 0 : Math.round((completedFields / totalFields) * 100);
  const remainingFields = Math.max(currentProgress.total - currentProgress.completed, 0);
  const requestedRedirectTarget = resolveSafeRedirectTarget(
    searchParams.get("redirect"),
    "",
  );

  function buildStepHref(stepSlug: OnboardingStep["slug"]) {
    return buildOnboardingPath(stepSlug, requestedRedirectTarget || null);
  }

  async function handleNavigate(href: string) {
    await persistOnboarding(true);
    router.push(href);
  }

  async function handleFinish() {
    const didPersist = await persistOnboarding(true);
    if (!didPersist && isAuthenticated) {
      return;
    }

    if (isAuthenticated && user) {
      router.push(requestedRedirectTarget || getDashboardPathForRole(user.role));
      return;
    }

    router.push("/auth/login");
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.shellHeader}>
          <Link aria-label="Retour a l accueil" className={styles.brand} href="/">
            <span className={styles.brandMark}>
              <AcademyBrandIcon />
            </span>
            <span className={styles.brandCopy}>
              <strong>Architect Academy</strong>
              <small>Onboarding flow</small>
            </span>
          </Link>

          <div className={styles.headerActions}>
            <span className={styles.savePill}>
              {isAuthenticated
                ? isSyncing
                  ? "Synchronisation..."
                  : "Profil connecte"
                : "Sauvegarde locale active"}
            </span>
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
                const status = isComplete
                  ? "Complete"
                  : isActive
                    ? "Active"
                    : isPast
                      ? "Started"
                      : "Upcoming";

                return (
                  <button
                    aria-current={isActive ? "step" : undefined}
                    className={`${styles.stepLink} ${
                      isActive ? styles.stepLinkActive : isComplete ? styles.stepLinkDone : ""
                    }`}
                    key={step.slug}
                    onClick={() => void handleNavigate(buildStepHref(step.slug))}
                    type="button"
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
                  </button>
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
              <p>
                {isAuthenticated
                  ? "Vos reponses sont sauvegardees localement et synchronisees avec votre profil."
                  : "Vos reponses sont sauvegardees automatiquement dans ce navigateur."}
              </p>
            </div>

            {syncMessage ? <p className={styles.panelNotice}>{syncMessage}</p> : null}
            {syncError ? <p className={styles.panelNotice}>{syncError}</p> : null}

            <form className={styles.form}>
              {currentStep.fields.map((field, index) => {
                const inputId = `field-${field.key}`;
                const fieldValue = values[field.key] ?? "";

                return (
                  <label className={styles.fieldCard} htmlFor={inputId} key={field.key}>
                    <span className={styles.fieldOrder}>Field 0{index + 1}</span>
                    <span className={styles.fieldLabel}>{field.label}</span>
                    <span className={styles.fieldHint}>Exemple: {field.placeholder}</span>
                    <input
                      autoComplete={getInputType(field.key) === "email" ? "email" : "off"}
                      id={inputId}
                      name={field.key}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setValues((current) => ({ ...current, [field.key]: nextValue }));
                        setSyncMessage(null);
                      }}
                      placeholder={field.placeholder}
                      type={getInputType(field.key)}
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
                  <button
                    className={styles.secondaryButton}
                    onClick={() => void handleNavigate(buildStepHref(previousStep.slug))}
                    type="button"
                  >
                    Back
                  </button>
                ) : (
                  <Link className={styles.secondaryButton} href="/auth/register">
                    Cancel
                  </Link>
                )}

                {nextStep ? (
                  <button
                    className={styles.primaryButton}
                    onClick={() => void handleNavigate(buildStepHref(nextStep.slug))}
                    type="button"
                  >
                    Continue
                  </button>
                ) : (
                  <button className={styles.primaryButton} onClick={() => void handleFinish()} type="button">
                    Activer mon espace
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
