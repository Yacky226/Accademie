import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { EvaluationEntity } from './evaluation.entity';

@Entity({ name: 'evaluation_attempts' })
export class EvaluationAttemptEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, default: 'SUBMITTED' })
  status!: string;

  @Column({ type: 'jsonb', nullable: true })
  answers?: Record<string, unknown>;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  score?: string;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  maxScore!: string;

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @Column({ type: 'timestamptz' })
  startedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt?: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  student!: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  grader?: UserEntity;

  @ManyToOne(() => EvaluationEntity, (evaluation) => evaluation.attempts, {
    onDelete: 'CASCADE',
  })
  evaluation!: EvaluationEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
