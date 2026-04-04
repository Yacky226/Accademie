import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProblemEntity } from './problem.entity';

@Entity({ name: 'problem_tags' })
export class ProblemTagEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 80, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 90, unique: true })
  slug!: string;

  @ManyToMany(() => ProblemEntity, (problem) => problem.tags)
  problems!: ProblemEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
