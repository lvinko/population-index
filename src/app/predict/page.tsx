import { Metadata } from 'next';
import PredictionForm from './components/PredictionForm';
import { siteConfig } from '@/config/metadata';

export const metadata: Metadata = {
  title: "Прогноз населення України",
  description: "Інтерактивний інструмент для прогнозування населення України з урахуванням демографічних факторів, міграції, економічних показників та зовнішніх впливів. Гібридна модель експоненційного та логістичного зростання з регіональним розподілом та гендерним аналізом.",
  keywords: [
    "прогноз населення України",
    "демографічний прогноз",
    "прогнозування населення",
    "населення 2025",
    "населення 2030",
    "демографічна модель",
    "логістичне зростання",
    "міграція України",
    "демографічні сценарії",
    "регіональний прогноз",
  ],
  openGraph: {
    title: "Прогноз населення України | Population Index",
    description: "Інтерактивний інструмент для прогнозування населення України з урахуванням демографічних факторів та зовнішніх впливів",
    images: [
      {
        url: siteConfig.images.og.url,
        width: siteConfig.images.og.width,
        height: siteConfig.images.og.height,
        alt: "Прогноз населення України - інтерактивний інструмент для демографічного прогнозування",
        type: siteConfig.images.og.type,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      {
        url: siteConfig.images.og.url,
        alt: "Прогноз населення України - інтерактивний інструмент для демографічного прогнозування",
      },
    ],
  },
};

export default function PredictPage() {
  return (
    <div className="flex-1 flex flex-col bg-base-100 text-base-content overflow-hidden">
      <main className="flex-1 mx-auto w-full py-8 px-4 sm:px-6">
        <div className="space-y-6">
          <div tabIndex={0} className="collapse bg-base-100 border-base-300 border">
            <div className="collapse-title font-semibold">Як працює прогноз?</div>
            <div className="collapse-content text-sm">
              Прогноз розраховується на основі демографічних даних України та зовнішніх факторів, таких як війна, економічна ситуація, смертність, народжуваність, міграція тощо.
              Налаштуйте параметри нижче, щоб симулювати різні сценарії.
            </div>
          </div>
          <PredictionForm />
        </div>
      </main>
    </div>
  );
}

