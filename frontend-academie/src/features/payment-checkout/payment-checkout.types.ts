export interface CheckoutSummaryLine {
  label: string;
  detail?: string;
  amount: string;
}

export interface CheckoutBenefit {
  icon: string;
  label: string;
}

export interface CheckoutProgressMetric {
  label: string;
  value: string;
}
