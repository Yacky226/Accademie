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
import { PROGRAM_PERMISSIONS } from '../../core/constants';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/enums';
import { CreateProgramStepDto } from './dto/create-program-step.dto';
import { CreateStudentProgramDto } from './dto/create-student-program.dto';
import { ProgramResponseDto } from './dto/program-response.dto';
import { UpdateProgramStepDto } from './dto/update-program-step.dto';
import { UpdateStudentProgramDto } from './dto/update-student-program.dto';
import { StudentProgramEntity } from './entities/student-program.entity';
import { ProgramsService } from './programs.service';

@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Permissions(PROGRAM_PERMISSIONS.PROGRAMS_READ)
  @Get()
  async listPrograms(): Promise<ProgramResponseDto[]> {
    const programs = await this.programsService.listPrograms();
    return programs.map((program) => this.toResponse(program));
  }

  @Permissions(PROGRAM_PERMISSIONS.PROGRAMS_READ)
  @Get(':id')
  async getProgramById(@Param('id') id: string): Promise<ProgramResponseDto> {
    const program = await this.programsService.getProgramById(id);
    return this.toResponse(program);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(PROGRAM_PERMISSIONS.PROGRAMS_CREATE)
  @Post()
  async createProgram(
    @Body() dto: CreateStudentProgramDto,
    @CurrentUser('sub') teacherId: string,
  ): Promise<ProgramResponseDto> {
    const program = await this.programsService.createProgram(dto, teacherId);
    return this.toResponse(program);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(PROGRAM_PERMISSIONS.PROGRAMS_UPDATE)
  @Patch(':id')
  async updateProgram(
    @Param('id') id: string,
    @Body() dto: UpdateStudentProgramDto,
  ): Promise<ProgramResponseDto> {
    const program = await this.programsService.updateProgram(id, dto);
    return this.toResponse(program);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(PROGRAM_PERMISSIONS.PROGRAM_STEPS_MANAGE)
  @Post(':id/steps')
  async addStep(
    @Param('id') programId: string,
    @Body() dto: CreateProgramStepDto,
  ) {
    return this.programsService.addStep(programId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(PROGRAM_PERMISSIONS.PROGRAM_STEPS_MANAGE)
  @Patch(':id/steps/:stepId')
  async updateStep(
    @Param('id') programId: string,
    @Param('stepId') stepId: string,
    @Body() dto: UpdateProgramStepDto,
  ) {
    return this.programsService.updateStep(programId, stepId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(PROGRAM_PERMISSIONS.PROGRAM_STEPS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id/steps/:stepId')
  async deleteStep(@Param('id') programId: string, @Param('stepId') stepId: string): Promise<void> {
    await this.programsService.deleteStep(programId, stepId);
  }

  @Roles(UserRole.ADMIN)
  @Permissions(PROGRAM_PERMISSIONS.PROGRAMS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteProgram(@Param('id') id: string): Promise<void> {
    await this.programsService.deleteProgram(id);
  }

  private toResponse(program: StudentProgramEntity): ProgramResponseDto {
    return {
      id: program.id,
      title: program.title,
      description: program.description,
      goal: program.goal,
      status: program.status,
      startDate: program.startDate,
      endDate: program.endDate,
      student: {
        id: program.student.id,
        firstName: program.student.firstName,
        lastName: program.student.lastName,
        email: program.student.email,
      },
      teacher: {
        id: program.teacher.id,
        firstName: program.teacher.firstName,
        lastName: program.teacher.lastName,
        email: program.teacher.email,
      },
      steps: (program.steps ?? []).map((step) => ({
        id: step.id,
        title: step.title,
        description: step.description,
        position: step.position,
        status: step.status,
        dueDate: step.dueDate,
        completedAt: step.completedAt,
      })),
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
    };
  }
}
