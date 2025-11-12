const normalizeStateName = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeCode = (value: string) => {
  const trimmed = value.trim().toUpperCase();
  if (trimmed.startsWith('UA')) {
    return trimmed;
  }

  const numeric = trimmed.replace(/[^0-9]/g, '');
  return numeric.length === 0 ? trimmed : `UA${numeric.padStart(2, '0')}`;
};

type OblastDefinition = {
  code: string;
  name: string;
  label: string;
  aliases?: string[];
};

const UKRAINE_OBLAST_DEFINITIONS: OblastDefinition[] = [
  {
    code: 'UA43',
    name: 'Autonomous Republic of Crimea',
    label: 'Автономна Республіка Крим',
    aliases: ['Crimea', 'Republic of Crimea'],
  },
  {
    code: 'UA71',
    name: 'Cherkasy Oblast',
    label: 'Черкаська',
    aliases: ['Cherkasy'],
  },
  {
    code: 'UA74',
    name: 'Chernihiv Oblast',
    label: 'Чернігівська',
    aliases: ['Chernihiv'],
  },
  {
    code: 'UA77',
    name: 'Chernivtsi Oblast',
    label: 'Чернівецька',
    aliases: ['Chernivtsi'],
  },
  {
    code: 'UA12',
    name: 'Dnipropetrovsk Oblast',
    label: 'Дніпропетровська',
    aliases: ['Dnipropetrovsk', 'Dnipro', 'Dnipro Oblast'],
  },
  {
    code: 'UA14',
    name: 'Donetsk Oblast',
    label: 'Донецька',
    aliases: ['Donetsk'],
  },
  {
    code: 'UA26',
    name: 'Ivano-Frankivsk Oblast',
    label: 'Івано-Франківська',
    aliases: ['Ivano-Frankivsk'],
  },
  {
    code: 'UA63',
    name: 'Kharkiv Oblast',
    label: 'Харківська',
    aliases: ['Kharkiv'],
  },
  {
    code: 'UA65',
    name: 'Kherson Oblast',
    label: 'Херсонська',
    aliases: ['Kherson'],
  },
  {
    code: 'UA68',
    name: 'Khmelnytsky Oblast',
    label: 'Хмельницька',
    aliases: ['Khmelnytskyi', 'Khmelnytskyi Oblast'],
  },
  {
    code: 'UA30',
    name: 'Kiev',
    label: 'Київ (місто)',
    aliases: ['Kyiv', 'Kyiv City', 'Kyiv Municipality'],
  },
  {
    code: 'UA35',
    name: 'Kirovohrad Oblast',
    label: 'Кіровоградська',
    aliases: ['Kirovohrad', 'Kropyvnytskyi Oblast', 'Kropyvnytskyi'],
  },
  {
    code: 'UA32',
    name: 'Kyiv Oblast',
    label: 'Київська',
    aliases: ['Kyivska Oblast', 'Kiev Oblast'],
  },
  {
    code: 'UA09',
    name: 'Luhansk Oblast',
    label: 'Луганська',
    aliases: ['Luhansk'],
  },
  {
    code: 'UA46',
    name: 'Lviv Oblast',
    label: 'Львівська',
    aliases: ['Lviv', 'Lvivska Oblast'],
  },
  {
    code: 'UA48',
    name: 'Mykolaiv Oblast',
    label: 'Миколаївська',
    aliases: ['Mykolaiv', 'Mykolayiv Oblast'],
  },
  {
    code: 'UA51',
    name: 'Odessa Oblast',
    label: 'Одеська',
    aliases: ['Odessa', 'Odesa Oblast', 'Odesa'],
  },
  {
    code: 'UA56',
    name: 'Rivne Oblast',
    label: 'Рівненська',
    aliases: ['Rivne'],
  },
  {
    code: 'UA59',
    name: 'Sumy Oblast',
    label: 'Сумська',
    aliases: ['Sumy'],
  },
  {
    code: 'UA61',
    name: 'Ternopil Oblast',
    label: 'Тернопільська',
    aliases: ['Ternopil'],
  },
  {
    code: 'UA05',
    name: 'Vinnytsia Oblast',
    label: 'Вінницька',
    aliases: ['Vinnytsia'],
  },
  {
    code: 'UA07',
    name: 'Volyn Oblast',
    label: 'Волинська',
    aliases: ['Volyn'],
  },
  {
    code: 'UA21',
    name: 'Zakarpattia Oblast',
    label: 'Закарпатська',
    aliases: ['Zakarpattia', 'Transcarpathia'],
  },
  {
    code: 'UA23',
    name: 'Zaporizhzhya Oblast',
    label: 'Запорізька',
    aliases: ['Zaporizhzhia Oblast', 'Zaporizhzhia', 'Zaporizhia Oblast', 'Zaporizhia'],
  },
  {
    code: 'UA18',
    name: 'Zhytomyr Oblast',
    label: 'Житомирська',
    aliases: ['Zhytomyr'],
  },
];

const codeToName: Record<string, string> = {};
const codeToLabel: Record<string, string> = {};
const nameToCode = new Map<string, string>();

UKRAINE_OBLAST_DEFINITIONS.forEach((item) => {
  const normalizedCode = normalizeCode(item.code);
  codeToName[normalizedCode] = item.name;
  codeToLabel[normalizedCode] = item.label;

  const primary = normalizeStateName(item.name);
  nameToCode.set(primary, normalizedCode);
  nameToCode.set(normalizeStateName(item.label), normalizedCode);

  (item.aliases ?? []).forEach((alias) => {
    nameToCode.set(normalizeStateName(alias), normalizedCode);
  });
});

export const getUkraineOblastNameByCode = (code: string | null | undefined) => {
  if (!code) {
    return null;
  }

  return codeToName[normalizeCode(code)] ?? null;
};

export const getUkraineOblastCodeByName = (name: string | null | undefined) => {
  if (!name) {
    return null;
  }

  return nameToCode.get(normalizeStateName(name)) ?? null;
};

export const getUkraineOblastLabelByCode = (code: string | null | undefined) => {
  if (!code) {
    return null;
  }

  return codeToLabel[normalizeCode(code)] ?? null;
};

export const getUkraineOblastLabelByName = (name: string | null | undefined) => {
  if (!name) {
    return null;
  }

  const code = getUkraineOblastCodeByName(name);
  if (!code) {
    return null;
  }

  return codeToLabel[normalizeCode(code)] ?? null;
};

export const isUkraineOblastNameKnown = (name: string | null | undefined) =>
  getUkraineOblastCodeByName(name) != null;


