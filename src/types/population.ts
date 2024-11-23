import UkraineData from "@/helpers/ua-data.json";

type PopulationData = typeof UkraineData;

type RegionName = 'Avtonomna Respublika Krym' | 'Vinnytska' | 'Volynska' | 'Dnipropetrovska' | 'Donetska' | 'Zhytomyrska' | 'Zakarpatska' | 'Zaporizka' | 'Ivano-Frankivska' | 'Kyivska' | 'Kirovohradska' | 'Luhanska' | 'Lvivska' | 'Mykolaivska' | 'Odeska' | 'Poltavska' | 'Rivnenska' | 'Sumska' | 'Ternopilska' | 'Kharkivska' | 'Khersonska' | 'Khmelnytska' | 'Cherkaska' | 'Chernivetska' | 'Chernihivska';

export type { PopulationData, RegionName };

