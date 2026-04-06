import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddCalendarAttendeeDto } from './dto/add-calendar-attendee.dto';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { RespondCalendarAttendeeDto } from './dto/respond-calendar-attendee.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CalendarEventAttendeeEntity } from './entities/calendar-event-attendee.entity';
import { CalendarEventEntity } from './entities/calendar-event.entity';
import { CalendarRepository } from './repositories/calendar.repository';

@Injectable()
export class CalendarService {
  constructor(private readonly calendarRepository: CalendarRepository) {}

  async listEvents(): Promise<CalendarEventEntity[]> {
    return this.calendarRepository.findAllEvents();
  }

  async listMyEvents(userId: string): Promise<CalendarEventEntity[]> {
    const user = await this.calendarRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.calendarRepository.findEventsByUserId(userId);
  }

  async getEventById(eventId: string): Promise<CalendarEventEntity> {
    const event = await this.calendarRepository.findEventById(eventId);
    if (!event) {
      throw new NotFoundException('Calendar event not found');
    }

    return event;
  }

  async createEvent(dto: CreateCalendarEventDto): Promise<CalendarEventEntity> {
    const createdBy = await this.calendarRepository.findUserById(
      dto.createdById,
    );
    if (!createdBy) {
      throw new NotFoundException('Creator user not found');
    }

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    this.assertValidRange(startsAt, endsAt);

    const event = new CalendarEventEntity();
    event.title = dto.title;
    event.description = dto.description;
    event.startsAt = startsAt;
    event.endsAt = endsAt;
    event.timezone = dto.timezone ?? 'UTC';
    event.status = (dto.status ?? 'SCHEDULED').toUpperCase();
    event.location = dto.location;
    event.meetingUrl = dto.meetingUrl;
    event.isAllDay = dto.isAllDay ?? false;
    event.createdBy = createdBy;

    if (dto.courseId) {
      const course = await this.calendarRepository.findCourseById(dto.courseId);
      if (!course) {
        throw new NotFoundException('Course not found');
      }
      event.course = course;
    }

    return this.calendarRepository.saveEvent(event);
  }

  async updateEvent(
    eventId: string,
    dto: UpdateCalendarEventDto,
  ): Promise<CalendarEventEntity> {
    const event = await this.getEventById(eventId);

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : event.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : event.endsAt;
    this.assertValidRange(startsAt, endsAt);

    event.title = dto.title ?? event.title;
    event.description = dto.description ?? event.description;
    event.startsAt = startsAt;
    event.endsAt = endsAt;
    event.timezone = dto.timezone ?? event.timezone;
    event.status = dto.status ? dto.status.toUpperCase() : event.status;
    event.location = dto.location ?? event.location;
    event.meetingUrl = dto.meetingUrl ?? event.meetingUrl;
    event.isAllDay = dto.isAllDay ?? event.isAllDay;

    if (dto.courseId) {
      const course = await this.calendarRepository.findCourseById(dto.courseId);
      if (!course) {
        throw new NotFoundException('Course not found');
      }
      event.course = course;
    }

    return this.calendarRepository.saveEvent(event);
  }

  async deleteEvent(eventId: string): Promise<void> {
    const event = await this.getEventById(eventId);
    await this.calendarRepository.softDeleteEvent(event);
  }

  async addAttendee(
    eventId: string,
    dto: AddCalendarAttendeeDto,
  ): Promise<CalendarEventAttendeeEntity> {
    const event = await this.getEventById(eventId);

    const user = await this.calendarRepository.findUserById(dto.userId);
    if (!user) {
      throw new NotFoundException('Attendee user not found');
    }

    const existingAttendee =
      await this.calendarRepository.findAttendeeByEventAndUser(
        eventId,
        dto.userId,
      );
    if (existingAttendee) {
      throw new ConflictException('User is already invited to this event');
    }

    const attendee = new CalendarEventAttendeeEntity();
    attendee.responseStatus = (dto.responseStatus ?? 'INVITED').toUpperCase();
    attendee.note = dto.note;
    attendee.event = event;
    attendee.user = user;

    return this.calendarRepository.saveAttendee(attendee);
  }

  async removeAttendee(eventId: string, attendeeId: string): Promise<void> {
    const attendee = await this.calendarRepository.findAttendeeById(attendeeId);
    if (!attendee || attendee.event.id !== eventId) {
      throw new NotFoundException('Event attendee not found');
    }

    await this.calendarRepository.removeAttendee(attendee);
  }

  async respondToEvent(
    eventId: string,
    userId: string,
    dto: RespondCalendarAttendeeDto,
  ): Promise<CalendarEventAttendeeEntity> {
    await this.getEventById(eventId);

    const attendee = await this.calendarRepository.findAttendeeByEventAndUser(
      eventId,
      userId,
    );
    if (!attendee) {
      throw new NotFoundException('You are not invited to this event');
    }

    attendee.responseStatus = dto.responseStatus.toUpperCase();
    attendee.note = dto.note ?? attendee.note;

    return this.calendarRepository.saveAttendee(attendee);
  }

  private assertValidRange(startsAt: Date, endsAt: Date): void {
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new ConflictException('Invalid date range for calendar event');
    }

    if (startsAt >= endsAt) {
      throw new ConflictException('Event start date must be before end date');
    }
  }
}
