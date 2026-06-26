import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getDefaultDepartment as getConfigDepartment, getDefaultLemburRate as getConfigLemburRate } from './employee-config'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDepartment(name: string, overrides?: Record<string, string>): string {
  return getConfigDepartment(name, overrides);
}

export function getDefaultLemburRate(name: string): number {
  return getConfigLemburRate(name);
}
