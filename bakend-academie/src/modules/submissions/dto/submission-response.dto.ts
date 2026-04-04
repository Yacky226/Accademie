import { SubmissionStatus } from '../../../core/enums';

export class SubmissionResponseDto {
  id!: string;
  sourceCode!: string;
  stdin?: string;
  expectedOutput?: string;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  status!: SubmissionStatus;
  verdict?: string;
  score?: string;
  maxScore!: string;
  timeMs?: number;
  memoryKb?: number;
  exitCode?: number;
  submittedAt!: Date;
  evaluatedAt?: Date;
  requester!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  problem?: {
    id: string;
    title: string;
    slug: string;
  };
  language?: {
    id: string;
    name: string;
    slug: string;
  };
  judgeRunId?: string;
  createdAt!: Date;
  updatedAt!: Date;
}
