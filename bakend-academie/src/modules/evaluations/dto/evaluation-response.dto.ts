import { EvaluationType } from '../../../core/enums';

export class EvaluationResponseDto {
  id!: string;
  title!: string;
  slug!: string;
  description?: string;
  type!: EvaluationType;
  instructions?: string;
  durationInMinutes?: number;
  maxAttempts!: number;
  passScore!: string;
  startsAt?: Date;
  endsAt?: Date;
  isPublished!: boolean;
  creator!: {
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
  questions!: Array<{
    id: string;
    statement: string;
    questionType: string;
    options?: string[];
    points: string;
    position: number;
  }>;
  attemptsCount!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
