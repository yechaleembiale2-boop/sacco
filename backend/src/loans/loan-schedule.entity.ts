import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'loan_schedules' })
@Index(['loanId', 'installmentNo'], { unique: true })
export class LoanSchedule {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'loan_id', type: 'bigint' })
  loanId!: string;

  @Column({ name: 'installment_no', type: 'int' })
  installmentNo!: number;

  @Column({ name: 'due_date', type: 'date' })
  dueDate!: string;

  @Column({ name: 'principal_due', type: 'numeric', precision: 18, scale: 2 })
  principalDue!: string;

  @Column({ name: 'interest_due', type: 'numeric', precision: 18, scale: 2 })
  interestDue!: string;

  @Column({ name: 'total_due', type: 'numeric', precision: 18, scale: 2 })
  totalDue!: string;

  @Column({ type: 'boolean', default: false })
  paid!: boolean;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt!: Date | null;
}