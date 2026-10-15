import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type SavingsTxnType = 'deposit' | 'withdrawal';

@Entity({ name: 'savings_transactions' })
@Index(['accountId', 'postedAt'])
export class SavingsTransaction {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'account_id', type: 'bigint' })
  accountId!: string;

  @Column({ name: 'txn_type', type: 'text' })
  txnType!: SavingsTxnType;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'posted_at', type: 'timestamptz' })
  postedAt!: Date;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy!: string | null;
}
