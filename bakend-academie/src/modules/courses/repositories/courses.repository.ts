import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CourseStatus } from '../../../core/enums';
import { UserEntity } from '../../users/entities/user.entity';
import { CourseModuleEntity } from '../entities/course-module.entity';
import { CourseEntity } from '../entities/course.entity';
import { EnrollmentEntity } from '../entities/enrollment.entity';
import { LessonEntity } from '../entities/lesson.entity';

@Injectable()
export class CoursesRepository {
  constructor(
    @InjectRepository(CourseEntity)
    private readonly coursesRepository: Repository<CourseEntity>,
    @InjectRepository(CourseModuleEntity)
    private readonly modulesRepository: Repository<CourseModuleEntity>,
    @InjectRepository(LessonEntity)
    private readonly lessonsRepository: Repository<LessonEntity>,
    @InjectRepository(EnrollmentEntity)
    private readonly enrollmentsRepository: Repository<EnrollmentEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async findAllCourses(): Promise<CourseEntity[]> {
    return this.coursesRepository.find({
      where: { deletedAt: IsNull() },
      relations: {
        creator: true,
        modules: { lessons: true },
        enrollments: true,
      },
      order: {
        createdAt: 'DESC',
        modules: { position: 'ASC', lessons: { position: 'ASC' } },
      },
    });
  }

  async findPublishedCourses(): Promise<CourseEntity[]> {
    return this.coursesRepository.find({
      where: {
        deletedAt: IsNull(),
        isPublished: true,
        status: CourseStatus.PUBLISHED,
      },
      relations: {
        creator: true,
        modules: { lessons: true },
        enrollments: true,
      },
      order: {
        createdAt: 'DESC',
        modules: { position: 'ASC', lessons: { position: 'ASC' } },
      },
    });
  }

  async findCourseById(id: string): Promise<CourseEntity | null> {
    return this.coursesRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: {
        creator: true,
        modules: { lessons: true },
        enrollments: true,
      },
    });
  }

  async findCourseBySlug(slug: string): Promise<CourseEntity | null> {
    return this.coursesRepository.findOne({
      where: { slug, deletedAt: IsNull() },
      relations: {
        creator: true,
        modules: { lessons: true },
        enrollments: true,
      },
    });
  }

  async findPublishedCourseBySlug(slug: string): Promise<CourseEntity | null> {
    return this.coursesRepository.findOne({
      where: {
        slug,
        deletedAt: IsNull(),
        isPublished: true,
        status: CourseStatus.PUBLISHED,
      },
      relations: {
        creator: true,
        modules: { lessons: true },
        enrollments: true,
      },
    });
  }

  async findUserById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { id, deletedAt: IsNull() } });
  }

  async saveCourse(course: CourseEntity): Promise<CourseEntity> {
    return this.coursesRepository.save(course);
  }

  async softDeleteCourse(course: CourseEntity): Promise<void> {
    await this.coursesRepository.softRemove(course);
  }

  async findModuleById(moduleId: string): Promise<CourseModuleEntity | null> {
    return this.modulesRepository.findOne({
      where: { id: moduleId },
      relations: { course: true, lessons: true },
    });
  }

  async saveModule(courseModule: CourseModuleEntity): Promise<CourseModuleEntity> {
    return this.modulesRepository.save(courseModule);
  }

  async findLessonById(lessonId: string): Promise<LessonEntity | null> {
    return this.lessonsRepository.findOne({
      where: { id: lessonId },
      relations: { courseModule: { course: true } },
    });
  }

  async findLessonBySlug(slug: string): Promise<LessonEntity | null> {
    return this.lessonsRepository.findOne({ where: { slug } });
  }

  async saveLesson(lesson: LessonEntity): Promise<LessonEntity> {
    return this.lessonsRepository.save(lesson);
  }

  async findEnrollmentByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<EnrollmentEntity | null> {
    return this.enrollmentsRepository.findOne({
      where: {
        user: { id: userId },
        course: { id: courseId },
      },
      relations: { user: true, course: true },
    });
  }

  async findEnrollmentById(id: string): Promise<EnrollmentEntity | null> {
    return this.enrollmentsRepository.findOne({
      where: { id },
      relations: { user: true, course: true },
    });
  }

  async findEnrollmentsByCourseId(courseId: string): Promise<EnrollmentEntity[]> {
    return this.enrollmentsRepository.find({
      where: { course: { id: courseId } },
      relations: { user: true, course: true },
      order: { createdAt: 'DESC' },
    });
  }

  async saveEnrollment(enrollment: EnrollmentEntity): Promise<EnrollmentEntity> {
    return this.enrollmentsRepository.save(enrollment);
  }
}
