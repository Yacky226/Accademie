import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationChannel,
  ProgramStatus,
  ProgramStepStatus,
  UserRole,
} from '../../core/enums';
import { NotificationEntity } from '../notifications/entities/notification.entity';
import { NotificationsRepository } from '../notifications/repositories/notifications.repository';
import { CreateProgramStepDto } from './dto/create-program-step.dto';
import { CreateStudentProgramDto } from './dto/create-student-program.dto';
import { UpdateMyProgramStepProgressDto } from './dto/update-my-program-step-progress.dto';
import { UpdateProgramStepDto } from './dto/update-program-step.dto';
import { UpdateStudentProgramDto } from './dto/update-student-program.dto';
import { ProgramStepEntity } from './entities/program-step.entity';
import { StudentProgramEntity } from './entities/student-program.entity';
import { ProgramsRepository } from './repositories/programs.repository';

@Injectable()
export class ProgramsService {
  constructor(
    private readonly programsRepository: ProgramsRepository,
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async listPrograms(): Promise<StudentProgramEntity[]> {
    return this.programsRepository.findAllPrograms();
  }

  async listProgramsForViewer(
    userId: string,
    roles: string[],
  ): Promise<StudentProgramEntity[]> {
    if (this.hasRole(roles, UserRole.ADMIN)) {
      return this.programsRepository.findAllPrograms();
    }

    if (this.hasRole(roles, UserRole.TEACHER)) {
      return this.programsRepository.findProgramsByTeacherId(userId);
    }

    return this.programsRepository.findProgramsByStudentId(userId);
  }

  async getProgramById(programId: string): Promise<StudentProgramEntity> {
    const program = await this.programsRepository.findProgramById(programId);
    if (!program) {
      throw new NotFoundException('Student program not found');
    }

    return program;
  }

  async getProgramByIdForViewer(
    programId: string,
    userId: string,
    roles: string[],
  ): Promise<StudentProgramEntity> {
    const program = await this.getProgramById(programId);

    if (this.hasRole(roles, UserRole.ADMIN)) {
      return program;
    }

    if (
      this.hasRole(roles, UserRole.TEACHER) &&
      program.teacher.id === userId
    ) {
      return program;
    }

    if (
      this.hasRole(roles, UserRole.STUDENT) &&
      program.student.id === userId
    ) {
      return program;
    }

    throw new NotFoundException('Student program not found');
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
    program.startDate = dto.startDate
      ? new Date(dto.startDate)
      : program.startDate;
    program.endDate = dto.endDate ? new Date(dto.endDate) : program.endDate;

    return this.programsRepository.saveProgram(program);
  }

  async deleteProgram(programId: string): Promise<void> {
    const program = await this.getProgramById(programId);
    await this.programsRepository.removeProgram(program);
  }

  async addStep(
    programId: string,
    dto: CreateProgramStepDto,
  ): Promise<ProgramStepEntity> {
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

    const savedStep = await this.programsRepository.saveStep(step);
    await this.syncStepReminder(program, savedStep);

    return savedStep;
  }

  async updateStep(
    programId: string,
    stepId: string,
    dto: UpdateProgramStepDto,
  ): Promise<ProgramStepEntity> {
    const program = await this.getProgramById(programId);
    const step = (program.steps ?? []).find(
      (programStep) => programStep.id === stepId,
    );
    if (!step) {
      throw new NotFoundException('Program step not found');
    }

    if (dto.position !== undefined) {
      const duplicatePosition = (program.steps ?? []).find(
        (programStep) =>
          programStep.position === dto.position && programStep.id !== step.id,
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

    const savedStep = await this.programsRepository.saveStep(step);
    await this.syncStepReminder(program, savedStep);

    return savedStep;
  }

  async updateMyStepProgress(
    programId: string,
    stepId: string,
    dto: UpdateMyProgramStepProgressDto,
    userId: string,
    roles: string[],
  ): Promise<StudentProgramEntity> {
    const program = await this.getProgramByIdForViewer(programId, userId, roles);

    if (
      !this.hasRole(roles, UserRole.ADMIN) &&
      !this.hasRole(roles, UserRole.TEACHER) &&
      program.student.id !== userId
    ) {
      throw new NotFoundException('Student program not found');
    }

    const step = (program.steps ?? []).find(
      (programStep) => programStep.id === stepId,
    );
    if (!step) {
      throw new NotFoundException('Program step not found');
    }

    step.status = dto.status;

    if (step.status === ProgramStepStatus.COMPLETED && !step.completedAt) {
      step.completedAt = new Date();
    }

    if (step.status !== ProgramStepStatus.COMPLETED) {
      step.completedAt = undefined;
    }

    await this.programsRepository.saveStep(step);
    await this.syncStepReminder(program, step);

    return this.getProgramByIdForViewer(programId, userId, roles);
  }

  async deleteStep(programId: string, stepId: string): Promise<void> {
    const program = await this.getProgramById(programId);
    const step = (program.steps ?? []).find(
      (programStep) => programStep.id === stepId,
    );
    if (!step) {
      throw new NotFoundException('Program step not found');
    }

    await this.clearStepReminder(program.student.id, step.id);
    await this.programsRepository.removeStep(step);
  }

  private async syncStepReminder(
    program: StudentProgramEntity,
    step: ProgramStepEntity,
  ): Promise<void> {
    if (
      !step.dueDate ||
      step.status === ProgramStepStatus.COMPLETED ||
      step.status === ProgramStepStatus.SKIPPED
    ) {
      await this.clearStepReminder(program.student.id, step.id);
      return;
    }

    const existingReminder =
      await this.notificationsRepository.findProgramStepReminder(
        program.student.id,
        step.id,
      );
    const dueDateLabel = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(step.dueDate);
    const reminderType =
      step.dueDate.getTime() <= Date.now()
        ? 'PROGRAM_STEP_OVERDUE'
        : 'PROGRAM_STEP_DUE';
    const message = `L etape "${step.title}" du programme "${program.title}" doit etre terminee avant le ${dueDateLabel}.`;

    if (existingReminder) {
      existingReminder.title = `Echeance: ${step.title}`;
      existingReminder.message = message;
      existingReminder.type = reminderType;
      existingReminder.isRead = false;
      existingReminder.readAt = undefined;
      existingReminder.metadata = {
        kind: 'course',
        source: 'program-step',
        programId: program.id,
        programTitle: program.title,
        stepId: step.id,
        stepTitle: step.title,
        dueDate: step.dueDate.toISOString(),
        actionLabel: 'Voir le calendrier',
        actionHref: '/student/calendar',
      };
      existingReminder.sender = program.teacher;
      await this.notificationsRepository.saveNotification(existingReminder);
      return;
    }

    const notification = new NotificationEntity();
    notification.title = `Echeance: ${step.title}`;
    notification.message = message;
    notification.type = reminderType;
    notification.channel = NotificationChannel.IN_APP;
    notification.metadata = {
      kind: 'course',
      source: 'program-step',
      programId: program.id,
      programTitle: program.title,
      stepId: step.id,
      stepTitle: step.title,
      dueDate: step.dueDate.toISOString(),
      actionLabel: 'Voir le calendrier',
      actionHref: '/student/calendar',
    };
    notification.recipient = program.student;
    notification.sender = program.teacher;

    await this.notificationsRepository.saveNotification(notification);
  }

  private async clearStepReminder(
    recipientId: string,
    stepId: string,
  ): Promise<void> {
    const existingReminder =
      await this.notificationsRepository.findProgramStepReminder(
        recipientId,
        stepId,
      );

    if (!existingReminder) {
      return;
    }

    await this.notificationsRepository.softDeleteNotification(existingReminder);
  }

  private hasRole(roles: string[], role: UserRole): boolean {
    return roles.includes(role);
  }
}
