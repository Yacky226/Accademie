import { Injectable } from '@nestjs/common';
import { SubmissionStatus } from '../../../../core/enums';
import type { JudgeExecutionProvider } from '../judge-execution.provider';
import type {
  JudgeExecutionRequest,
  JudgeExecutionResult,
} from '../judge-execution.types';

type Judge0Response = {
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  time?: string | number | null;
  memory?: number | null;
  exit_code?: number | null;
  status?: {
    id?: number;
    description?: string;
  } | null;
};

@Injectable()
export class Judge0ExecutionProvider implements JudgeExecutionProvider {
  readonly name = 'judge0';

  isEnabled(): boolean {
    return Boolean(this.getApiUrl());
  }

  async execute(request: JudgeExecutionRequest): Promise<JudgeExecutionResult> {
    const apiUrl = this.getApiUrl();
    if (!apiUrl) {
      throw new Error(
        'Code execution is not configured. Set JUDGE_PROVIDER=judge0 and JUDGE0_API_URL.',
      );
    }

    if (!request.judge0LanguageId) {
      throw new Error(
        `The language "${request.languageLabel}" is not mapped to a Judge0 language id.`,
      );
    }

    const response = await fetch(
      `${apiUrl}/submissions?base64_encoded=false&wait=true`,
      {
        body: JSON.stringify({
          cpu_time_limit: Math.max(request.timeLimitMs / 1000, 0.1),
          expected_output: request.expectedOutput,
          language_id: request.judge0LanguageId,
          memory_limit: Math.max(request.memoryLimitMb * 1024, 32768),
          source_code: request.sourceCode,
          stdin: request.stdin,
          wall_time_limit: Math.max(request.timeLimitMs / 1000 + 0.5, 0.5),
        }),
        headers: this.buildHeaders(),
        method: 'POST',
        signal: AbortSignal.timeout(this.getTimeoutMs()),
      },
    );

    if (!response.ok) {
      throw new Error(await this.readProviderError(response));
    }

    const payload = (await response.json()) as Judge0Response;
    return this.mapResponse(payload);
  }

  private getApiUrl(): string | null {
    const provider = (process.env.JUDGE_PROVIDER ?? 'judge0')
      .trim()
      .toLowerCase();
    const rawApiUrl = process.env.JUDGE0_API_URL?.trim();

    if (provider !== 'judge0' || !rawApiUrl) {
      return null;
    }

    return rawApiUrl.replace(/\/+$/, '');
  }

  private getTimeoutMs(): number {
    const rawTimeout = Number.parseInt(
      process.env.JUDGE0_TIMEOUT_MS ?? '30000',
      10,
    );
    return Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 30000;
  }

  private buildHeaders(): Record<string, string> {
    const authToken = process.env.JUDGE0_AUTH_TOKEN?.trim();

    return {
      ...(authToken ? { 'X-Auth-Token': authToken } : {}),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  }

  private async readProviderError(response: Response): Promise<string> {
    const fallbackMessage = `Judge0 returned ${response.status} ${response.statusText}.`;

    try {
      const responseText = await response.text();
      if (!responseText.trim()) {
        return fallbackMessage;
      }

      return `${fallbackMessage} ${responseText.trim()}`;
    } catch {
      return fallbackMessage;
    }
  }

  private mapResponse(payload: Judge0Response): JudgeExecutionResult {
    const status = this.mapStatus(
      payload.status?.id,
      payload.status?.description,
    );
    const message = this.normalizeValue(payload.message);
    const stderr = this.normalizeValue(payload.stderr);
    const compileOutput = this.normalizeValue(payload.compile_output);

    return {
      compileOutput:
        compileOutput ??
        (status === SubmissionStatus.COMPILATION_ERROR ||
        status === SubmissionStatus.FAILED
          ? message
          : undefined),
      exitCode: payload.exit_code ?? undefined,
      memoryKb:
        typeof payload.memory === 'number' && Number.isFinite(payload.memory)
          ? payload.memory
          : undefined,
      status,
      stderr:
        stderr ??
        (status === SubmissionStatus.RUNTIME_ERROR ||
        status === SubmissionStatus.FAILED
          ? message
          : undefined),
      stdout: this.normalizeValue(payload.stdout),
      timeMs: this.toMilliseconds(payload.time),
      verdict: this.verdictFromStatus(status),
    };
  }

  private mapStatus(statusId?: number, description?: string): SubmissionStatus {
    switch (statusId) {
      case 1:
        return SubmissionStatus.PENDING;
      case 2:
        return SubmissionStatus.RUNNING;
      case 3:
        return SubmissionStatus.ACCEPTED;
      case 4:
        return SubmissionStatus.WRONG_ANSWER;
      case 5:
        return SubmissionStatus.TIME_LIMIT_EXCEEDED;
      case 6:
        return SubmissionStatus.COMPILATION_ERROR;
      case 7:
      case 8:
      case 9:
      case 10:
      case 11:
      case 12:
        return SubmissionStatus.RUNTIME_ERROR;
      case 13:
      case 14:
        return SubmissionStatus.FAILED;
      default:
        return this.mapStatusFromDescription(description);
    }
  }

  private mapStatusFromDescription(description?: string): SubmissionStatus {
    const normalizedDescription = description?.trim().toLowerCase();

    if (!normalizedDescription) {
      return SubmissionStatus.FAILED;
    }

    if (normalizedDescription.includes('accepted')) {
      return SubmissionStatus.ACCEPTED;
    }

    if (normalizedDescription.includes('wrong answer')) {
      return SubmissionStatus.WRONG_ANSWER;
    }

    if (normalizedDescription.includes('time limit')) {
      return SubmissionStatus.TIME_LIMIT_EXCEEDED;
    }

    if (normalizedDescription.includes('memory limit')) {
      return SubmissionStatus.MEMORY_LIMIT_EXCEEDED;
    }

    if (normalizedDescription.includes('compilation')) {
      return SubmissionStatus.COMPILATION_ERROR;
    }

    if (normalizedDescription.includes('runtime')) {
      return SubmissionStatus.RUNTIME_ERROR;
    }

    if (normalizedDescription.includes('queue')) {
      return SubmissionStatus.PENDING;
    }

    if (normalizedDescription.includes('processing')) {
      return SubmissionStatus.RUNNING;
    }

    return SubmissionStatus.FAILED;
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
      case SubmissionStatus.RUNNING:
        return 'RUNNING';
      case SubmissionStatus.PENDING:
        return 'PENDING';
      default:
        return 'FAILED';
    }
  }

  private normalizeValue(value?: string | null): string | undefined {
    if (!value?.trim()) {
      return undefined;
    }

    return value;
  }

  private toMilliseconds(value?: string | number | null): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.round(value * 1000);
    }

    if (typeof value === 'string' && value.trim()) {
      const numericValue = Number.parseFloat(value);
      if (Number.isFinite(numericValue)) {
        return Math.round(numericValue * 1000);
      }
    }

    return undefined;
  }
}
