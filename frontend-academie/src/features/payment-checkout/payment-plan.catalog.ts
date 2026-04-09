import type { CheckoutPlanRecord } from "./payment-checkout.types";

export const checkoutPlans: CheckoutPlanRecord[] = [
  {
    code: "PRO",
    name: "Pack Pro",
    description:
      "Acces complet au catalogue, corrections prioritaires et suivi avance dans l espace etudiant.",
    price: 49,
    currency: "EUR",
    billingInterval: "MONTHLY",
    benefits: [
      { icon: "CT", label: "Catalogue complet" },
      { icon: "RV", label: "Reviews prioritaires" },
      { icon: "LB", label: "Labs pratiques" },
      { icon: "CF", label: "Certificat academie" },
    ],
  },
  {
    code: "TEAM",
    name: "Pack Team",
    description:
      "Abonnement d equipe pour plusieurs apprenants avec pilotage centralise et suivi partage.",
    price: 199,
    currency: "EUR",
    billingInterval: "MONTHLY",
    benefits: [
      { icon: "EQ", label: "Cohortes equipe" },
      { icon: "AN", label: "Analytics partages" },
      { icon: "MG", label: "Mentorat groupe" },
      { icon: "AD", label: "Admin centralise" },
    ],
  },
];

export function findCheckoutPlan(planCode: string | null | undefined) {
  if (!planCode) {
    return null;
  }

  return checkoutPlans.find((plan) => plan.code === planCode.toUpperCase()) ?? null;
}
