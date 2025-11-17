import { Metadata } from 'next';
import { siteConfig } from '@/config/metadata';

export const metadata: Metadata = {
  title: "Статистика населення України",
  description: "Інтерактивна статистика та візуалізація демографічних даних України. Графіки динаміки населення, розподіл по регіонах, аналіз міського та сільського населення з 2003 року. Дані Держстату України.",
  keywords: [
    "статистика населення",
    "графіки населення",
    "динаміка населення",
    "статистика України",
    "демографічна статистика",
    "візуалізація даних",
    "населення по регіонах",
    "міське населення",
    "сільське населення",
    "хороплет карта",
  ],
  openGraph: {
    title: "Статистика населення України | Population Index",
    description: "Інтерактивна статистика та візуалізація демографічних даних України по регіонах",
    images: [
      {
        url: siteConfig.images.og.url,
        width: siteConfig.images.og.width,
        height: siteConfig.images.og.height,
        alt: "Статистика населення України - інтерактивна візуалізація демографічних даних",
        type: siteConfig.images.og.type,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      {
        url: siteConfig.images.og.url,
        alt: "Статистика населення України - інтерактивна візуалізація демографічних даних",
      },
    ],
  },
};

export default function StatisticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

