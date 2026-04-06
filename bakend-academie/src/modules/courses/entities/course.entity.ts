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
import { CourseLevel, CourseStatus } from '../../../core/enums';
import { UserEntity } from '../../users/entities/user.entity';
import { CourseModuleEntity } from './course-module.entity';
import { EnrollmentEntity } from 'src/modules/courses/entities/enrollment.entity';

@Entity({ name: 'courses' })
export class CourseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'varchar', length: 190, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 255 })
  shortDescription!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: string;

  @Column({ type: 'varchar', length: 10, default: 'XOF' })
  currency!: string;

  @Column({ type: 'varchar', length: 20, default: CourseLevel.BEGINNER })
  level!: CourseLevel;

  @Column({ type: 'varchar', length: 20, default: CourseStatus.DRAFT })
  status!: CourseStatus;

  @Column({ type: 'boolean', default: false })
  isPublished!: boolean;

  @Column({ type: 'int', nullable: true })
  durationInHours?: number;

  @Column({ type: 'boolean', default: false })
  certificateEnabled!: boolean;

  @ManyToOne(() => UserEntity, (user) => user.createdCourses, {
    onDelete: 'SET NULL',
  })
  creator!: UserEntity;

  @OneToMany(() => CourseModuleEntity, (courseModule) => courseModule.course)
  modules!: CourseModuleEntity[];

  @OneToMany(() => EnrollmentEntity, (enrollment) => enrollment.course)
  enrollments!: EnrollmentEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
