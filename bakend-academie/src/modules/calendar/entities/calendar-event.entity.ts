import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CourseEntity } from '../../courses/entities/course.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { CalendarEventAttendeeEntity } from './calendar-event-attendee.entity';

@Entity({ name: 'calendar_events' })
export class CalendarEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamptz' })
  startsAt!: Date;

  @Column({ type: 'timestamptz' })
  endsAt!: Date;

  @Column({ type: 'varchar', length: 60, default: 'UTC' })
  timezone!: string;

  @Column({ type: 'varchar', length: 20, default: 'SCHEDULED' })
  status!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  meetingUrl?: string;

  @Column({ type: 'boolean', default: false })
  isAllDay!: boolean;

  @ManyToOne(() => UserEntity, (user) => user.createdCalendarEvents, {
    onDelete: 'SET NULL',
  })
  createdBy!: UserEntity;

  @ManyToOne(() => CourseEntity, { onDelete: 'SET NULL', nullable: true })
  course?: CourseEntity;

  @OneToMany(() => CalendarEventAttendeeEntity, (attendee) => attendee.event)
  attendees!: CalendarEventAttendeeEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
