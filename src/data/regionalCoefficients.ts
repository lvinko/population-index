import rawCoefficients from './regionalCoefficients.json';

export interface RegionalCoefficient {
  code: string;
  name: string;
  label: string;
  coefficient: number;
}

const normalizeRegionalKey = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const buildKeyVariants = (entry: RegionalCoefficient) => {
  const variants = new Set<string>();
  const add = (key?: string | null) => {
    if (!key) {
      return;
    }
    const normalized = normalizeRegionalKey(key);
    if (normalized) {
      variants.add(normalized);
    }
  };

  add(entry.name);
  add(entry.label);
  add(entry.code);
  add(entry.code.replace('UA-', 'UA'));
  add(entry.code.replace('UA-', ''));

  if (entry.name.includes('Oblast')) {
    add(entry.name.replace(/ Oblast$/i, ''));
  }
  if (entry.name.includes(' (')) {
    add(entry.name.replace(/ *\([^)]*\)/g, '').trim());
  }

  return Array.from(variants);
};

export const regionalCoefficients = rawCoefficients as RegionalCoefficient[];

export const totalRegionalCoefficient = regionalCoefficients.reduce(
  (sum, item) => sum + item.coefficient,
  0
);

export const regionalCoefficientLookup = regionalCoefficients.reduce<Record<string, number>>(
  (acc, entry) => {
    buildKeyVariants(entry).forEach((variant) => {
      acc[variant] = entry.coefficient;
    });
    return acc;
  },
  {}
);

export const getRegionalCoefficient = (value?: string | null) => {
  if (!value) {
    return 0;
  }
  const normalized = normalizeRegionalKey(value);
  return normalized ? regionalCoefficientLookup[normalized] ?? 0 : 0;
};

export { normalizeRegionalKey };


