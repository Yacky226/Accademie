import type {
  CheckoutBenefit,
  CheckoutSummaryLine,
} from "./payment-checkout.types";

export const checkoutSummaryLines: CheckoutSummaryLine[] = [
  {
    label: "Acces illimite au programme",
    detail: "Plus de 40 heures de contenu video haute definition",
    amount: "415,83 EUR",
  },
  {
    label: "TVA (20%)",
    amount: "83,17 EUR",
  },
];

export const checkoutBenefits: CheckoutBenefit[] = [
  { icon: "TM", label: "Labs Pratiques" },
  { icon: "MT", label: "Acces Mentor" },
  { icon: "CF", label: "Certificat CPF" },
  { icon: "UP", label: "MAJ a Vie" },
];
