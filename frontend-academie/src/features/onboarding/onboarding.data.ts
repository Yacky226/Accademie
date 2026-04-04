export interface OnboardingStep {
  id: number;
  slug: "step-1" | "step-2" | "step-3" | "step-4";
  title: string;
  subtitle: string;
  fields: { label: string; placeholder: string }[];
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    slug: "step-1",
    title: "Identite personnelle",
    subtitle:
      "Donnez-nous les informations de base pour personnaliser votre experience des le premier module.",
    fields: [
      { label: "Nom complet", placeholder: "Jane Doe" },
      { label: "Adresse email", placeholder: "jane@studio.fr" },
      { label: "Langue principale", placeholder: "Francais / English" },
    ],
  },
  {
    id: 2,
    slug: "step-2",
    title: "Niveau actuel",
    subtitle: "Aidez-nous a estimer votre point de depart et votre rythme de progression.",
    fields: [
      { label: "Role actuel", placeholder: "Developpeur frontend" },
      { label: "Annees d experience", placeholder: "3 ans" },
      { label: "Temps de code quotidien", placeholder: "2 a 4 heures" },
    ],
  },
  {
    id: 3,
    slug: "step-3",
    title: "Objectifs d apprentissage",
    subtitle: "Definissez les resultats que vous voulez atteindre dans les 90 prochains jours.",
    fields: [
      { label: "Objectif principal", placeholder: "Devenir lead backend" },
      { label: "Stack cible", placeholder: "Node.js, Postgres, Kubernetes" },
      { label: "Engagement hebdomadaire", placeholder: "6 heures par semaine" },
    ],
  },
  {
    id: 4,
    slug: "step-4",
    title: "Activation finale",
    subtitle: "Verifiez vos preferences et activez votre espace Architect Academy.",
    fields: [
      { label: "Rythme de cohorte prefere", placeholder: "Week-end" },
      { label: "Mode d interaction mentor", placeholder: "Sessions live + async" },
      { label: "Fuseau horaire", placeholder: "UTC+1" },
    ],
  },
];
