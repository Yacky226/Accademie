import { SubmissionStatus } from '../../../core/enums';

export interface JudgeExecutionRequest {
  sourceCode: string;
  stdin?: string;
  expectedOutput?: string;
  judge0LanguageId?: number;
  languageLabel: string;
  timeLimitMs: number;
  memoryLimitMb: number;
}

export interface JudgeExecutionResult {
  status: SubmissionStatus;
  verdict: string;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  timeMs?: number;
  memoryKb?: number;
  exitCode?: number;
}

export interface JudgeEvaluationCase {
  input?: string;
  expectedOutput?: string;
  isHidden: boolean;
  points: number;
  position: number;
}

export interface JudgeSubmissionTestResult extends JudgeExecutionResult {
  position: number;
  points: number;
  isHidden: boolean;
  passed: boolean;
  input?: string;
  expectedOutput?: string;
}

export interface JudgeSubmissionEvaluation extends JudgeExecutionResult {
  score: number;
  maxScore: number;
  passedCount: number;
  testResults: JudgeSubmissionTestResult[];
  totalCount: number;
}
