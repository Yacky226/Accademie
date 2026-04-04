import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourseLevel, CourseStatus, EnrollmentStatus } from '../../core/enums';
import { CreateCourseModuleDto } from './dto/create-course-module.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateCourseModuleDto } from './dto/update-course-module.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateEnrollmentProgressDto } from './dto/update-enrollment-progress.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CourseModuleEntity } from './entities/course-module.entity';
import { CourseEntity } from './entities/course.entity';
import { EnrollmentEntity } from './entities/enrollment.entity';
import { LessonEntity } from './entities/lesson.entity';
import { CoursesRepository } from './repositories/courses.repository';

@Injectable()
export class CoursesService {
  constructor(private readonly coursesRepository: CoursesRepository) {}

  async listCourses(): Promise<CourseEntity[]> {
    return this.coursesRepository.findAllCourses();
  }

  async listPublishedCourses(): Promise<CourseEntity[]> {
    const courses = await this.coursesRepository.findPublishedCourses();
    return courses.map((course) => this.filterPublishedContent(course));
  }

  async getCourseById(courseId: string): Promise<CourseEntity> {
    const course = await this.coursesRepository.findCourseById(courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async getPublishedCourseBySlug(slug: string): Promise<CourseEntity> {
    const normalizedSlug = this.normalizeSlug(slug);
    const course = await this.coursesRepository.findPublishedCourseBySlug(normalizedSlug);
    if (!course) {
      throw new NotFoundException('Published course not found');
    }

    return this.filterPublishedContent(course);
  }

  async createCourse(dto: CreateCourseDto, creatorId: string): Promise<CourseEntity> {
    const normalizedSlug = this.normalizeSlug(dto.slug);
    const existingCourse = await this.coursesRepository.findCourseBySlug(normalizedSlug);
    if (existingCourse) {
      throw new ConflictException('Course slug already exists');
    }

    const creator = await this.coursesRepository.findUserById(creatorId);
    if (!creator) {
      throw new NotFoundException('Creator user not found');
    }

    const course = new CourseEntity();
    course.title = dto.title;
    course.slug = normalizedSlug;
    course.shortDescription = dto.shortDescription;
    course.description = dto.description;
    course.thumbnailUrl = dto.thumbnailUrl;
    course.price = dto.price.toFixed(2);
    course.currency = dto.currency.toUpperCase();
    course.level = dto.level ?? CourseLevel.BEGINNER;
    course.status = dto.status ?? CourseStatus.DRAFT;
    course.isPublished = dto.isPublished ?? false;
    course.durationInHours = dto.durationInHours;
    course.certificateEnabled = dto.certificateEnabled ?? false;
    course.creator = creator;

    return this.coursesRepository.saveCourse(course);
  }

  async updateCourse(courseId: string, dto: UpdateCourseDto): Promise<CourseEntity> {
    const course = await this.getCourseById(courseId);

    if (dto.slug && dto.slug !== course.slug) {
      const normalizedSlug = this.normalizeSlug(dto.slug);
      const existingCourse = await this.coursesRepository.findCourseBySlug(normalizedSlug);
      if (existingCourse && existingCourse.id !== course.id) {
        throw new ConflictException('Course slug already exists');
      }
      course.slug = normalizedSlug;
    }

    course.title = dto.title ?? course.title;
    course.shortDescription = dto.shortDescription ?? course.shortDescription;
    course.description = dto.description ?? course.description;
    course.thumbnailUrl = dto.thumbnailUrl ?? course.thumbnailUrl;
    course.price = dto.price !== undefined ? dto.price.toFixed(2) : course.price;
    course.currency = dto.currency ? dto.currency.toUpperCase() : course.currency;
    course.level = dto.level ?? course.level;
    course.status = dto.status ?? course.status;
    course.isPublished = dto.isPublished ?? course.isPublished;
    course.durationInHours = dto.durationInHours ?? course.durationInHours;
    course.certificateEnabled = dto.certificateEnabled ?? course.certificateEnabled;

    return this.coursesRepository.saveCourse(course);
  }

  async deleteCourse(courseId: string): Promise<void> {
    const course = await this.getCourseById(courseId);
    await this.coursesRepository.softDeleteCourse(course);
  }

  async addCourseModule(courseId: string, dto: CreateCourseModuleDto): Promise<CourseModuleEntity> {
    const course = await this.getCourseById(courseId);

    const moduleEntity = new CourseModuleEntity();
    moduleEntity.title = dto.title;
    moduleEntity.description = dto.description;
    moduleEntity.position = dto.position;
    moduleEntity.isPublished = dto.isPublished ?? false;
    moduleEntity.course = course;

    return this.coursesRepository.saveModule(moduleEntity);
  }

  async updateCourseModule(
    courseId: string,
    moduleId: string,
    dto: UpdateCourseModuleDto,
  ): Promise<CourseModuleEntity> {
    const moduleEntity = await this.coursesRepository.findModuleById(moduleId);
    if (!moduleEntity || moduleEntity.course.id !== courseId) {
      throw new NotFoundException('Course module not found');
    }

    moduleEntity.title = dto.title ?? moduleEntity.title;
    moduleEntity.description = dto.description ?? moduleEntity.description;
    moduleEntity.position = dto.position ?? moduleEntity.position;
    moduleEntity.isPublished = dto.isPublished ?? moduleEntity.isPublished;

    return this.coursesRepository.saveModule(moduleEntity);
  }

  async addLesson(courseId: string, moduleId: string, dto: CreateLessonDto): Promise<LessonEntity> {
    const moduleEntity = await this.coursesRepository.findModuleById(moduleId);
    if (!moduleEntity || moduleEntity.course.id !== courseId) {
      throw new NotFoundException('Course module not found');
    }

    const existingLessonBySlug = await this.coursesRepository.findLessonBySlug(dto.slug);
    if (existingLessonBySlug) {
      throw new ConflictException('Lesson slug already exists');
    }

    const lesson = new LessonEntity();
    lesson.title = dto.title;
    lesson.slug = this.normalizeSlug(dto.slug);
    lesson.content = dto.content;
    lesson.videoUrl = dto.videoUrl;
    lesson.resourceUrl = dto.resourceUrl;
    lesson.durationInMinutes = dto.durationInMinutes;
    lesson.position = dto.position;
    lesson.isFreePreview = dto.isFreePreview ?? false;
    lesson.isPublished = dto.isPublished ?? false;
    lesson.courseModule = moduleEntity;

    return this.coursesRepository.saveLesson(lesson);
  }

  async updateLesson(
    courseId: string,
    moduleId: string,
    lessonId: string,
    dto: UpdateLessonDto,
  ): Promise<LessonEntity> {
    const lesson = await this.coursesRepository.findLessonById(lessonId);
    if (!lesson || lesson.courseModule.id !== moduleId || lesson.courseModule.course.id !== courseId) {
      throw new NotFoundException('Lesson not found');
    }

    if (dto.slug && dto.slug !== lesson.slug) {
      const normalizedSlug = this.normalizeSlug(dto.slug);
      const existingLesson = await this.coursesRepository.findLessonBySlug(normalizedSlug);
      if (existingLesson && existingLesson.id !== lesson.id) {
        throw new ConflictException('Lesson slug already exists');
      }
      lesson.slug = normalizedSlug;
    }

    lesson.title = dto.title ?? lesson.title;
    lesson.content = dto.content ?? lesson.content;
    lesson.videoUrl = dto.videoUrl ?? lesson.videoUrl;
    lesson.resourceUrl = dto.resourceUrl ?? lesson.resourceUrl;
    lesson.durationInMinutes = dto.durationInMinutes ?? lesson.durationInMinutes;
    lesson.position = dto.position ?? lesson.position;
    lesson.isFreePreview = dto.isFreePreview ?? lesson.isFreePreview;
    lesson.isPublished = dto.isPublished ?? lesson.isPublished;

    return this.coursesRepository.saveLesson(lesson);
  }

  async enrollStudent(courseId: string, dto: CreateEnrollmentDto): Promise<EnrollmentEntity> {
    const course = await this.getCourseById(courseId);

    const user = await this.coursesRepository.findUserById(dto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingEnrollment = await this.coursesRepository.findEnrollmentByUserAndCourse(
      dto.userId,
      courseId,
    );
    if (existingEnrollment) {
      return existingEnrollment;
    }

    const enrollment = new EnrollmentEntity();
    enrollment.user = user;
    enrollment.course = course;
    enrollment.status = (dto.status as EnrollmentStatus) ?? EnrollmentStatus.ACTIVE;
    enrollment.progressPercent = '0.00';
    enrollment.startedAt = new Date();

    return this.coursesRepository.saveEnrollment(enrollment);
  }

  async enrollCurrentUser(courseId: string, userId: string): Promise<EnrollmentEntity> {
    return this.enrollStudent(courseId, { userId });
  }

  async updateEnrollmentProgress(
    enrollmentId: string,
    dto: UpdateEnrollmentProgressDto,
  ): Promise<EnrollmentEntity> {
    const enrollment = await this.coursesRepository.findEnrollmentById(enrollmentId);
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    enrollment.progressPercent = dto.progressPercent.toFixed(2);
    if (dto.progressPercent >= 100) {
      enrollment.status = EnrollmentStatus.COMPLETED;
      enrollment.completedAt = new Date();
    }

    return this.coursesRepository.saveEnrollment(enrollment);
  }

  async listCourseEnrollments(courseId: string): Promise<EnrollmentEntity[]> {
    await this.getCourseById(courseId);
    return this.coursesRepository.findEnrollmentsByCourseId(courseId);
  }

  private normalizeSlug(slug: string): string {
    return slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private filterPublishedContent(course: CourseEntity): CourseEntity {
    course.modules = (course.modules ?? [])
      .filter((moduleEntity) => moduleEntity.isPublished)
      .map((moduleEntity) => {
        moduleEntity.lessons = (moduleEntity.lessons ?? []).filter((lesson) => lesson.isPublished);
        return moduleEntity;
      });

    return course;
  }
}
