import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProblemEntity } from '../problems/entities/problem.entity';
import { SupportedLanguageEntity } from '../problems/entities/supported-language.entity';
import { SubmissionEntity } from '../submissions/entities/submission.entity';
import { UserEntity } from '../users/entities/user.entity';
import { JudgeController } from './judge.controller';
import { JudgeRunEntity } from './entities/judge-run.entity';
import { JUDGE_EXECUTION_PROVIDER } from './execution/judge-execution.provider';
import { JudgeExecutionService } from './execution/judge-execution.service';
import { Judge0ExecutionProvider } from './execution/providers/judge0-execution.provider';
import { JudgeQueueService } from './judge-queue.service';
import { JudgeRepository } from './repositories/judge.repository';
import { JudgeService } from './judge.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JudgeRunEntity,
      UserEntity,
      ProblemEntity,
      SupportedLanguageEntity,
      SubmissionEntity,
    ]),
  ],
  controllers: [JudgeController],
  providers: [
    JudgeService,
    JudgeRepository,
    JudgeExecutionService,
    Judge0ExecutionProvider,
    JudgeQueueService,
    {
      provide: JUDGE_EXECUTION_PROVIDER,
      useExisting: Judge0ExecutionProvider,
    },
  ],
  exports: [JudgeService, JudgeRepository],
})
export class JudgeModule {}
