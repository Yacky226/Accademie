import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProgramStatus } from '../../../core/enums';
import { UserEntity } from '../../users/entities/user.entity';
import { ProgramStepEntity } from './program-step.entity';

@Entity({ name: 'student_programs' })
export class StudentProgramEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  goal?: string;

  @Column({ type: 'varchar', length: 20, default: ProgramStatus.DRAFT })
  status!: ProgramStatus;

  @Column({ type: 'date', nullable: true })
  startDate?: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @ManyToOne(() => UserEntity, (user) => user.studentPrograms, { onDelete: 'CASCADE' })
  student!: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.createdStudentPrograms, {
    onDelete: 'SET NULL',
  })
  teacher!: UserEntity;

  @OneToMany(() => ProgramStepEntity, (step) => step.studentProgram)
  steps!: ProgramStepEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
