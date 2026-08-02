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
    
    // If checking in after 11:00, it's a Half Day. No Terlambat penalty applies.
    if (inDecimal > 11.0) {
      return { isTerlambat: false, terlambatDays: 0 };
    }

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
  _isSaturday?: boolean,
  checkIn?: string,
  checkOut?: string
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

  let maxRegularHours = 8.0;

  if (checkIn) {
    const [inH, inM] = checkIn.split(':').map(Number);
    if (!isNaN(inH) && !isNaN(inM)) {
      const inDecimal = inH + (inM / 60);
      if (inDecimal > 11.0) {
        maxRegularHours = 4.0;
      }
    }
  }

  let regularHours = Math.min(maxRegularHours, totalHours);
  let overtimeHours = 0;

  if (checkOut) {
    const [outH, outM] = checkOut.split(':').map(Number);
    if (!isNaN(outH) && !isNaN(outM)) {
      const outDecimal = outH + (outM / 60);
      // Overtime counts from 17:15 (17.25)
      // If clock out is >= 17:16 (approx 17.26), then they get overtime.
      if (outDecimal >= 17.26) {
        overtimeHours = outDecimal - 17.25;
      }
    }
  } else {
    // Fallback if checkOut is not provided (shouldn't happen with new logic, but just in case)
    overtimeHours = Math.max(0, totalHours - 8.0);
  }

  // Ensure precision
  regularHours = Math.round(regularHours * 100) / 100;
  overtimeHours = Math.round(overtimeHours * 100) / 100;

  return {
    regularHours,
    overtimeHours,
    isHolidayOrSunday: false,
  };
}
