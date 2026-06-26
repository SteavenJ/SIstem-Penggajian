export interface EmployeeConfig {
  defaultRate: number;
  defaultRates: Record<string, number>;
  departments: Record<string, string[]>;
  lemburRates: Record<string, number>;
  defaultLemburRate: number;
  excludedNames: string[];
}

const STORAGE_KEY = 'apex_employee_config';

const DEFAULT_CONFIG: EmployeeConfig = {
  defaultRate: 19400,
  defaultRates: {
    'arham': 20737.5,
    'rifki': 20737.5,
    'ikram': 20737.5,
  },
  departments: {
    produksi: ['agung', 'agus', 'ansars', 'ansar', 'arham', 'ikram', 'johardi', 'lukman', 'nurnani', 'rifki', 'risal', 'sulvikar'],
    distribusi: ['achmad', 'andi', 'dominikus', 'jufri', 'siprianus', 'irfan'],
    staff: ['hilda', 'isman', 'mirna', 'ronald', 'sandi', 'steaven', 'tika', 'wito'],
    sales: ['haedir', 'nurulhikmah', 'sardi', 'sultan'],
  },
  lemburRates: {
    'rifki': 20700,
    'arham': 20700,
    'ikram': 20700,
    'irfan': 12500,
    'dominikus': 12500,
    'rehan': 12500,
    'siprianus': 16800,
  },
  defaultLemburRate: 19400,
  excludedNames: ['yusran', 'zaldy', 'mahmud', 'amar', 'adrianus', 'adriansyah', 'fatur', 'yusuf', 'hasbi', 'farid', 'sabir', 'tahir', 'indrawijaya', 'indra wijaya'],
};

export function getEmployeeConfig(): EmployeeConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as EmployeeConfig;
    }
  } catch {
    // Corrupted data, fall back to defaults
  }
  return { ...DEFAULT_CONFIG };
}

export function saveEmployeeConfig(config: EmployeeConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function getDefaultRate(employeeName: string): number {
  const config = getEmployeeConfig();
  const nameLower = employeeName.toLowerCase().replace(/\s+/g, '');
  for (const [key, rate] of Object.entries(config.defaultRates)) {
    if (nameLower.includes(key.toLowerCase())) {
      return rate;
    }
  }
  return config.defaultRate;
}

export function getDefaultDepartment(employeeName: string, overrides?: Record<string, string>): string {
  if (overrides && overrides[employeeName]) {
    return overrides[employeeName];
  }
  const config = getEmployeeConfig();
  const nameLower = employeeName.toLowerCase().replace(/\s+/g, '');
  const deptMap: Record<string, string> = {
    produksi: 'Produksi',
    distribusi: 'Distribusi',
    staff: 'Staff',
    sales: 'Sales',
  };
  for (const [key, names] of Object.entries(config.departments)) {
    if (names.some(n => nameLower.includes(n.toLowerCase()))) {
      return deptMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
    }
  }
  return 'Uncategorized';
}

export function getDefaultLemburRate(employeeName: string): number {
  const config = getEmployeeConfig();
  const nameLower = employeeName.toLowerCase().replace(/\s+/g, '');
  for (const [key, rate] of Object.entries(config.lemburRates)) {
    if (nameLower.includes(key.toLowerCase())) {
      return rate;
    }
  }
  return config.defaultLemburRate;
}

export function getExcludedNames(): string[] {
  const config = getEmployeeConfig();
  return config.excludedNames;
}
