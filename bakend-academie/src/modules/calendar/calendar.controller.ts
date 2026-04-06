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
import { CALENDAR_PERMISSIONS } from '../../core/constants';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { UserRole } from '../../core/enums';
import { AddCalendarAttendeeDto } from './dto/add-calendar-attendee.dto';
import { CalendarEventResponseDto } from './dto/calendar-event-response.dto';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { RespondCalendarAttendeeDto } from './dto/respond-calendar-attendee.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CalendarEventEntity } from './entities/calendar-event.entity';
import { CalendarService } from './calendar.service';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Permissions(CALENDAR_PERMISSIONS.CALENDAR_READ)
  @Get('events')
  async listEvents(): Promise<CalendarEventResponseDto[]> {
    const events = await this.calendarService.listEvents();
    return events.map((event) => this.toResponse(event));
  }

  @Permissions(CALENDAR_PERMISSIONS.CALENDAR_READ)
  @Get('events/me')
  async listMyEvents(
    @CurrentUser('sub') userId: string,
  ): Promise<CalendarEventResponseDto[]> {
    const events = await this.calendarService.listMyEvents(userId);
    return events.map((event) => this.toResponse(event));
  }

  @Permissions(CALENDAR_PERMISSIONS.CALENDAR_READ)
  @Get('events/:id')
  async getEventById(
    @Param('id') id: string,
  ): Promise<CalendarEventResponseDto> {
    const event = await this.calendarService.getEventById(id);
    return this.toResponse(event);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(CALENDAR_PERMISSIONS.CALENDAR_CREATE)
  @Post('events')
  async createEvent(
    @Body() dto: CreateCalendarEventDto,
  ): Promise<CalendarEventResponseDto> {
    const event = await this.calendarService.createEvent(dto);
    return this.toResponse(event);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(CALENDAR_PERMISSIONS.CALENDAR_UPDATE)
  @Patch('events/:id')
  async updateEvent(
    @Param('id') id: string,
    @Body() dto: UpdateCalendarEventDto,
  ): Promise<CalendarEventResponseDto> {
    const event = await this.calendarService.updateEvent(id, dto);
    return this.toResponse(event);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(CALENDAR_PERMISSIONS.CALENDAR_ATTENDEES_MANAGE)
  @Post('events/:id/attendees')
  async addAttendee(
    @Param('id') eventId: string,
    @Body() dto: AddCalendarAttendeeDto,
  ) {
    return this.calendarService.addAttendee(eventId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(CALENDAR_PERMISSIONS.CALENDAR_ATTENDEES_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('events/:id/attendees/:attendeeId')
  async removeAttendee(
    @Param('id') eventId: string,
    @Param('attendeeId') attendeeId: string,
  ): Promise<void> {
    await this.calendarService.removeAttendee(eventId, attendeeId);
  }

  @Permissions(CALENDAR_PERMISSIONS.CALENDAR_RESPOND)
  @Patch('events/:id/attendees/me/respond')
  async respondToEvent(
    @Param('id') eventId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: RespondCalendarAttendeeDto,
  ) {
    return this.calendarService.respondToEvent(eventId, userId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(CALENDAR_PERMISSIONS.CALENDAR_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('events/:id')
  async deleteEvent(@Param('id') id: string): Promise<void> {
    await this.calendarService.deleteEvent(id);
  }

  private toResponse(event: CalendarEventEntity): CalendarEventResponseDto {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      timezone: event.timezone,
      status: event.status,
      location: event.location,
      meetingUrl: event.meetingUrl,
      isAllDay: event.isAllDay,
      createdBy: {
        id: event.createdBy.id,
        firstName: event.createdBy.firstName,
        lastName: event.createdBy.lastName,
        email: event.createdBy.email,
      },
      course: event.course
        ? {
            id: event.course.id,
            title: event.course.title,
            slug: event.course.slug,
          }
        : undefined,
      attendees: (event.attendees ?? []).map((attendee) => ({
        id: attendee.id,
        responseStatus: attendee.responseStatus,
        note: attendee.note,
        user: {
          id: attendee.user.id,
          firstName: attendee.user.firstName,
          lastName: attendee.user.lastName,
          email: attendee.user.email,
        },
      })),
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}
