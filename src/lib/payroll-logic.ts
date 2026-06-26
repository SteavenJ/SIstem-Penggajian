import { parseISO, getDay } from 'date-fns';

const dateCache = new Map<string, { isSunday: boolean, dayName: string }>();
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function getDateInfo(dateStr: string) {
  if (dateCache.has(dateStr)) return dateCache.get(dateStr)!;
  try {
    const parsedDate = parseISO(dateStr);
    const dayIndex = getDay(parsedDate);
    const info = { isSunday: dayIndex === 0, dayName: DAYS[dayIndex] };
    dateCache.set(dateStr, info);
    return info;
  } catch {
    return { isSunday: false, dayName: '' };
  }
}

interface Holiday {
  date: string;
  name: string;
}

export interface TerlambatResult {
  isTerlambat: boolean;
  terlambatDays: number;
}

export interface HoursResult {
  regularHours: number;
  overtimeHours: number;
  isHolidayOrSunday: boolean;
}

/**
 * Determines if an employee is late.
 * Terlambat applies on weekdays AND Saturdays.
 * Terlambat does NOT apply on Sundays or holidays.
 */
export function calculateTerlambat(
  checkIn: string,
  dateStr: string,
  holidays: Holiday[],
  _isSaturday?: boolean
): TerlambatResult {
  try {
    const { isSunday } = getDateInfo(dateStr);
    const isHoliday = holidays.some(h => h.date === dateStr);

    // Skip terlambat on Sundays and holidays
    if (isSunday || isHoliday) {
      return { isTerlambat: false, terlambatDays: 0 };
    }

    const [inH, inM] = checkIn.split(':').map(Number);
    if (isNaN(inH) || isNaN(inM)) {
      return { isTerlambat: false, terlambatDays: 0 };
    }

    const inDecimal = inH + (inM / 60);
    if (inDecimal > 8.5) {
      return { isTerlambat: true, terlambatDays: 1 };
    }
  } catch {
    // Invalid date, no penalty
  }
  return { isTerlambat: false, terlambatDays: 0 };
}

/**
 * Calculates regular and overtime hours.
 * Saturday = regular working day (split at 8h).
 * Sunday and holidays = all hours are overtime.
 */
export function calculateHours(
  totalHours: number,
  dateStr: string,
  holidays: Holiday[],
  _isSaturday?: boolean
): HoursResult {
  try {
    const { isSunday } = getDateInfo(dateStr);
    const isHoliday = holidays.some(h => h.date === dateStr);

    if (isSunday || isHoliday) {
      return {
        regularHours: 0,
        overtimeHours: totalHours,
        isHolidayOrSunday: true,
      };
    }
  } catch {
    // Fall through to regular calculation
  }

  const regularHours = Math.min(8.0, totalHours);
  const overtimeHours = Math.max(0, totalHours - 8.0);
  return {
    regularHours,
    overtimeHours,
    isHolidayOrSunday: false,
  };
}
