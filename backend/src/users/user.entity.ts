import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type UserRole =
  | 'member'
  | 'cashier'
  | 'accountant'
  | 'credit_committee'
  | 'chairperson'
  | 'auditor'
  | 'admin';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'member_id', type: 'bigint', nullable: true })
  memberId!: string | null;

  @Index({ unique: true })
  @Column({ type: 'text' })
  username!: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string;

  @Column({ type: 'text' })
  role!: UserRole;

  @Column({ name: 'mfa_enabled', type: 'boolean', default: false })
  mfaEnabled!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;
  @Column({ name: 'totp_secret', type: 'text', nullable: true })
totpSecret!: string | null;

@Column({ name: 'mfa_enrolled_at', type: 'timestamptz', nullable: true })
mfaEnrolledAt!: Date | null;


}
