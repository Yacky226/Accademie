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
import { ProblemEntity } from '../../problems/entities/problem.entity';
import { SupportedLanguageEntity } from '../../problems/entities/supported-language.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity({ name: 'judge_runs' })
export class JudgeRunEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  token!: string;

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

  @Column({ type: 'int', nullable: true })
  timeMs?: number;

  @Column({ type: 'int', nullable: true })
  memoryKb?: number;

  @Column({ type: 'int', nullable: true })
  exitCode?: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  requester!: UserEntity;

  @ManyToOne(() => ProblemEntity, { onDelete: 'SET NULL', nullable: true })
  problem?: ProblemEntity;

  @ManyToOne(() => SupportedLanguageEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  language?: SupportedLanguageEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
