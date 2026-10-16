'use client';

export type Language = 'en' | 'am';

export interface Dict {
  // Nav
  nav_dashboard: string;
  nav_statements: string;
  nav_apply: string;
  nav_logout: string;

  // Login
  login_title: string;
  login_subtitle: string;
  login_username: string;
  login_password: string;
  login_submit: string;
  login_signing_in: string;
  login_error_invalid: string;
  login_error_generic: string;

  // Dashboard
  dashboard_welcome: string;
  dashboard_total_savings: string;
  dashboard_active_loan: string;
  dashboard_next_payment: string;
  dashboard_savings_accounts: string;
  dashboard_active_loan_section: string;
  dashboard_no_accounts: string;
  dashboard_no_active_loan: string;
  dashboard_view_details: string;
  dashboard_loading: string;

  // Table headers
  table_type: string;
  table_opened: string;
  table_balance: string;
  table_status: string;
  table_principal: string;
  table_outstanding: string;

  // Common
  common_etb: string;
  common_dash: string;
  common_account: string;
  common_accounts: string;
  common_emergency: string;
  common_education: string;
  common_housing: string;
}

export const DICTIONARIES: Record<Language, Dict> = {
  en: {
    nav_dashboard: 'Dashboard',
    nav_statements: 'Statements',
    nav_apply: 'Apply for Loan',
    nav_logout: 'Log out',

    login_title: 'Injibara University SACCO',
    login_subtitle: 'Member portal sign-in',
    login_username: 'Username',
    login_password: 'Password',
    login_submit: 'Sign in',
    login_signing_in: 'Signing in…',
    login_error_invalid: 'Invalid username or password.',
    login_error_generic: 'Something went wrong. Try again.',

    dashboard_welcome: 'Welcome',
    dashboard_total_savings: 'Total Savings',
    dashboard_active_loan: 'Active Loan',
    dashboard_next_payment: 'Next Payment',
    dashboard_savings_accounts: 'Savings Accounts',
    dashboard_active_loan_section: 'Active Loan',
    dashboard_no_accounts: 'No savings accounts yet.',
    dashboard_no_active_loan: 'No active loan',
    dashboard_view_details: 'View details',
    dashboard_loading: 'Loading…',

    table_type: 'Type',
    table_opened: 'Opened',
    table_balance: 'Balance',
    table_status: 'Status',
    table_principal: 'Principal',
    table_outstanding: 'Outstanding',

    common_etb: 'ETB',
    common_dash: '—',
    common_account: 'account',
    common_accounts: 'accounts',
    common_emergency: 'Emergency',
    common_education: 'Education',
    common_housing: 'Housing',
  },
  am: {
    nav_dashboard: 'ዳሽቦርድ',
    nav_statements: 'መግለጫዎች',
    nav_apply: 'ብድር ጠይቅ',
    nav_logout: 'ውጣ',

    login_title: 'የኢንጂባራ ዩኒቨርሲቲ የሠራተኞች ቁጠባ',
    login_subtitle: 'የአባላት መግቢያ ገጽ',
    login_username: 'የተጠቃሚ ስም',
    login_password: 'የይለፍ ቃል',
    login_submit: 'ግባ',
    login_signing_in: 'በመግባት ላይ…',
    login_error_invalid: 'የተሳሳተ የተጠቃሚ ስም ወይም የይለፍ ቃል።',
    login_error_generic: 'የሆነ ችግር ተፈጥሯል። እንደገና ይሞክሩ።',

    dashboard_welcome: 'እንኳን ደህና መጡ',
    dashboard_total_savings: 'አጠቃላይ ቁጠባ',
    dashboard_active_loan: 'ንቁ ብድር',
    dashboard_next_payment: 'የሚቀጥለው ክፍያ',
    dashboard_savings_accounts: 'የቁጠባ ሂሳቦች',
    dashboard_active_loan_section: 'ንቁ ብድር',
    dashboard_no_accounts: 'እስካሁን የቁጠባ ሂሳብ የለም።',
    dashboard_no_active_loan: 'ንቁ ብድር የለም',
    dashboard_view_details: 'ዝርዝር ይመልከቱ',
    dashboard_loading: 'በመጫን ላይ…',

    table_type: 'ዓይነት',
    table_opened: 'የተከፈተበት',
    table_balance: 'ቀሪ ሂሳብ',
    table_status: 'ሁኔታ',
    table_principal: 'ዋና ገንዘብ',
    table_outstanding: 'ያልተከፈለ',

    common_etb: 'ብር',
    common_dash: '—',
    common_account: 'ሂሳብ',
    common_accounts: 'ሂሳቦች',
    common_emergency: 'አስቸኳይ',
    common_education: 'ትምህርት',
    common_housing: 'መኖሪያ ቤት',
  },
};

export function translate(lang: Language, key: keyof Dict): string {
  return DICTIONARIES[lang][key];
}