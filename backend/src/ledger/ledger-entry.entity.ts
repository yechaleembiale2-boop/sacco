import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'ledger_entries' })
@Index(['refType', 'refId'])
export class LedgerEntry {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'ledger_account_id', type: 'bigint' })
  ledgerAccountId!: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  debit!: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  credit!: string;

  @Column({ name: 'ref_type', type: 'text' })
  refType!: string;

  @Column({ name: 'ref_id', type: 'bigint' })
  refId!: string;

  @CreateDateColumn({ name: 'posted_at', type: 'timestamptz' })
  postedAt!: Date;

  @Column({ name: 'reverses_entry_id', type: 'bigint', nullable: true })
  reversesEntryId!: string | null;
}