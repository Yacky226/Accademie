import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

@Entity({ name: 'academy_announcements' })
export class AcademyAnnouncementEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'boolean', default: false })
  isPublished!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  createdBy?: UserEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
