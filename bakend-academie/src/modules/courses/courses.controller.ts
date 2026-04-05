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
import { COURSE_PERMISSIONS } from '../../core/constants';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/enums';
import { CreateCourseModuleDto } from './dto/create-course-module.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import {
  CourseResponseDto,
  EnrollmentResponseDto,
} from './dto/course-response.dto';
import { UpdateCourseModuleDto } from './dto/update-course-module.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateEnrollmentProgressDto } from './dto/update-enrollment-progress.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CourseEntity } from './entities/course.entity';
import { EnrollmentEntity } from './entities/enrollment.entity';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Permissions(COURSE_PERMISSIONS.COURSES_READ)
  @Get()
  async listCourses(): Promise<CourseResponseDto[]> {
    const courses = await this.coursesService.listCourses();
    return courses.map((course) => this.toCourseResponse(course));
  }

  @Permissions(COURSE_PERMISSIONS.COURSES_READ)
  @Get('enrollments/me')
  async listMyEnrollments(
    @CurrentUser('sub') userId: string,
  ): Promise<EnrollmentResponseDto[]> {
    const enrollments =
      await this.coursesService.listCurrentUserEnrollments(userId);
    return enrollments.map((enrollment) =>
      this.toEnrollmentResponse(enrollment),
    );
  }

  @Public()
  @Get('catalog')
  async listPublishedCourses(): Promise<CourseResponseDto[]> {
    const courses = await this.coursesService.listPublishedCourses();
    return courses.map((course) => this.toCourseResponse(course));
  }

  @Public()
  @Get('catalog/:slug')
  async getPublishedCourseBySlug(
    @Param('slug') slug: string,
  ): Promise<CourseResponseDto> {
    const course = await this.coursesService.getPublishedCourseBySlug(slug);
    return this.toCourseResponse(course);
  }

  @Permissions(COURSE_PERMISSIONS.COURSES_READ)
  @Get(':id')
  async getCourseById(@Param('id') id: string): Promise<CourseResponseDto> {
    const course = await this.coursesService.getCourseById(id);
    return this.toCourseResponse(course);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(COURSE_PERMISSIONS.COURSES_CREATE)
  @Post()
  async createCourse(
    @Body() dto: CreateCourseDto,
    @CurrentUser('sub') creatorId: string,
  ): Promise<CourseResponseDto> {
    const course = await this.coursesService.createCourse(dto, creatorId);
    return this.toCourseResponse(course);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(COURSE_PERMISSIONS.COURSES_UPDATE)
  @Patch(':id')
  async updateCourse(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ): Promise<CourseResponseDto> {
    const course = await this.coursesService.updateCourse(id, dto);
    return this.toCourseResponse(course);
  }

  @Roles(UserRole.ADMIN)
  @Permissions(COURSE_PERMISSIONS.COURSES_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteCourse(@Param('id') id: string): Promise<void> {
    await this.coursesService.deleteCourse(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(COURSE_PERMISSIONS.COURSES_UPDATE)
  @Post(':id/modules')
  async addCourseModule(
    @Param('id') courseId: string,
    @Body() dto: CreateCourseModuleDto,
  ) {
    return this.coursesService.addCourseModule(courseId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(COURSE_PERMISSIONS.COURSES_UPDATE)
  @Patch(':id/modules/:moduleId')
  async updateCourseModule(
    @Param('id') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: UpdateCourseModuleDto,
  ) {
    return this.coursesService.updateCourseModule(courseId, moduleId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(COURSE_PERMISSIONS.COURSES_UPDATE)
  @Post(':id/modules/:moduleId/lessons')
  async addLesson(
    @Param('id') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.coursesService.addLesson(courseId, moduleId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(COURSE_PERMISSIONS.COURSES_UPDATE)
  @Patch(':id/modules/:moduleId/lessons/:lessonId')
  async updateLesson(
    @Param('id') courseId: string,
    @Param('moduleId') moduleId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.coursesService.updateLesson(courseId, moduleId, lessonId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(COURSE_PERMISSIONS.ENROLLMENTS_MANAGE)
  @Post(':id/enrollments')
  async enrollStudent(
    @Param('id') courseId: string,
    @Body() dto: CreateEnrollmentDto,
  ): Promise<EnrollmentResponseDto> {
    const enrollment = await this.coursesService.enrollStudent(courseId, dto);
    return this.toEnrollmentResponse(enrollment);
  }

  @Permissions(COURSE_PERMISSIONS.COURSES_READ)
  @Post(':id/enrollments/me')
  async enrollMe(
    @Param('id') courseId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<EnrollmentResponseDto> {
    const enrollment = await this.coursesService.enrollCurrentUser(
      courseId,
      userId,
    );
    return this.toEnrollmentResponse(enrollment);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(COURSE_PERMISSIONS.ENROLLMENTS_MANAGE)
  @Get(':id/enrollments')
  async listCourseEnrollments(
    @Param('id') courseId: string,
  ): Promise<EnrollmentResponseDto[]> {
    const enrollments =
      await this.coursesService.listCourseEnrollments(courseId);
    return enrollments.map((enrollment) =>
      this.toEnrollmentResponse(enrollment),
    );
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(COURSE_PERMISSIONS.ENROLLMENTS_MANAGE)
  @Patch('enrollments/:enrollmentId/progress')
  async updateEnrollmentProgress(
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: UpdateEnrollmentProgressDto,
  ): Promise<EnrollmentResponseDto> {
    const enrollment = await this.coursesService.updateEnrollmentProgress(
      enrollmentId,
      dto,
    );
    return this.toEnrollmentResponse(enrollment);
  }

  private toCourseResponse(course: CourseEntity): CourseResponseDto {
    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      shortDescription: course.shortDescription,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      price: course.price,
      currency: course.currency,
      level: course.level,
      status: course.status,
      isPublished: course.isPublished,
      durationInHours: course.durationInHours,
      certificateEnabled: course.certificateEnabled,
      creator: {
        id: course.creator.id,
        firstName: course.creator.firstName,
        lastName: course.creator.lastName,
        email: course.creator.email,
      },
      modules: (course.modules ?? []).map((moduleEntity) => ({
        id: moduleEntity.id,
        title: moduleEntity.title,
        description: moduleEntity.description,
        position: moduleEntity.position,
        isPublished: moduleEntity.isPublished,
        lessons: (moduleEntity.lessons ?? []).map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          slug: lesson.slug,
          durationInMinutes: lesson.durationInMinutes,
          position: lesson.position,
          isFreePreview: lesson.isFreePreview,
          isPublished: lesson.isPublished,
        })),
      })),
      enrollmentsCount: course.enrollments?.length ?? 0,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }

  private toEnrollmentResponse(
    enrollment: EnrollmentEntity,
  ): EnrollmentResponseDto {
    const firstPublishedLesson = (enrollment.course.modules ?? [])
      .flatMap((moduleEntity) => moduleEntity.lessons ?? [])
      .sort((left, right) => left.position - right.position)[0];

    return {
      id: enrollment.id,
      status: enrollment.status,
      progressPercent: enrollment.progressPercent,
      startedAt: enrollment.startedAt,
      completedAt: enrollment.completedAt,
      user: {
        id: enrollment.user.id,
        firstName: enrollment.user.firstName,
        lastName: enrollment.user.lastName,
        email: enrollment.user.email,
      },
      course: {
        id: enrollment.course.id,
        title: enrollment.course.title,
        slug: enrollment.course.slug,
        shortDescription: enrollment.course.shortDescription,
        thumbnailUrl: enrollment.course.thumbnailUrl,
        creatorName:
          `${enrollment.course.creator.firstName} ${enrollment.course.creator.lastName}`.trim(),
        durationInHours: enrollment.course.durationInHours,
        nextLessonTitle: firstPublishedLesson?.title,
      },
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
    };
  }
}
