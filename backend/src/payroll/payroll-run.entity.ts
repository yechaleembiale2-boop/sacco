import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type PayrollRunStatus = 'generated' | 'submitted' | 'reconciled';

@Entity({ name: 'payroll_runs' })
export class PayrollRun {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  period!: string;

  @Column({ name: 'generated_by', type: 'bigint' })
  generatedBy!: string;

  @CreateDateColumn({ name: 'generated_at', type: 'timestamptz' })
  generatedAt!: Date;

  @Column({ name: 'total_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalAmount!: string;

  @Column({ name: 'total_items', type: 'int', default: 0 })
  totalItems!: number;

  @Column({ type: 'text', default: 'generated' })
  status!: PayrollRunStatus;

  @Column({ name: 'reconciled_at', type: 'timestamptz', nullable: true })
  reconciledAt!: Date | null;

  @Column({ name: 'reconciled_by', type: 'bigint', nullable: true })
  reconciledBy!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}