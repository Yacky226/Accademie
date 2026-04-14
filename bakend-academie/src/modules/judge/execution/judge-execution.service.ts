import { Inject, Injectable } from '@nestjs/common';
import { SubmissionStatus } from '../../../core/enums';
import { ProblemEntity } from '../../problems/entities/problem.entity';
import { SupportedLanguageEntity } from '../../problems/entities/supported-language.entity';
import { JUDGE_EXECUTION_PROVIDER } from './judge-execution.provider';
import type { JudgeExecutionProvider } from './judge-execution.provider';
import {
  type JudgeEvaluationCase,
  type JudgeExecutionRequest,
  type JudgeExecutionResult,
  type JudgeSubmissionEvaluation,
  type JudgeSubmissionTestResult,
} from './judge-execution.types';

type ExecuteRunParams = {
  sourceCode: string;
  stdin?: string;
  expectedOutput?: string;
  language: SupportedLanguageEntity;
  problem?: ProblemEntity;
};

type EvaluateSubmissionParams = {
  sourceCode: string;
  stdin?: string;
  expectedOutput?: string;
  language: SupportedLanguageEntity;
  problem?: ProblemEntity;
};

@Injectable()
export class JudgeExecutionService {
  constructor(
    @Inject(JUDGE_EXECUTION_PROVIDER)
    private readonly judgeExecutionProvider: JudgeExecutionProvider,
  ) {}

  async executeRun(params: ExecuteRunParams): Promise<JudgeExecutionResult> {
    return this.executeCase(
      this.buildExecutionRequest({
        expectedOutput: params.expectedOutput,
        language: params.language,
        problem: params.problem,
        sourceCode: params.sourceCode,
        stdin: params.stdin,
      }),
    );
  }

  async evaluateSubmission(
    params: EvaluateSubmissionParams,
  ): Promise<JudgeSubmissionEvaluation> {
    const evaluationCases = this.resolveEvaluationCases(
      params.problem,
      params.stdin,
      params.expectedOutput,
    );

    if (evaluationCases.length === 0) {
      return {
        ...this.buildFailedResult(
          'No evaluation test cases are configured for this problem yet.',
        ),
        maxScore: 100,
        passedCount: 0,
        score: 0,
        testResults: [],
        totalCount: 0,
      };
    }

    const totalCount = evaluationCases.length;
    const usesExplicitPoints = evaluationCases.some(
      (testCase) => testCase.points > 0,
    );
    const maxScore = usesExplicitPoints
      ? this.roundScore(
          evaluationCases.reduce(
            (total, testCase) => total + testCase.points,
            0,
          ),
        )
      : 100;
    const defaultCaseScore = totalCount > 0 ? maxScore / totalCount : 0;
    const caseResults: Array<{
      publicResult: JudgeSubmissionTestResult;
      result: JudgeExecutionResult;
      testCase: JudgeEvaluationCase;
    }> = [];
    let passedCount = 0;
    let score = 0;

    for (const testCase of evaluationCases) {
      const result = await this.executeCase(
        this.buildExecutionRequest({
          expectedOutput: testCase.expectedOutput,
          language: params.language,
          problem: params.problem,
          sourceCode: params.sourceCode,
          stdin: testCase.input,
        }),
      );

      const passedBeforeCurrentCase = passedCount;
      const passedCurrentCase = result.status === SubmissionStatus.ACCEPTED;

      caseResults.push({
        publicResult: this.toPublicTestResult(
          testCase,
          result,
          passedBeforeCurrentCase,
          totalCount,
        ),
        result,
        testCase,
      });

      if (passedCurrentCase) {
        passedCount += 1;
        score += usesExplicitPoints ? testCase.points : defaultCaseScore;
      }

      if (
        result.status === SubmissionStatus.COMPILATION_ERROR ||
        result.status === SubmissionStatus.FAILED
      ) {
        break;
      }
    }

    const totalTimeMs = caseResults.reduce(
      (total, item) => total + (item.result.timeMs ?? 0),
      0,
    );
    const peakMemoryKb = caseResults.reduce(
      (peakMemory, item) => Math.max(peakMemory, item.result.memoryKb ?? 0),
      0,
    );
    const firstFailure = caseResults.find(
      (item) => item.result.status !== SubmissionStatus.ACCEPTED,
    );
    const lastResult = caseResults.at(-1)?.result;

    if (!lastResult) {
      return {
        ...this.buildFailedResult(
          'The execution provider did not return any result.',
        ),
        maxScore,
        passedCount,
        score: 0,
        testResults: [],
        totalCount,
      };
    }

    if (!firstFailure) {
      return {
        exitCode: lastResult.exitCode,
        maxScore,
        memoryKb: peakMemoryKb || undefined,
        passedCount,
        score: this.roundScore(score),
        status: SubmissionStatus.ACCEPTED,
        stdout: `All ${totalCount} secured test cases passed.`,
        stderr: undefined,
        compileOutput: undefined,
        testResults: caseResults.map((item) => item.publicResult),
        timeMs: totalTimeMs || undefined,
        totalCount,
        verdict: 'ACCEPTED',
      };
    }

    const aggregateBase = firstFailure.result;
    const publicFailure = !firstFailure.testCase.isHidden;
    const secureFailureMessage = this.buildSecuredFailureMessage(
      firstFailure.result.status,
      passedCount,
      totalCount,
    );

    return {
      compileOutput:
        aggregateBase.status === SubmissionStatus.COMPILATION_ERROR
          ? aggregateBase.compileOutput
          : publicFailure
            ? aggregateBase.compileOutput
            : undefined,
      exitCode: aggregateBase.exitCode,
      maxScore,
      memoryKb: peakMemoryKb || aggregateBase.memoryKb,
      passedCount,
      score: this.roundScore(score),
      status: aggregateBase.status,
      stdout:
        publicFailure && aggregateBase.status === SubmissionStatus.WRONG_ANSWER
          ? aggregateBase.stdout
          : undefined,
      stderr: publicFailure ? aggregateBase.stderr : secureFailureMessage,
      testResults: caseResults.map((item) => item.publicResult),
      timeMs: totalTimeMs || aggregateBase.timeMs,
      totalCount,
      verdict:
        aggregateBase.verdict || this.verdictFromStatus(aggregateBase.status),
    };
  }

  private buildExecutionRequest(params: {
    sourceCode: string;
    stdin?: string;
    expectedOutput?: string;
    language: SupportedLanguageEntity;
    problem?: ProblemEntity;
  }): JudgeExecutionRequest {
    return {
      expectedOutput: params.expectedOutput,
      judge0LanguageId: params.language.judge0LanguageId,
      languageLabel: params.language.name,
      memoryLimitMb: params.problem?.memoryLimitMb ?? 256,
      sourceCode: params.sourceCode,
      stdin: params.stdin,
      timeLimitMs: params.problem?.timeLimitMs ?? 1000,
    };
  }

  private async executeCase(
    request: JudgeExecutionRequest,
  ): Promise<JudgeExecutionResult> {
    try {
      return await this.judgeExecutionProvider.execute(request);
    } catch (error) {
      return this.buildFailedResult(
        error instanceof Error
          ? error.message
          : 'The execution provider is temporarily unavailable.',
      );
    }
  }

  private resolveEvaluationCases(
    problem: ProblemEntity | undefined,
    stdin?: string,
    expectedOutput?: string,
  ): JudgeEvaluationCase[] {
    const sortedProblemCases =
      problem?.testCases
        ?.map((testCase) => ({
          expectedOutput: testCase.expectedOutput,
          input: testCase.input,
          isHidden: testCase.isHidden,
          points: Number.parseFloat(testCase.points || '0') || 0,
          position: testCase.position,
        }))
        .sort((left, right) => left.position - right.position) ?? [];

    if (sortedProblemCases.length > 0) {
      return sortedProblemCases;
    }

    if (expectedOutput === undefined) {
      return [];
    }

    return [
      {
        expectedOutput,
        input: stdin,
        isHidden: false,
        points: 100,
        position: 1,
      },
    ];
  }

  private buildFailedResult(message: string): JudgeExecutionResult {
    return {
      compileOutput: message,
      status: SubmissionStatus.FAILED,
      verdict: 'FAILED',
    };
  }

  private toPublicTestResult(
    testCase: JudgeEvaluationCase,
    result: JudgeExecutionResult,
    passedCount: number,
    totalCount: number,
  ): JudgeSubmissionTestResult {
    const isPublicCase = !testCase.isHidden;
    const passed = result.status === SubmissionStatus.ACCEPTED;

    return {
      compileOutput:
        result.status === SubmissionStatus.COMPILATION_ERROR
          ? result.compileOutput
          : isPublicCase
            ? result.compileOutput
            : undefined,
      exitCode: result.exitCode,
      expectedOutput: isPublicCase ? testCase.expectedOutput : undefined,
      input: isPublicCase ? testCase.input : undefined,
      isHidden: testCase.isHidden,
      memoryKb: result.memoryKb,
      passed,
      points: testCase.points,
      position: testCase.position,
      status: result.status,
      stderr: isPublicCase
        ? result.stderr
        : passed
          ? undefined
          : this.buildSecuredFailureMessage(
              result.status,
              passedCount,
              totalCount,
            ),
      stdout: isPublicCase ? result.stdout : undefined,
      timeMs: result.timeMs,
      verdict: result.verdict || this.verdictFromStatus(result.status),
    };
  }

  private buildSecuredFailureMessage(
    status: SubmissionStatus,
    passedCount: number,
    totalCount: number,
  ): string {
    const progressPrefix = `${passedCount}/${totalCount} test cases passed.`;

    switch (status) {
      case SubmissionStatus.WRONG_ANSWER:
        return `${progressPrefix} One or more secured test cases failed.`;
      case SubmissionStatus.TIME_LIMIT_EXCEEDED:
        return `${progressPrefix} Time limit exceeded on the secured test suite.`;
      case SubmissionStatus.MEMORY_LIMIT_EXCEEDED:
        return `${progressPrefix} Memory limit exceeded on the secured test suite.`;
      case SubmissionStatus.RUNTIME_ERROR:
        return `${progressPrefix} Execution failed on the secured test suite.`;
      default:
        return `${progressPrefix} Evaluation stopped before completion.`;
    }
  }

  private verdictFromStatus(status: SubmissionStatus): string {
    switch (status) {
      case SubmissionStatus.ACCEPTED:
        return 'ACCEPTED';
      case SubmissionStatus.WRONG_ANSWER:
        return 'WRONG_ANSWER';
      case SubmissionStatus.TIME_LIMIT_EXCEEDED:
        return 'TIME_LIMIT_EXCEEDED';
      case SubmissionStatus.MEMORY_LIMIT_EXCEEDED:
        return 'MEMORY_LIMIT_EXCEEDED';
      case SubmissionStatus.RUNTIME_ERROR:
        return 'RUNTIME_ERROR';
      case SubmissionStatus.COMPILATION_ERROR:
        return 'COMPILATION_ERROR';
      default:
        return 'FAILED';
    }
  }

  private roundScore(value: number): number {
    return Number.parseFloat(value.toFixed(2));
  }
}
