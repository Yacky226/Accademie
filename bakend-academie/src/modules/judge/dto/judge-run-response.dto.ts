import { SubmissionStatus } from '../../../core/enums';

export class JudgeRunResponseDto {
  id!: string;
  token!: string;
  sourceCode!: string;
  stdin?: string;
  expectedOutput?: string;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  status!: SubmissionStatus;
  verdict?: string;
  timeMs?: number;
  memoryKb?: number;
  exitCode?: number;
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
  createdAt!: Date;
  updatedAt!: Date;
}
