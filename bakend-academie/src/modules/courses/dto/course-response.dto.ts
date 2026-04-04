import {
  CourseLevel,
  CourseStatus,
  EnrollmentStatus,
} from '../../../core/enums';

export class CourseResponseDto {
  id!: string;
  title!: string;
  slug!: string;
  shortDescription!: string;
  description!: string;
  thumbnailUrl?: string;
  price!: string;
  currency!: string;
  level!: CourseLevel;
  status!: CourseStatus;
  isPublished!: boolean;
  durationInHours?: number;
  certificateEnabled!: boolean;
  creator!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  modules!: Array<{
    id: string;
    title: string;
    description?: string;
    position: number;
    isPublished: boolean;
    lessons: Array<{
      id: string;
      title: string;
      slug: string;
      durationInMinutes?: number;
      position: number;
      isFreePreview: boolean;
      isPublished: boolean;
    }>;
  }>;
  enrollmentsCount!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export class EnrollmentResponseDto {
  id!: string;
  status!: EnrollmentStatus;
  progressPercent!: string;
  startedAt?: Date;
  completedAt?: Date;
  user!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  course!: {
    id: string;
    title: string;
    slug: string;
  };
  createdAt!: Date;
  updatedAt!: Date;
}
