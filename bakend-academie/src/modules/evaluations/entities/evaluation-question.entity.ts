import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EvaluationEntity } from './evaluation.entity';

@Entity({ name: 'evaluation_questions' })
export class EvaluationQuestionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  statement!: string;

  @Column({ type: 'varchar', length: 30, default: 'TEXT' })
  questionType!: string;

  @Column({ type: 'jsonb', nullable: true })
  options?: string[];

  @Column({ type: 'text', nullable: true })
  correctAnswer?: string;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 1 })
  points!: string;

  @Column({ type: 'int' })
  position!: number;

  @ManyToOne(() => EvaluationEntity, (evaluation) => evaluation.questions, {
    onDelete: 'CASCADE',
  })
  evaluation!: EvaluationEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
