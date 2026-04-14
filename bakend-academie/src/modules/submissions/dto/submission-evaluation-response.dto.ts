import { SubmissionStatus } from '../../../core/enums';

export class SubmissionEvaluationTestResultResponseDto {
  position!: number;
  points!: number;
  isHidden!: boolean;
  passed!: boolean;
  status!: SubmissionStatus;
  verdict!: string;
  input?: string;
  expectedOutput?: string;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  timeMs?: number;
  memoryKb?: number;
  exitCode?: number;
}

export class SubmissionEvaluationResponseDto {
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
  passedCount!: number;
  totalCount!: number;
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
  testResults!: SubmissionEvaluationTestResultResponseDto[];
}
