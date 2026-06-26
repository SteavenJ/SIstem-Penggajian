import { describe, it, expect, beforeEach } from 'vitest';
import {
  getEmployeeConfig,
  saveEmployeeConfig,
  getDefaultRate,
  getDefaultDepartment,
  getDefaultLemburRate,
  getExcludedNames,
  type EmployeeConfig,
} from '../lib/employee-config';

describe('employee-config', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getEmployeeConfig', () => {
    it('returns default config when localStorage is empty', () => {
      const config = getEmployeeConfig();
      expect(config).toBeDefined();
      expect(config.defaultRates).toBeDefined();
      expect(config.departments).toBeDefined();
      expect(config.lemburRates).toBeDefined();
      expect(config.excludedNames).toBeDefined();
      expect(Array.isArray(config.excludedNames)).toBe(true);
    });

    it('loads custom config from localStorage', () => {
      const custom: EmployeeConfig = {
        defaultRate: 25000,
        defaultRates: { 'custom employee': 30000 },
        departments: { produksi: ['custom employee'] },
        lemburRates: { 'custom employee': 15000 },
        defaultLemburRate: 19400,
        excludedNames: ['excluded1'],
      };
      localStorage.setItem('apex_employee_config', JSON.stringify(custom));
      const config = getEmployeeConfig();
      expect(config.defaultRate).toBe(25000);
      expect(config.defaultRates['custom employee']).toBe(30000);
      expect(config.excludedNames).toEqual(['excluded1']);
    });

    it('falls back to defaults on corrupted localStorage', () => {
      localStorage.setItem('apex_employee_config', '{invalid json!!!');
      const config = getEmployeeConfig();
      expect(config).toBeDefined();
      expect(config.defaultRate).toBeGreaterThan(0);
    });
  });

  describe('saveEmployeeConfig', () => {
    it('persists config to localStorage', () => {
      const config = getEmployeeConfig();
      config.defaultRate = 99999;
      saveEmployeeConfig(config);
      const loaded = getEmployeeConfig();
      expect(loaded.defaultRate).toBe(99999);
    });
  });

  describe('getDefaultRate', () => {
    it('returns specific rate for a known employee', () => {
      // The default config should have arham at 20737.5
      const rate = getDefaultRate('Arham');
      expect(rate).toBe(20737.5);
    });

    it('returns the default rate for an unknown employee', () => {
      const rate = getDefaultRate('Some New Person');
      expect(rate).toBeGreaterThan(0);
    });

    it('is case-insensitive', () => {
      const rate1 = getDefaultRate('ARHAM');
      const rate2 = getDefaultRate('arham');
      expect(rate1).toBe(rate2);
    });
  });

  describe('getDefaultDepartment', () => {
    it('returns correct department for a known produksi employee', () => {
      const dept = getDefaultDepartment('Agung');
      expect(dept).toBe('Produksi');
    });

    it('returns correct department for a known distribusi employee', () => {
      const dept = getDefaultDepartment('Jufri');
      expect(dept).toBe('Distribusi');
    });

    it('returns correct department for a known staff employee', () => {
      const dept = getDefaultDepartment('Hilda');
      expect(dept).toBe('Staff');
    });

    it('returns correct department for a known sales employee', () => {
      const dept = getDefaultDepartment('Sultan');
      expect(dept).toBe('Sales');
    });

    it('returns Uncategorized for unknown employees', () => {
      const dept = getDefaultDepartment('Unknown Person');
      expect(dept).toBe('Uncategorized');
    });

    it('respects overrides over defaults', () => {
      const dept = getDefaultDepartment('Agung', { 'Agung': 'Sales' });
      expect(dept).toBe('Sales');
    });
  });

  describe('getDefaultLemburRate', () => {
    it('returns specific lembur rate for known employees', () => {
      const rate = getDefaultLemburRate('Rifki');
      expect(rate).toBe(20700);
    });

    it('returns default lembur rate for unknown employees', () => {
      const rate = getDefaultLemburRate('Unknown Person');
      expect(rate).toBeGreaterThan(0);
    });
  });

  describe('getExcludedNames', () => {
    it('returns the exclusion list from config', () => {
      const names = getExcludedNames();
      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBeGreaterThan(0);
    });

    it('respects custom exclusion list from localStorage', () => {
      const config = getEmployeeConfig();
      config.excludedNames = ['testperson'];
      saveEmployeeConfig(config);
      const names = getExcludedNames();
      expect(names).toEqual(['testperson']);
    });
  });
});
