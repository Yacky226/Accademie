import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CourseEntity } from '../../courses/entities/course.entity';
import { EnrollmentStatus } from '../../../core/enums';
import { UserEntity } from '../../users/entities/user.entity';
import { CalendarEventAttendeeEntity } from '../entities/calendar-event-attendee.entity';
import { CalendarEventEntity } from '../entities/calendar-event.entity';

@Injectable()
export class CalendarRepository {
  constructor(
    @InjectRepository(CalendarEventEntity)
    private readonly eventsRepository: Repository<CalendarEventEntity>,
    @InjectRepository(CalendarEventAttendeeEntity)
    private readonly attendeesRepository: Repository<CalendarEventAttendeeEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(CourseEntity)
    private readonly coursesRepository: Repository<CourseEntity>,
  ) {}

  async findAllEvents(): Promise<CalendarEventEntity[]> {
    return this.eventsRepository.find({
      where: { deletedAt: IsNull() },
      relations: {
        createdBy: true,
        course: true,
        attendees: { user: true },
      },
      order: { startsAt: 'ASC' },
    });
  }

  async findEventById(eventId: string): Promise<CalendarEventEntity | null> {
    return this.eventsRepository.findOne({
      where: { id: eventId, deletedAt: IsNull() },
      relations: {
        createdBy: true,
        course: true,
        attendees: { user: true },
      },
    });
  }

  async findEventsByUserId(userId: string): Promise<CalendarEventEntity[]> {
    return this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.createdBy', 'createdBy')
      .leftJoinAndSelect('event.course', 'course')
      .leftJoin(
        'course.enrollments',
        'courseEnrollment',
        'courseEnrollment.userId = :userId AND courseEnrollment.status != :cancelledStatus',
        {
          userId,
          cancelledStatus: EnrollmentStatus.CANCELLED,
        },
      )
      .leftJoinAndSelect('event.attendees', 'attendees')
      .leftJoinAndSelect('attendees.user', 'attendeeUser')
      .where('event.deletedAt IS NULL')
      .andWhere(
        '(createdBy.id = :userId OR attendeeUser.id = :userId OR courseEnrollment.id IS NOT NULL)',
        { userId },
      )
      .orderBy('event.startsAt', 'ASC')
      .getMany();
  }

  async saveEvent(event: CalendarEventEntity): Promise<CalendarEventEntity> {
    return this.eventsRepository.save(event);
  }

  async softDeleteEvent(event: CalendarEventEntity): Promise<void> {
    await this.eventsRepository.softRemove(event);
  }

  async findAttendeeById(
    attendeeId: string,
  ): Promise<CalendarEventAttendeeEntity | null> {
    return this.attendeesRepository.findOne({
      where: { id: attendeeId },
      relations: { event: true, user: true },
    });
  }

  async findAttendeeByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<CalendarEventAttendeeEntity | null> {
    return this.attendeesRepository.findOne({
      where: { event: { id: eventId }, user: { id: userId } },
      relations: { event: true, user: true },
    });
  }

  async saveAttendee(
    attendee: CalendarEventAttendeeEntity,
  ): Promise<CalendarEventAttendeeEntity> {
    return this.attendeesRepository.save(attendee);
  }

  async removeAttendee(attendee: CalendarEventAttendeeEntity): Promise<void> {
    await this.attendeesRepository.remove(attendee);
  }

  async findUserById(userId: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });
  }

  async findCourseById(courseId: string): Promise<CourseEntity | null> {
    return this.coursesRepository.findOne({
      where: { id: courseId, deletedAt: IsNull() },
    });
  }
}
