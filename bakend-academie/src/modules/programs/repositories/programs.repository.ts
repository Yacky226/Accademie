import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { ProgramStepEntity } from '../entities/program-step.entity';
import { StudentProgramEntity } from '../entities/student-program.entity';

@Injectable()
export class ProgramsRepository {
  constructor(
    @InjectRepository(StudentProgramEntity)
    private readonly programsRepository: Repository<StudentProgramEntity>,
    @InjectRepository(ProgramStepEntity)
    private readonly stepsRepository: Repository<ProgramStepEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async findAllPrograms(): Promise<StudentProgramEntity[]> {
    return this.programsRepository.find({
      relations: {
        student: true,
        teacher: true,
        steps: true,
      },
      order: {
        createdAt: 'DESC',
        steps: { position: 'ASC' },
      },
    });
  }

  async findProgramById(
    programId: string,
  ): Promise<StudentProgramEntity | null> {
    return this.programsRepository.findOne({
      where: { id: programId },
      relations: {
        student: true,
        teacher: true,
        steps: true,
      },
    });
  }

  async findUserById(userId: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
  }

  async saveProgram(
    program: StudentProgramEntity,
  ): Promise<StudentProgramEntity> {
    return this.programsRepository.save(program);
  }

  async removeProgram(program: StudentProgramEntity): Promise<void> {
    await this.programsRepository.remove(program);
  }

  async findStepById(stepId: string): Promise<ProgramStepEntity | null> {
    return this.stepsRepository.findOne({
      where: { id: stepId },
      relations: { studentProgram: true },
    });
  }

  async saveStep(step: ProgramStepEntity): Promise<ProgramStepEntity> {
    return this.stepsRepository.save(step);
  }

  async removeStep(step: ProgramStepEntity): Promise<void> {
    await this.stepsRepository.remove(step);
  }
}
