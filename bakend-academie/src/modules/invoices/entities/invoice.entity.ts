import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentEntity } from '../../payments/entities/payment.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity({ name: 'invoices' })
export class InvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  number!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotalHt!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 20 })
  taxRate!: string;

  @Column({ type: 'varchar', length: 20, default: 'STANDARD_20' })
  vatCategory!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalTtc!: string;

  @Column({ type: 'varchar', length: 10, default: 'XOF' })
  currency!: string;

  @Column({ type: 'varchar', length: 20, default: 'DRAFT' })
  status!: string;

  @Column({ type: 'varchar', length: 30, default: 'DRAFT' })
  fiscalStatus!: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ type: 'varchar', length: 180, nullable: true })
  customerCompanyName?: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  customerVatNumber?: string;

  @Column({ type: 'text', nullable: true })
  taxExemptionReason?: string;

  @Column({ type: 'timestamptz', nullable: true })
  issuedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  dueAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @Column({ type: 'varchar', length: 128, nullable: true })
  pdfSha256?: string;

  @Column({ type: 'timestamptz', nullable: true })
  pdfGeneratedAt?: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  user?: UserEntity;

  @ManyToOne(() => PaymentEntity, { onDelete: 'SET NULL', nullable: true })
  payment?: PaymentEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
