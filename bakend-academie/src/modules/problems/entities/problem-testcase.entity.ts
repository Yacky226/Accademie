import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProblemEntity } from './problem.entity';

@Entity({ name: 'problem_test_cases' })
export class ProblemTestCaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  input!: string;

  @Column({ type: 'text' })
  expectedOutput!: string;

  @Column({ type: 'boolean', default: true })
  isHidden!: boolean;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  points!: string;

  @Column({ type: 'int' })
  position!: number;

  @ManyToOne(() => ProblemEntity, (problem) => problem.testCases, {
    onDelete: 'CASCADE',
  })
  problem!: ProblemEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
