import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { ProgramStepEntity } from './entities/program-step.entity';
import { StudentProgramEntity } from './entities/student-program.entity';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';
import { ProgramsRepository } from './repositories/programs.repository';

@Module({
	imports: [TypeOrmModule.forFeature([StudentProgramEntity, ProgramStepEntity, UserEntity])],
	controllers: [ProgramsController],
	providers: [ProgramsService, ProgramsRepository],
	exports: [ProgramsService, ProgramsRepository],
})
export class ProgramsModule {}

