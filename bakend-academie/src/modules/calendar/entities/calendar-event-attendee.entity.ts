import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { CalendarEventEntity } from './calendar-event.entity';

@Entity({ name: 'calendar_event_attendees' })
export class CalendarEventAttendeeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, default: 'INVITED' })
  responseStatus!: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @ManyToOne(() => CalendarEventEntity, (event) => event.attendees, {
    onDelete: 'CASCADE',
  })
  event!: CalendarEventEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user!: UserEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
