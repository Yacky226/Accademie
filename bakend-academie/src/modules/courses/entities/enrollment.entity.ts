import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EnrollmentStatus } from '../../../core/enums';
import { UserEntity } from '../../users/entities/user.entity';
import { CourseEntity } from './course.entity';

@Entity({ name: 'enrollments' })
export class EnrollmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, default: EnrollmentStatus.ACTIVE })
  status!: EnrollmentStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progressPercent!: string;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @ManyToOne(() => UserEntity, (user) => user.enrollments, { onDelete: 'CASCADE' })
  user!: UserEntity;

  @ManyToOne(() => CourseEntity, (course) => course.enrollments, { onDelete: 'CASCADE' })
  course!: CourseEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
