import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentStatus } from '../../../core/enums';
import { CourseEntity } from '../../courses/entities/course.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity({ name: 'payments' })
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  reference!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: string;

  @Column({ type: 'varchar', length: 10, default: 'XOF' })
  currency!: string;

  @Column({ type: 'varchar', length: 20, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Column({ type: 'varchar', length: 80, nullable: true })
  provider?: string;

  @Column({ type: 'varchar', length: 190, nullable: true })
  providerTransactionId?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ type: 'boolean', default: false })
  isSubscription!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subscriptionPlanCode?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  subscriptionStatus?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  billingInterval?: string;

  @Column({ type: 'timestamptz', nullable: true })
  nextBillingAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  canceledAt?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundedAmount?: string;

  @Column({ type: 'text', nullable: true })
  refundReason?: string;

  @Column({ type: 'timestamptz', nullable: true })
  refundedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  user?: UserEntity;

  @ManyToOne(() => CourseEntity, { onDelete: 'SET NULL', nullable: true })
  course?: CourseEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
