import { ProblemDifficulty, ProblemStatus } from '../../../core/enums';

export class ProblemResponseDto {
  id!: string;
  title!: string;
  slug!: string;
  statement!: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  sampleInput?: string;
  sampleOutput?: string;
  explanation?: string;
  difficulty!: ProblemDifficulty;
  status!: ProblemStatus;
  timeLimitMs!: number;
  memoryLimitMb!: number;
  isPublished!: boolean;
  creator!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tags!: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  testCasesCount!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
