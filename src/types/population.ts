import UkraineData from "@/helpers/ua-data.json";

type PopulationData = typeof UkraineData;

type RegionName = 'Avtonomna Respublika Krym' | 'Vinnytska' | 'Volynska' | 'Dnipropetrovska' | 'Donetska' | 'Zhytomyrska' | 'Zakarpatska' | 'Zaporizka' | 'Ivano-Frankivska' | 'Kyivska' | 'Kirovohradska' | 'Luhanska' | 'Lvivska' | 'Mykolaivska' | 'Odeska' | 'Poltavska' | 'Rivnenska' | 'Sumska' | 'Ternopilska' | 'Kharkivska' | 'Khersonska' | 'Khmelnytska' | 'Cherkaska' | 'Chernivetska' | 'Chernihivska';

// Define proper types for the data
interface RegionData {
  year: string;
  name: RegionName;
  total: number;
}

export type { PopulationData, RegionName, RegionData };

