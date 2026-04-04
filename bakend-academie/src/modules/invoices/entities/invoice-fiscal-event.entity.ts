import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { InvoiceEntity } from './invoice.entity';

@Entity({ name: 'invoice_fiscal_events' })
export class InvoiceFiscalEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 40 })
  eventType!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  actorUserId?: string;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown>;

  @Column({ type: 'varchar', length: 128, nullable: true })
  signature?: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  previousSignature?: string;

  @ManyToOne(() => InvoiceEntity, { onDelete: 'CASCADE' })
  invoice!: InvoiceEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
