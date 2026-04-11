import { onboardingSteps } from "../onboarding.data";
import type { OnboardingProfile } from "@/features/users/model/user-profile.types";

export type OnboardingStepSlug = (typeof onboardingSteps)[number]["slug"];
type OnboardingFieldMap =
  | OnboardingProfile
  | Record<string, string | undefined>
  | null
  | undefined;

function readCompletedField(
  profile: OnboardingFieldMap,
  key: string,
) {
  const rawValue =
    profile && typeof profile === "object"
      ? (profile as Record<string, unknown>)[key]
      : undefined;
  return typeof rawValue === "string" && rawValue.trim().length > 0;
}

export function resolveNextOnboardingStep(
  profile: OnboardingFieldMap,
): OnboardingStepSlug {
  const pendingStep = onboardingSteps.find((step) =>
    step.fields.some((field) => !readCompletedField(profile, field.key)),
  );

  return pendingStep?.slug ?? onboardingSteps.at(-1)?.slug ?? "step-1";
}

export function resolveOnboardingProgressState(input: {
  onboardingCompletedAt?: string | Date | null;
  onboardingProfile?: OnboardingFieldMap;
  role?: string | null;
}) {
  const normalizedRole = input.role?.trim().toLowerCase() ?? null;

  if (normalizedRole !== "student") {
    return {
      completed: true,
      nextStep: null,
    } satisfies {
      completed: boolean;
      nextStep: OnboardingStepSlug | null;
    };
  }

  const profile = input.onboardingProfile ?? null;
  const allStepsCompleted = onboardingSteps.every((step) =>
    step.fields.every((field) => readCompletedField(profile, field.key)),
  );
  const completed = Boolean(input.onboardingCompletedAt) || allStepsCompleted;

  return {
    completed,
    nextStep: completed ? null : resolveNextOnboardingStep(profile),
  } satisfies {
    completed: boolean;
    nextStep: OnboardingStepSlug | null;
  };
}

export function buildOnboardingPath(
  step: OnboardingStepSlug | null | undefined,
  redirectTarget?: string | null,
) {
  const pathname = `/onboarding/${step ?? "step-1"}`;

  if (!redirectTarget) {
    return pathname;
  }

  const params = new URLSearchParams();
  params.set("redirect", redirectTarget);
  return `${pathname}?${params.toString()}`;
}
