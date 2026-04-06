import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubmissionStatus } from '../../../core/enums';
import { JudgeRunEntity } from '../../judge/entities/judge-run.entity';
import { ProblemEntity } from '../../problems/entities/problem.entity';
import { SupportedLanguageEntity } from '../../problems/entities/supported-language.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity({ name: 'submissions' })
export class SubmissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  sourceCode!: string;

  @Column({ type: 'text', nullable: true })
  stdin?: string;

  @Column({ type: 'text', nullable: true })
  expectedOutput?: string;

  @Column({ type: 'text', nullable: true })
  stdout?: string;

  @Column({ type: 'text', nullable: true })
  stderr?: string;

  @Column({ type: 'text', nullable: true })
  compileOutput?: string;

  @Column({ type: 'varchar', length: 30, default: SubmissionStatus.PENDING })
  status!: SubmissionStatus;

  @Column({ type: 'varchar', length: 40, nullable: true })
  verdict?: string;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  score?: string;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 100 })
  maxScore!: string;

  @Column({ type: 'int', nullable: true })
  timeMs?: number;

  @Column({ type: 'int', nullable: true })
  memoryKb?: number;

  @Column({ type: 'int', nullable: true })
  exitCode?: number;

  @Column({ type: 'timestamptz' })
  submittedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  evaluatedAt?: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  requester!: UserEntity;

  @ManyToOne(() => ProblemEntity, { onDelete: 'SET NULL', nullable: true })
  problem?: ProblemEntity;

  @ManyToOne(() => SupportedLanguageEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  language?: SupportedLanguageEntity;

  @ManyToOne(() => JudgeRunEntity, { onDelete: 'SET NULL', nullable: true })
  judgeRun?: JudgeRunEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
