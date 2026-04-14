export class EvaluationAttemptResponseDto {
  id!: string;
  status!: string;
  answers?: Record<string, unknown>;
  score?: string;
  maxScore!: string;
  feedback?: string;
  startedAt!: Date;
  submittedAt?: Date;
  student!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  grader?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  evaluation!: {
    id: string;
    title: string;
    slug: string;
  };
  createdAt!: Date;
  updatedAt!: Date;
}
