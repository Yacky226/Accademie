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
import { GRADE_PERMISSIONS } from '../../core/constants';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/enums';
import { CreateGradeDto } from './dto/create-grade.dto';
import { GradeResponseDto } from './dto/grade-response.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradeEntity } from './entities/grade.entity';
import { GradesService } from './grades.service';

@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(GRADE_PERMISSIONS.GRADES_READ)
  @Get()
  async listGrades(): Promise<GradeResponseDto[]> {
    const grades = await this.gradesService.listGrades();
    return grades.map((grade) => this.toResponse(grade));
  }

  @Permissions(GRADE_PERMISSIONS.GRADES_READ)
  @Get('me')
  async listMyGrades(
    @CurrentUser('sub') userId: string,
  ): Promise<GradeResponseDto[]> {
    const grades = await this.gradesService.listMyGrades(userId);
    return grades.map((grade) => this.toResponse(grade));
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(GRADE_PERMISSIONS.GRADES_READ)
  @Get('student/:studentId')
  async listGradesByStudent(
    @Param('studentId') studentId: string,
  ): Promise<GradeResponseDto[]> {
    const grades = await this.gradesService.listGradesByStudent(studentId);
    return grades.map((grade) => this.toResponse(grade));
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(GRADE_PERMISSIONS.GRADES_READ)
  @Get(':id')
  async getGradeById(@Param('id') id: string): Promise<GradeResponseDto> {
    const grade = await this.gradesService.getGradeById(id);
    return this.toResponse(grade);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(GRADE_PERMISSIONS.GRADES_CREATE)
  @Post()
  async createGrade(
    @Body() dto: CreateGradeDto,
    @CurrentUser('sub') graderId: string,
  ): Promise<GradeResponseDto> {
    const grade = await this.gradesService.createGrade(dto, graderId);
    return this.toResponse(grade);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(GRADE_PERMISSIONS.GRADES_UPDATE)
  @Patch(':id')
  async updateGrade(
    @Param('id') id: string,
    @Body() dto: UpdateGradeDto,
  ): Promise<GradeResponseDto> {
    const grade = await this.gradesService.updateGrade(id, dto);
    return this.toResponse(grade);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(GRADE_PERMISSIONS.GRADES_PUBLISH)
  @Patch(':id/publish')
  async publishGrade(@Param('id') id: string): Promise<GradeResponseDto> {
    const grade = await this.gradesService.publishGrade(id);
    return this.toResponse(grade);
  }

  @Roles(UserRole.ADMIN)
  @Permissions(GRADE_PERMISSIONS.GRADES_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteGrade(@Param('id') id: string): Promise<void> {
    await this.gradesService.deleteGrade(id);
  }

  private toResponse(grade: GradeEntity): GradeResponseDto {
    return {
      id: grade.id,
      title: grade.title,
      type: grade.type,
      score: grade.score,
      maxScore: grade.maxScore,
      percentage: grade.percentage,
      weight: grade.weight,
      feedback: grade.feedback,
      status: grade.status,
      gradedAt: grade.gradedAt,
      student: {
        id: grade.student.id,
        firstName: grade.student.firstName,
        lastName: grade.student.lastName,
        email: grade.student.email,
      },
      gradedBy: grade.gradedBy
        ? {
            id: grade.gradedBy.id,
            firstName: grade.gradedBy.firstName,
            lastName: grade.gradedBy.lastName,
            email: grade.gradedBy.email,
          }
        : undefined,
      course: grade.course
        ? {
            id: grade.course.id,
            title: grade.course.title,
            slug: grade.course.slug,
          }
        : undefined,
      evaluationAttemptId: grade.evaluationAttempt?.id,
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
    };
  }
}
