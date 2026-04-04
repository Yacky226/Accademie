export class GradeResponseDto {
  id!: string;
  title!: string;
  type!: string;
  score!: string;
  maxScore!: string;
  percentage!: string;
  weight?: string;
  feedback?: string;
  status!: string;
  gradedAt?: Date;
  student!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  gradedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
    slug: string;
  };
  evaluationAttemptId?: string;
  createdAt!: Date;
  updatedAt!: Date;
}
