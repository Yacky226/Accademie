import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CourseEntity } from './course.entity';
import { LessonEntity } from './lesson.entity';

@Entity({ name: 'course_modules' })
export class CourseModuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int' })
  position!: number;

  @Column({ type: 'boolean', default: false })
  isPublished!: boolean;

  @ManyToOne(() => CourseEntity, (course) => course.modules, { onDelete: 'CASCADE' })
  course!: CourseEntity;

  @OneToMany(() => LessonEntity, (lesson) => lesson.courseModule)
  lessons!: LessonEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
