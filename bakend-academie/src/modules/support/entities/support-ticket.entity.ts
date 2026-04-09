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

@Entity({ name: 'support_tickets' })
export class SupportTicketEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 160 })
  subject!: string;

  @Column({ type: 'varchar', length: 60 })
  category!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 30, default: 'OPEN' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  resolution?: string;

  @ManyToOne(() => UserEntity, (user) => user.supportTickets, {
    nullable: false,
  })
  user!: UserEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
