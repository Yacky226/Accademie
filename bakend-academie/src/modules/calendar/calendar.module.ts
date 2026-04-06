import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from '../courses/entities/course.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { CalendarEventAttendeeEntity } from './entities/calendar-event-attendee.entity';
import { CalendarEventEntity } from './entities/calendar-event.entity';
import { CalendarRepository } from './repositories/calendar.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CalendarEventEntity,
      CalendarEventAttendeeEntity,
      UserEntity,
      CourseEntity,
    ]),
  ],
  controllers: [CalendarController],
  providers: [CalendarService, CalendarRepository],
  exports: [CalendarService, CalendarRepository],
})
export class CalendarModule {}
