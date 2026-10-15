import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type LoanType = 'emergency' | 'education' | 'housing';
export type LoanStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'disbursed'
  | 'repaid'
  | 'defaulted';

@Entity({ name: 'loans' })
@Index(['memberId', 'status'])
export class Loan {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'member_id', type: 'bigint' })
  memberId!: string;

  @Column({ name: 'loan_type', type: 'text' })
  loanType!: LoanType;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  principal!: string;

  @Column({ name: 'interest_rate', type: 'numeric', precision: 6, scale: 3 })
  interestRate!: string;

  @Column({ name: 'term_months', type: 'int' })
  termMonths!: number;

  @Column({ type: 'text', nullable: true })
  purpose!: string | null;

  @Column({ type: 'text', default: 'pending' })
  status!: LoanStatus;

  @Column({ name: 'applied_by', type: 'bigint' })
  appliedBy!: string;

  @CreateDateColumn({ name: 'applied_at', type: 'timestamptz' })
  appliedAt!: Date;

  @Column({ name: 'approved_by', type: 'bigint', nullable: true })
  approvedBy!: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({ name: 'disbursed_by', type: 'bigint', nullable: true })
  disbursedBy!: string | null;

  @Column({ name: 'disbursed_at', type: 'timestamptz', nullable: true })
  disbursedAt!: Date | null;

  @Column({ name: 'total_interest', type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalInterest!: string;

  @Column({ name: 'total_payable', type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalPayable!: string;

  @Column({ name: 'outstanding_balance', type: 'numeric', precision: 18, scale: 2, default: 0 })
  outstandingBalance!: string;
}