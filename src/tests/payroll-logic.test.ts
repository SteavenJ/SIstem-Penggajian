import { describe, it, expect } from 'vitest';
import { calculateTerlambat, calculateHours } from '../lib/payroll-logic';

describe('payroll-logic', () => {
  describe('calculateTerlambat', () => {
    it('applies terlambat on a regular weekday when check-in > 08:30 and <= 11:00', () => {
      // Wednesday, 2025-01-15
      const result = calculateTerlambat('09:00', '2025-01-15', [], false);
      expect(result.isTerlambat).toBe(true);
      expect(result.terlambatDays).toBe(1);
    });

    it('does NOT apply terlambat on a regular weekday when check-in <= 08:30', () => {
      const result = calculateTerlambat('08:30', '2025-01-15', [], false);
      expect(result.isTerlambat).toBe(false);
      expect(result.terlambatDays).toBe(0);
    });

    it('does NOT apply terlambat (returns false) if check-in > 11:00 (Half Day logic takes over)', () => {
      const result = calculateTerlambat('11:30', '2025-01-15', [], false);
      expect(result.isTerlambat).toBe(false);
      expect(result.terlambatDays).toBe(0);
    });

    it('applies terlambat on a Saturday when check-in > 08:30', () => {
      // Saturday, 2025-01-18
      const result = calculateTerlambat('09:15', '2025-01-18', [], false);
      expect(result.isTerlambat).toBe(true);
      expect(result.terlambatDays).toBe(1);
    });

    it('does NOT apply terlambat on a Sunday', () => {
      // Sunday, 2025-01-19
      const result = calculateTerlambat('10:00', '2025-01-19', [], false);
      expect(result.isTerlambat).toBe(false);
      expect(result.terlambatDays).toBe(0);
    });

    it('does NOT apply terlambat on a holiday', () => {
      const holidays = [{ date: '2025-01-15', name: 'Test Holiday' }];
      const result = calculateTerlambat('10:00', '2025-01-15', holidays, false);
      expect(result.isTerlambat).toBe(false);
      expect(result.terlambatDays).toBe(0);
    });
  });

  describe('calculateHours', () => {
    it('treats Saturday as a regular working day (hours split into base/overtime at 8h if no checkOut is passed)', () => {
      // Saturday, 2025-01-18, 10 hours worked
      const result = calculateHours(10, '2025-01-18', [], false);
      expect(result.regularHours).toBe(8);
      expect(result.overtimeHours).toBe(2);
    });

    it('treats Sunday as holiday (all hours go to overtime)', () => {
      // Sunday, 2025-01-19, 8 hours worked
      const result = calculateHours(8, '2025-01-19', [], false);
      expect(result.regularHours).toBe(0);
      expect(result.overtimeHours).toBe(8);
    });

    it('treats holiday as overtime (all hours go to overtime)', () => {
      const holidays = [{ date: '2025-01-15', name: 'Test Holiday' }];
      const result = calculateHours(6, '2025-01-15', holidays, false);
      expect(result.regularHours).toBe(0);
      expect(result.overtimeHours).toBe(6);
    });

    it('splits regular weekday hours at 8h threshold (fallback behavior)', () => {
      // Wednesday
      const result = calculateHours(9.5, '2025-01-15', [], false);
      expect(result.regularHours).toBe(8);
      expect(result.overtimeHours).toBe(1.5);
    });

    it('caps regular weekday hours at total if under 8h', () => {
      const result = calculateHours(5, '2025-01-15', [], false, '08:00', '13:00');
      expect(result.regularHours).toBe(5);
      expect(result.overtimeHours).toBe(0);
    });

    it('calculates overtime strictly from checkOut time if after 17:15', () => {
      // Worked 10 hours, checkOut at 18:30. Overtime should be 18.5 - 17.25 = 1.25
      const result = calculateHours(10, '2025-01-15', [], false, '08:30', '18:30');
      expect(result.regularHours).toBe(8);
      expect(result.overtimeHours).toBe(1.25);
    });

    it('gives NO overtime if checkout is exactly 17:15', () => {
      // checkOut at 17:15
      const result = calculateHours(8.75, '2025-01-15', [], false, '08:30', '17:15');
      expect(result.regularHours).toBe(8);
      expect(result.overtimeHours).toBe(0); // 17.25 is not >= 17.26
    });

    it('caps regular hours at 4 if checkIn > 11:00 (Half Day)', () => {
      // Arrive at 11:30, leave at 16:30. Total hours = 5.
      const result = calculateHours(5, '2025-01-15', [], false, '11:30', '16:30');
      expect(result.regularHours).toBe(4);
      expect(result.overtimeHours).toBe(0);
    });

    it('Half day + Overtime (arrive 11:30, leave 18:30)', () => {
      // Total hours = 7, Check-in = 11:30, Check-out = 18:30
      // Overtime should be 18.5 - 17.25 = 1.25
      // Regular should be capped at 4.
      const result = calculateHours(7, '2025-01-15', [], false, '11:30', '18:30');
      expect(result.regularHours).toBe(4);
      expect(result.overtimeHours).toBe(1.25);
    });
  });
});
