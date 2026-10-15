import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'payroll_run_items' })
@Index(['runId'])
export class PayrollRunItem {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'run_id', type: 'bigint' })
  runId!: string;

  @Column({ name: 'member_id', type: 'bigint' })
  memberId!: string;

  @Column({ name: 'savings_account_id', type: 'bigint', nullable: true })
  savingsAccountId!: string | null;

  @Column({ name: 'loan_id', type: 'bigint', nullable: true })
  loanId!: string | null;

  @Column({ name: 'savings_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  savingsAmount!: string;

  @Column({ name: 'loan_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  loanAmount!: string;

  @Column({ name: 'total_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalAmount!: string;

  @Column({ type: 'boolean', default: false })
  reconciled!: boolean;
}