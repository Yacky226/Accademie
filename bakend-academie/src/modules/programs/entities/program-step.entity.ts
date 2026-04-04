import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProgramStepStatus } from '../../../core/enums';
import { StudentProgramEntity } from './student-program.entity';

@Entity({ name: 'program_steps' })
export class ProgramStepEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int' })
  position!: number;

  @Column({ type: 'varchar', length: 20, default: ProgramStepStatus.TODO })
  status!: ProgramStepStatus;

  @Column({ type: 'date', nullable: true })
  dueDate?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @ManyToOne(() => StudentProgramEntity, (program) => program.steps, {
    onDelete: 'CASCADE',
  })
  studentProgram!: StudentProgramEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
