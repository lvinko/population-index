export const CITY_NAME_ALIASES: Record<string, string[]> = {
  kiev: ['kyiv', 'kyyiv'],
  odessa: ['odesa'],
  kharkov: ['kharkiv'],
  nikolaev: ['mykolaiv'],
  lugansk: ['luhansk'],
  zaporozhe: ['zaporizhzhia', 'zaporizhia'],
  zaporozhye: ['zaporizhzhia', 'zaporizhia'],
  dnipropetrovsk: ['dnipro'],
  dnepropetrovsk: ['dnipro'],
  kremenchug: ['kremenchuk'],
  rovno: ['rivne'],
  chernigov: ['chernihiv'],
  kirovograd: ['kropyvnytskyi'],
  'ivano-frankovsk': ['ivano-frankivsk'],
  uzhgorod: ['uzhhorod'],
  khmelnitskiy: ['khmelnytskyi', 'khmelnytskyy'],
  ternopol: ['ternopil'],
  chernovtsy: ['chernivtsi'],
};

export const generateCityVariants = (value: string) => {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  const withoutParens = trimmed.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  const segments = withoutParens
    .split(/[,/]/)
    .map((part) => part.trim())
    .filter(Boolean);

  return Array.from(new Set([trimmed, withoutParens, ...segments].filter(Boolean)));
};


