import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProgramStatus, ProgramStepStatus } from '../../core/enums';
import { CreateProgramStepDto } from './dto/create-program-step.dto';
import { CreateStudentProgramDto } from './dto/create-student-program.dto';
import { UpdateProgramStepDto } from './dto/update-program-step.dto';
import { UpdateStudentProgramDto } from './dto/update-student-program.dto';
import { ProgramStepEntity } from './entities/program-step.entity';
import { StudentProgramEntity } from './entities/student-program.entity';
import { ProgramsRepository } from './repositories/programs.repository';

@Injectable()
export class ProgramsService {
  constructor(private readonly programsRepository: ProgramsRepository) {}

  async listPrograms(): Promise<StudentProgramEntity[]> {
    return this.programsRepository.findAllPrograms();
  }

  async getProgramById(programId: string): Promise<StudentProgramEntity> {
    const program = await this.programsRepository.findProgramById(programId);
    if (!program) {
      throw new NotFoundException('Student program not found');
    }

    return program;
  }

  async createProgram(
    dto: CreateStudentProgramDto,
    teacherId: string,
  ): Promise<StudentProgramEntity> {
    const student = await this.programsRepository.findUserById(dto.studentId);
    if (!student) {
      throw new NotFoundException('Student user not found');
    }

    const teacher = await this.programsRepository.findUserById(teacherId);
    if (!teacher) {
      throw new NotFoundException('Teacher user not found');
    }

    const program = new StudentProgramEntity();
    program.title = dto.title;
    program.description = dto.description;
    program.goal = dto.goal;
    program.status = dto.status ?? ProgramStatus.DRAFT;
    program.startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    program.endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    program.student = student;
    program.teacher = teacher;

    return this.programsRepository.saveProgram(program);
  }

  async updateProgram(
    programId: string,
    dto: UpdateStudentProgramDto,
  ): Promise<StudentProgramEntity> {
    const program = await this.getProgramById(programId);

    program.title = dto.title ?? program.title;
    program.description = dto.description ?? program.description;
    program.goal = dto.goal ?? program.goal;
    program.status = dto.status ?? program.status;
    program.startDate = dto.startDate ? new Date(dto.startDate) : program.startDate;
    program.endDate = dto.endDate ? new Date(dto.endDate) : program.endDate;

    return this.programsRepository.saveProgram(program);
  }

  async deleteProgram(programId: string): Promise<void> {
    const program = await this.getProgramById(programId);
    await this.programsRepository.removeProgram(program);
  }

  async addStep(programId: string, dto: CreateProgramStepDto): Promise<ProgramStepEntity> {
    const program = await this.getProgramById(programId);

    const duplicatePosition = (program.steps ?? []).find(
      (step) => step.position === dto.position,
    );
    if (duplicatePosition) {
      throw new ConflictException('A step already exists at this position');
    }

    const step = new ProgramStepEntity();
    step.title = dto.title;
    step.description = dto.description;
    step.position = dto.position;
    step.status = dto.status ?? ProgramStepStatus.TODO;
    step.dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    step.completedAt =
      (dto.status ?? ProgramStepStatus.TODO) === ProgramStepStatus.COMPLETED
        ? new Date()
        : undefined;
    step.studentProgram = program;

    return this.programsRepository.saveStep(step);
  }

  async updateStep(
    programId: string,
    stepId: string,
    dto: UpdateProgramStepDto,
  ): Promise<ProgramStepEntity> {
    const step = await this.programsRepository.findStepById(stepId);
    if (!step || step.studentProgram.id !== programId) {
      throw new NotFoundException('Program step not found');
    }

    if (dto.position !== undefined) {
      const program = await this.getProgramById(programId);
      const duplicatePosition = (program.steps ?? []).find(
        (programStep) => programStep.position === dto.position && programStep.id !== step.id,
      );
      if (duplicatePosition) {
        throw new ConflictException('A step already exists at this position');
      }
    }

    step.title = dto.title ?? step.title;
    step.description = dto.description ?? step.description;
    step.position = dto.position ?? step.position;
    step.status = dto.status ?? step.status;
    step.dueDate = dto.dueDate ? new Date(dto.dueDate) : step.dueDate;

    if (step.status === ProgramStepStatus.COMPLETED && !step.completedAt) {
      step.completedAt = new Date();
    }

    if (step.status !== ProgramStepStatus.COMPLETED) {
      step.completedAt = undefined;
    }

    return this.programsRepository.saveStep(step);
  }

  async deleteStep(programId: string, stepId: string): Promise<void> {
    const step = await this.programsRepository.findStepById(stepId);
    if (!step || step.studentProgram.id !== programId) {
      throw new NotFoundException('Program step not found');
    }

    await this.programsRepository.removeStep(step);
  }
}
