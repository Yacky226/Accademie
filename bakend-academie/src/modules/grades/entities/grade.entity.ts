import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CourseEntity } from '../../courses/entities/course.entity';
import { EvaluationAttemptEntity } from '../../evaluations/entities/evaluation-attempt.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity({ name: 'grades' })
export class GradeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'varchar', length: 30, default: 'MANUAL' })
  type!: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  score!: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  maxScore!: string;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  percentage!: string;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  weight?: string;

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @Column({ type: 'varchar', length: 20, default: 'DRAFT' })
  status!: string;

  @Column({ type: 'timestamptz', nullable: true })
  gradedAt?: Date;

  @ManyToOne(() => UserEntity, (user) => user.receivedGrades, {
    onDelete: 'CASCADE',
  })
  student!: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.givenGrades, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  gradedBy?: UserEntity;

  @ManyToOne(() => CourseEntity, { onDelete: 'SET NULL', nullable: true })
  course?: CourseEntity;

  @ManyToOne(() => EvaluationAttemptEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  evaluationAttempt?: EvaluationAttemptEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
