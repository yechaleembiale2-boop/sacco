export type UserRole =
  | 'member'
  | 'cashier'
  | 'accountant'
  | 'credit_committee'
  | 'chairperson'
  | 'auditor'
  | 'admin';

export type Capability =
  | 'view_dashboard'
  | 'view_own_statements'
  | 'view_all_members'
  | 'create_member'
  | 'create_savings_account'
  | 'deposit'
  | 'withdraw'
  | 'view_loans'
  | 'apply_loan'
  | 'approve_loan'
  | 'disburse_loan'
  | 'repay_loan'
  | 'view_reports'
  | 'export_reports'
  | 'view_audit_log'
  | 'manage_users'
  | 'run_payroll';

const ROLE_CAPABILITIES: Record<UserRole, Capability[]> = {
  member: [
    'view_dashboard',
    'view_own_statements',
    'view_loans',
    'apply_loan',
  ],
  cashier: [
    'view_dashboard',
    'view_own_statements',
    'view_all_members',
    'create_member',
    'create_savings_account',
    'deposit',
    'withdraw',
    'view_loans',
    'apply_loan',
    'disburse_loan',
    'repay_loan',
  ],
  accountant: [
    'view_dashboard',
    'view_own_statements',
    'view_all_members',
    'view_loans',
    'view_reports',
    'export_reports',
    'run_payroll',
  ],
  credit_committee: [
    'view_dashboard',
    'view_own_statements',
    'view_all_members',
    'view_loans',
    'approve_loan',
  ],
  chairperson: [
    'view_dashboard',
    'view_own_statements',
    'view_all_members',
    'view_loans',
    'approve_loan',
    'view_reports',
  ],
  auditor: [
    'view_dashboard',
    'view_own_statements',
    'view_all_members',
    'view_loans',
    'view_reports',
    'export_reports',
    'view_audit_log',
  ],
  admin: [
    'view_dashboard',
    'view_own_statements',
    'view_all_members',
    'create_member',
    'create_savings_account',
    'deposit',
    'withdraw',
    'view_loans',
    'apply_loan',
    'approve_loan',
    'disburse_loan',
    'repay_loan',
    'view_reports',
    'export_reports',
    'view_audit_log',
    'manage_users',
    'run_payroll',
  ],
};

export function can(role: string | undefined, cap: Capability): boolean {
  if (!role) return false;
  const caps = ROLE_CAPABILITIES[role as UserRole];
  if (!caps) return false;
  return caps.includes(cap);
}

/**
 * Human-readable labels for each role.
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  member: 'Member',
  cashier: 'Cashier',
  accountant: 'Accountant',
  credit_committee: 'Credit Committee',
  chairperson: 'Chairperson',
  auditor: 'Auditor',
  admin: 'Administrator',
};