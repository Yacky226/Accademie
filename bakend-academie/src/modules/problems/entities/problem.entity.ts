import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProblemDifficulty, ProblemStatus } from '../../../core/enums';
import { UserEntity } from '../../users/entities/user.entity';
import { ProblemTagEntity } from './problem-tag.entity';
import { ProblemTestCaseEntity } from './problem-testcase.entity';

@Entity({ name: 'problems' })
export class ProblemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'varchar', length: 190, unique: true })
  slug!: string;

  @Column({ type: 'text' })
  statement!: string;

  @Column({ type: 'text', nullable: true })
  inputFormat?: string;

  @Column({ type: 'text', nullable: true })
  outputFormat?: string;

  @Column({ type: 'text', nullable: true })
  constraints?: string;

  @Column({ type: 'text', nullable: true })
  sampleInput?: string;

  @Column({ type: 'text', nullable: true })
  sampleOutput?: string;

  @Column({ type: 'text', nullable: true })
  explanation?: string;

  @Column({ type: 'varchar', length: 20, default: ProblemDifficulty.EASY })
  difficulty!: ProblemDifficulty;

  @Column({ type: 'varchar', length: 20, default: ProblemStatus.DRAFT })
  status!: ProblemStatus;

  @Column({ type: 'int', default: 1000 })
  timeLimitMs!: number;

  @Column({ type: 'int', default: 256 })
  memoryLimitMb!: number;

  @Column({ type: 'boolean', default: false })
  isPublished!: boolean;

  @ManyToOne(() => UserEntity, (user) => user.createdProblems, {
    onDelete: 'SET NULL',
  })
  creator!: UserEntity;

  @OneToMany(() => ProblemTestCaseEntity, (testCase) => testCase.problem)
  testCases!: ProblemTestCaseEntity[];

  @ManyToMany(() => ProblemTagEntity, (tag) => tag.problems, { eager: true })
  @JoinTable({
    name: 'problem_tags_rel',
    joinColumn: { name: 'problemId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags!: ProblemTagEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
