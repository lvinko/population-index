export const MAP_STYLE = 'mapbox://styles/mapbox/streets-v11';
export const MAP_CENTER: [number, number] = [31.1656, 48.3794];
export const MAP_INITIAL_ZOOM = 5.5;

export const UKRAINE_OBLAST_SOURCE_ID = 'ukraine-oblasts';
export const UKRAINE_OBLAST_FILL_LAYER_ID = 'ukraine-oblasts-fill';
export const UKRAINE_OBLAST_OUTLINE_LAYER_ID = 'ukraine-oblasts-outline';

export const MAJOR_CITIES_LAYER_ID = 'major-cities';

export type MajorCity = {
  nameEn: string;
  nameUk: string;
};

export const MAJOR_CITIES: MajorCity[] = [
  { nameEn: 'Kyiv', nameUk: 'Київ' },
  { nameEn: 'Kharkiv', nameUk: 'Харків' },
  { nameEn: 'Odesa', nameUk: 'Одеса' },
  { nameEn: 'Dnipro', nameUk: 'Дніпро' },
  { nameEn: 'Zaporizhzhia', nameUk: 'Запоріжжя' },
  { nameEn: 'Lviv', nameUk: 'Львів' },
  { nameEn: 'Kryvyi Rih', nameUk: 'Кривий Ріг' },
  { nameEn: 'Mykolaiv', nameUk: 'Миколаїв' },
  { nameEn: 'Mariupol', nameUk: 'Маріуполь' },
  { nameEn: 'Luhansk', nameUk: 'Луганськ' },
  { nameEn: 'Sevastopol', nameUk: 'Севастополь' },
  { nameEn: 'Simferopol', nameUk: 'Сімферополь' },
  { nameEn: 'Kherson', nameUk: 'Херсон' },
  { nameEn: 'Chernihiv', nameUk: 'Чернігів' },
  { nameEn: 'Cherkasy', nameUk: 'Черкаси' },
  { nameEn: 'Poltava', nameUk: 'Полтава' },
  { nameEn: 'Sumy', nameUk: 'Суми' },
  { nameEn: 'Zhytomyr', nameUk: 'Житомир' },
  { nameEn: 'Rivne', nameUk: 'Рівне' },
  { nameEn: 'Ternopil', nameUk: 'Тернопіль' },
  { nameEn: 'Vinnytsia', nameUk: 'Вінниця' },
  { nameEn: 'Ivano-Frankivsk', nameUk: 'Івано-Франківськ' },
  { nameEn: 'Uzhhorod', nameUk: 'Ужгород' },
  { nameEn: 'Chernivtsi', nameUk: 'Чернівці' },
  { nameEn: 'Lutsk', nameUk: 'Луцьк' },
  { nameEn: 'Kropyvnytskyi', nameUk: 'Кропивницький' },
  { nameEn: 'Bila Tserkva', nameUk: 'Біла Церква' },
  { nameEn: 'Kremenchuk', nameUk: 'Кременчук' },
  { nameEn: 'Nikopol', nameUk: 'Нікополь' },
  { nameEn: 'Sloviansk', nameUk: 'Слов’янськ' },
  { nameEn: 'Melitopol', nameUk: 'Мелітополь' },
  { nameEn: 'Horlivka', nameUk: 'Горлівка' },
  { nameEn: 'Kramatorsk', nameUk: 'Краматорськ' },
  { nameEn: 'Donetsk', nameUk: 'Донецьк' },
  { nameEn: 'Brovary', nameUk: 'Бровари' },
  { nameEn: 'Kamianets-Podilskyi', nameUk: 'Кам’янець-Подільський' },
  { nameEn: 'Mukachevo', nameUk: 'Мукачево' },
  { nameEn: 'Korosten', nameUk: 'Коростень' },
  { nameEn: 'Berdyansk', nameUk: 'Бердянськ' },
  { nameEn: 'Konotop', nameUk: 'Конотоп' },
  { nameEn: 'Pavlohrad', nameUk: 'Павлоград' },
  { nameEn: 'Volodymyr', nameUk: 'Володимир' },
] as const;

export const MAJOR_CITY_NAMES_EN = MAJOR_CITIES.map((city) => city.nameEn);

export const HOVER_POPUP_CLASS_NAME = 'major-cities-hover-popup';
export const TAP_POPUP_CLASS_NAME = 'major-cities-tap-popup';
export const UNKNOWN_CITY_LABEL = 'Невідоме місто';

