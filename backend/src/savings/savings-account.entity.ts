import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type SavingsAccountType = 'mandatory' | 'voluntary' | 'share';

@Entity({ name: 'savings_accounts' })
@Index(['memberId', 'accountType'], { unique: true })
export class SavingsAccount {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'member_id', type: 'bigint' })
  memberId!: string;

  @Column({ name: 'account_type', type: 'text' })
  accountType!: SavingsAccountType;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  balance!: string;

  @Column({ name: 'opened_at', type: 'date' })
  openedAt!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
