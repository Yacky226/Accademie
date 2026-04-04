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
import { EvaluationType } from '../../../core/enums';
import { CourseEntity } from '../../courses/entities/course.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { EvaluationAttemptEntity } from './evaluation-attempt.entity';
import { EvaluationQuestionEntity } from './evaluation-question.entity';

@Entity({ name: 'evaluations' })
export class EvaluationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'varchar', length: 190, unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 20, default: EvaluationType.QUIZ })
  type!: EvaluationType;

  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @Column({ type: 'int', nullable: true })
  durationInMinutes?: number;

  @Column({ type: 'int', default: 1 })
  maxAttempts!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  passScore!: string;

  @Column({ type: 'timestamptz', nullable: true })
  startsAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endsAt?: Date;

  @Column({ type: 'boolean', default: false })
  isPublished!: boolean;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  creator!: UserEntity;

  @ManyToOne(() => CourseEntity, { onDelete: 'SET NULL', nullable: true })
  course?: CourseEntity;

  @OneToMany(() => EvaluationQuestionEntity, (question) => question.evaluation)
  questions!: EvaluationQuestionEntity[];

  @OneToMany(() => EvaluationAttemptEntity, (attempt) => attempt.evaluation)
  attempts!: EvaluationAttemptEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
