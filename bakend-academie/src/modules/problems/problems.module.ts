import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { ProblemEntity } from './entities/problem.entity';
import { ProblemTagEntity } from './entities/problem-tag.entity';
import { ProblemTestCaseEntity } from './entities/problem-testcase.entity';
import { SupportedLanguageEntity } from './entities/supported-language.entity';
import { ProblemsController } from './problems.controller';
import { ProblemsService } from './problems.service';
import { ProblemsRepository } from './repositories/problems.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProblemEntity,
      ProblemTagEntity,
      ProblemTestCaseEntity,
      SupportedLanguageEntity,
      UserEntity,
    ]),
  ],
  controllers: [ProblemsController],
  providers: [ProblemsService, ProblemsRepository],
  exports: [ProblemsService, ProblemsRepository],
})
export class ProblemsModule {}
