import { formatEthiopian, formatDualDate } from './ethiopian-calendar';
import type { Language } from './i18n';

/**
 * Format a numeric amount with thousands separators.
 * Example: "1234.5" → "1,234.50"
 */
export function formatCurrency(
  amount: string | number,
  lang: Language = 'en',
): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  const formatted = n.toLocaleString(lang === 'am' ? 'am-ET' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${lang === 'am' ? 'ብር' : 'ETB'}`;
}

/**
 * Format a numeric amount without currency suffix.
 * Example: "1,234.50"
 */
export function formatNumber(
  amount: string | number,
  lang: Language = 'en',
): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  return n.toLocaleString(lang === 'am' ? 'am-ET' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a date with both Gregorian and Ethiopian calendar.
 */
export function formatDate(
  date: Date | string,
  lang: Language = 'en',
): string {
  return formatDualDate(date, lang);
}

/**
 * Format an Ethiopian date only.
 */
export function formatEthiopianOnly(
  date: Date | string,
  lang: Language = 'en',
): string {
  return formatEthiopian(date, lang);
}