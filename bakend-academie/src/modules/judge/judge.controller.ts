import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { JUDGE_PERMISSIONS } from '../../core/constants';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/enums';
import { CreateJudgeRunDto } from './dto/create-judge-run.dto';
import { JudgeRunResponseDto } from './dto/judge-run-response.dto';
import { UpdateJudgeRunResultDto } from './dto/update-judge-run-result.dto';
import { JudgeRunEntity } from './entities/judge-run.entity';
import { JudgeService } from './judge.service';

@Controller('judge')
export class JudgeController {
  constructor(private readonly judgeService: JudgeService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(JUDGE_PERMISSIONS.JUDGE_RUNS_READ)
  @Get('runs')
  async listRuns(): Promise<JudgeRunResponseDto[]> {
    const runs = await this.judgeService.listRuns();
    return runs.map((run) => this.toResponse(run));
  }

  @Permissions(JUDGE_PERMISSIONS.JUDGE_RUNS_READ)
  @Get('runs/me')
  async listMyRuns(@CurrentUser('sub') userId: string): Promise<JudgeRunResponseDto[]> {
    const runs = await this.judgeService.listMyRuns(userId);
    return runs.map((run) => this.toResponse(run));
  }

  @Permissions(JUDGE_PERMISSIONS.JUDGE_RUNS_READ)
  @Get('runs/:id')
  async getRunById(@Param('id') id: string): Promise<JudgeRunResponseDto> {
    const run = await this.judgeService.getRunById(id);
    return this.toResponse(run);
  }

  @Permissions(JUDGE_PERMISSIONS.JUDGE_RUNS_CREATE)
  @Post('runs')
  async createRun(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateJudgeRunDto,
  ): Promise<JudgeRunResponseDto> {
    const run = await this.judgeService.createRun(userId, dto);
    return this.toResponse(run);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(JUDGE_PERMISSIONS.JUDGE_RUNS_UPDATE)
  @Patch('runs/:id/result')
  async updateRunResult(
    @Param('id') id: string,
    @Body() dto: UpdateJudgeRunResultDto,
  ): Promise<JudgeRunResponseDto> {
    const run = await this.judgeService.updateRunResult(id, dto);
    return this.toResponse(run);
  }

  @Roles(UserRole.ADMIN)
  @Permissions(JUDGE_PERMISSIONS.JUDGE_RUNS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('runs/:id')
  async deleteRun(@Param('id') id: string): Promise<void> {
    await this.judgeService.deleteRun(id);
  }

  private toResponse(run: JudgeRunEntity): JudgeRunResponseDto {
    return {
      id: run.id,
      token: run.token,
      sourceCode: run.sourceCode,
      stdin: run.stdin,
      expectedOutput: run.expectedOutput,
      stdout: run.stdout,
      stderr: run.stderr,
      compileOutput: run.compileOutput,
      status: run.status,
      verdict: run.verdict,
      timeMs: run.timeMs,
      memoryKb: run.memoryKb,
      exitCode: run.exitCode,
      requester: {
        id: run.requester.id,
        firstName: run.requester.firstName,
        lastName: run.requester.lastName,
        email: run.requester.email,
      },
      problem: run.problem
        ? {
            id: run.problem.id,
            title: run.problem.title,
            slug: run.problem.slug,
          }
        : undefined,
      language: run.language
        ? {
            id: run.language.id,
            name: run.language.name,
            slug: run.language.slug,
          }
        : undefined,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    };
  }
}
