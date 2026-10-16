/**
 * Ethiopian Calendar ↔ Gregorian Calendar converter.
 *
 * The Ethiopian calendar (Ge'ez calendar) is used in Ethiopia and Eritrea.
 * It has 13 months: 12 months of 30 days + Pagume (5 or 6 days).
 * The Ethiopian year starts on September 11 (or 12 in Gregorian leap years).
 *
 * Ethiopian year = Gregorian year − 7 (Sep 11 – Dec 31)
 *                = Gregorian year − 8 (Jan 1 – Sep 10)
 */

export interface EthiopianDate {
  year: number;
  month: number; // 1–13
  day: number;
  monthName: string;
  monthNameAm: string;
}

const ETHIOPIAN_MONTHS_EN = [
  'Meskerem',
  'Tikimt',
  'Hidar',
  'Tahsas',
  'Tir',
  'Yekatit',
  'Megabit',
  'Miazia',
  'Ginbot',
  'Sene',
  'Hamle',
  'Nehase',
  'Pagume',
];

const ETHIOPIAN_MONTHS_AM = [
  'መስከረም',
  'ጥቅምት',
  'ኅዳር',
  'ታኅሣሥ',
  'ጥር',
  'የካቲት',
  'መጋቢት',
  'ሚያዝያ',
  'ግንቦት',
  'ሰኔ',
  'ሐምሌ',
  'ነሐሴ',
  'ጳጉሜ',
];

/**
 * Convert a JavaScript Date to an Ethiopian calendar date.
 */
export function toEthiopian(date: Date): EthiopianDate {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1; // 1–12
  const gd = date.getDate();

  // Approximate Ethiopian new year boundary
  // Ethiopian new year is Sep 11 (or Sep 12 in the Gregorian year before a leap year)
  const isGregorianLeap =
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  const ethiopianNewYearDay = isGregorianLeap ? 12 : 11;

  let ethYear: number;
  let ethMonth: number;
  let ethDay: number;

  // Before Ethiopian new year in the Gregorian calendar
  if (gm < 9 || (gm === 9 && gd < ethiopianNewYearDay)) {
    ethYear = gy - 8;
    // Months from Gregorian Jan 1 to Ethiopian new year boundary
    const gregorianYearStart = new Date(gy, 0, 1);
    const diffDays = Math.floor(
      (date.getTime() - gregorianYearStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    // Ethiopian months are 30 days; add ~5 days shift (Ethiopian year started previous Sep)
    const offset = Math.floor((245 + (isGregorianLeap ? 1 : 0)) % 365); // days from Sep 11 to Jan 1
    const totalDays = diffDays + offset;
    ethMonth = Math.floor(totalDays / 30) + 1;
    ethDay = (totalDays % 30) + 1;
  } else {
    ethYear = gy - 7;
    // Months from Ethiopian new year (Sep 11) to current date
    const newYearDate = new Date(gy, 8, ethiopianNewYearDay);
    const diffDays = Math.floor(
      (date.getTime() - newYearDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    ethMonth = Math.floor(diffDays / 30) + 1;
    ethDay = (diffDays % 30) + 1;
  }

  // Clamp to valid range
  if (ethMonth > 13) ethMonth = 13;
  if (ethDay > 30) ethDay = 30;

  return {
    year: ethYear,
    month: ethMonth,
    day: ethDay,
    monthName: ETHIOPIAN_MONTHS_EN[ethMonth - 1],
    monthNameAm: ETHIOPIAN_MONTHS_AM[ethMonth - 1],
  };
}

/**
 * Format an Ethiopian date for display.
 * Example EN: "Meskerem 5, 2019"
 * Example AM: "መስከረም 5, 2019"
 */
export function formatEthiopian(
  date: Date | string,
  lang: 'en' | 'am' = 'en',
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const eth = toEthiopian(d);
  const month = lang === 'am' ? eth.monthNameAm : eth.monthName;
  return `${month} ${eth.day}, ${eth.year}`;
}

/**
 * Combined display: "2026-10-15 (Meskerem 5, 2019)"
 */
export function formatDualDate(
  date: Date | string,
  lang: 'en' | 'am' = 'en',
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const gregorian = d.toISOString().slice(0, 10);
  return `${gregorian} (${formatEthiopian(d, lang)})`;
}