import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'guarantors' })
@Index(['loanId', 'memberId'], { unique: true })
export class Guarantor {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'loan_id', type: 'bigint' })
  loanId!: string;

  @Column({ name: 'member_id', type: 'bigint' })
  memberId!: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}