export interface AttendanceRecord {
  id: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  totalHours: number;
}

export interface EmployeeRate {
  employeeName: string;
  hourlyRate: number;
}

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
}

export type ViewState = 'dashboard' | 'attendance' | 'import' | 'payroll' | 'calendar' | 'profile';
