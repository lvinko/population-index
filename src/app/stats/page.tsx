import { Metadata } from 'next';
import StatChart from '@/container/StatChart';

export const metadata: Metadata = {
  title: "Статистика населення",
  description: "Детальна статистика населення України по регіонах з візуалізацією даних та можливістю аналізу демографічних трендів.",
};

const StatsPage = () => {
  return <StatChart />;
};

export default StatsPage;
