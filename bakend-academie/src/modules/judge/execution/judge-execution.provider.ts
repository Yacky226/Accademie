import type {
  JudgeExecutionRequest,
  JudgeExecutionResult,
} from './judge-execution.types';

export interface JudgeExecutionProvider {
  readonly name: string;
  isEnabled(): boolean;
  execute(request: JudgeExecutionRequest): Promise<JudgeExecutionResult>;
}

export const JUDGE_EXECUTION_PROVIDER = Symbol('JUDGE_EXECUTION_PROVIDER');
