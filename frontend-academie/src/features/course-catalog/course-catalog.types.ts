export interface CatalogCourseRecord {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string | null;
  price: number;
  currency: string;
  level: string;
  durationInHours: number | null;
  enrollmentsCount: number;
  mentorName: string;
  categoryLabel: string;
}

export interface CatalogCourseDetailRecord extends CatalogCourseRecord {
  modules: Array<{
    id: string;
    title: string;
    description: string;
    position: number;
    lessons: Array<{
      id: string;
      title: string;
      slug: string;
      durationInMinutes: number | null;
      isFreePreview: boolean;
    }>;
  }>;
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

export interface CatalogCourse {
  title: string;
  category: string;
  mentor: string;
  mentorAvatarAlt: string;
  mentorAvatarUrl: string;
  price: string;
  paymentLabel: string;
  rating: string;
  imageAlt: string;
  imageUrl: string;
  qualityBadge: string;
}
