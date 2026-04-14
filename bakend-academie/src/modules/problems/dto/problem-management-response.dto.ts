import { ProblemDifficulty, ProblemStatus } from '../../../core/enums';

export class ProblemManagementResponseDto {
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
  testCases!: Array<{
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    points: string;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  createdAt!: Date;
  updatedAt!: Date;
}
