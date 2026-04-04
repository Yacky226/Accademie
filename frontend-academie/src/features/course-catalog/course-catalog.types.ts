export interface CatalogCourse {
  title: string;
  category: string;
  mentor: string;
  mentorAvatarAlt: string;
  mentorAvatarUrl: string;
  price: string;
  paymentLabel: string;
  rating: string;
  imageUrl: string;
  imageAlt: string;
  qualityBadge: string;
}

export interface CatalogFilter {
  label: string;
  active?: boolean;
}

export interface CatalogNavItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface CatalogFooterLink {
  label: string;
  href: string;
}
