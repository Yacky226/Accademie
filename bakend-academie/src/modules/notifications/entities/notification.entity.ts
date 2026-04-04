import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationChannel } from '../../../core/enums';
import { UserEntity } from '../../users/entities/user.entity';

@Entity({ name: 'notifications' })
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'varchar', length: 30, default: 'INFO' })
  type!: string;

  @Column({ type: 'varchar', length: 20, default: NotificationChannel.IN_APP })
  channel!: NotificationChannel;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  readAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  recipient!: UserEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  sender?: UserEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
