import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JudgeModule } from '../judge/judge.module';
import { JudgeRunEntity } from '../judge/entities/judge-run.entity';
import { ProblemEntity } from '../problems/entities/problem.entity';
import { SupportedLanguageEntity } from '../problems/entities/supported-language.entity';
import { UserEntity } from '../users/entities/user.entity';
import { SubmissionEntity } from './entities/submission.entity';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsRepository } from './repositories/submissions.repository';
import { SubmissionsService } from './submissions.service';

@Module({
  imports: [
    JudgeModule,
    TypeOrmModule.forFeature([
      SubmissionEntity,
      UserEntity,
      ProblemEntity,
      SupportedLanguageEntity,
      JudgeRunEntity,
    ]),
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService, SubmissionsRepository],
  exports: [SubmissionsService, SubmissionsRepository],
})
export class SubmissionsModule {}
