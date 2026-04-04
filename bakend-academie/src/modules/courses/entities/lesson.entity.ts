import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CourseModuleEntity } from './course-module.entity';

@Entity({ name: 'lessons' })
export class LessonEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'varchar', length: 190, unique: true })
  slug!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  videoUrl?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resourceUrl?: string;

  @Column({ type: 'int', nullable: true })
  durationInMinutes?: number;

  @Column({ type: 'int' })
  position!: number;

  @Column({ type: 'boolean', default: false })
  isFreePreview!: boolean;

  @Column({ type: 'boolean', default: false })
  isPublished!: boolean;

  @ManyToOne(() => CourseModuleEntity, (courseModule) => courseModule.lessons, {
    onDelete: 'CASCADE',
  })
  courseModule!: CourseModuleEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
