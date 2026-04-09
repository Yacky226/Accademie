export interface OnboardingStep {
  id: number;
  slug: "step-1" | "step-2" | "step-3" | "step-4";
  title: string;
  subtitle: string;
  fields: { key: string; label: string; placeholder: string }[];
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    slug: "step-1",
    title: "Identite personnelle",
    subtitle:
      "Donnez-nous les informations de base pour personnaliser votre experience des le premier module.",
    fields: [
      { key: "fullName", label: "Nom complet", placeholder: "Jane Doe" },
      { key: "email", label: "Adresse email", placeholder: "jane@studio.fr" },
      { key: "primaryLanguage", label: "Langue principale", placeholder: "Francais / English" },
    ],
  },
  {
    id: 2,
    slug: "step-2",
    title: "Niveau actuel",
    subtitle: "Aidez-nous a estimer votre point de depart et votre rythme de progression.",
    fields: [
      { key: "currentRole", label: "Role actuel", placeholder: "Developpeur frontend" },
      { key: "yearsOfExperience", label: "Annees d experience", placeholder: "3 ans" },
      { key: "dailyCodingTime", label: "Temps de code quotidien", placeholder: "2 a 4 heures" },
    ],
  },
  {
    id: 3,
    slug: "step-3",
    title: "Objectifs d apprentissage",
    subtitle: "Definissez les resultats que vous voulez atteindre dans les 90 prochains jours.",
    fields: [
      { key: "primaryGoal", label: "Objectif principal", placeholder: "Devenir lead backend" },
      { key: "targetStack", label: "Stack cible", placeholder: "Node.js, Postgres, Kubernetes" },
      { key: "weeklyCommitment", label: "Engagement hebdomadaire", placeholder: "6 heures par semaine" },
    ],
  },
  {
    id: 4,
    slug: "step-4",
    title: "Activation finale",
    subtitle: "Verifiez vos preferences et activez votre espace Architect Academy.",
    fields: [
      { key: "preferredCohortPace", label: "Rythme de cohorte prefere", placeholder: "Week-end" },
      { key: "mentorInteractionMode", label: "Mode d interaction mentor", placeholder: "Sessions live + async" },
      { key: "timezone", label: "Fuseau horaire", placeholder: "UTC+1" },
    ],
  },
];
