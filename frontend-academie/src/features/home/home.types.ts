export interface NavItem {
  label: string;
  href: string;
  isActive?: boolean;
}

export interface HeroMetric {
  label: string;
  value: string;
}

export interface CourseCard {
  title: string;
  category: string;
  description: string;
  hours: string;
  rating: string;
  imageUrl: string;
  imageAlt: string;
}

export interface PricingFeature {
  label: string;
  included: boolean;
}

export interface PricingPlan {
  name: string;
  price: string;
  period?: string;
  highlighted?: boolean;
  badge?: string;
  cta: string;
  ctaHref: string;
  features: PricingFeature[];
}
