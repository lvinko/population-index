'use client';
// import { Metadata } from 'next';
import StatChart from '@/container/StatChart';
import { ReactQueryProvider } from '@/config/apiClient';

// export const metadata: Metadata = {
//   title: "Статистика населення",
//   description: "Детальна статистика населення України по регіонах з візуалізацією даних та можливістю аналізу демографічних трендів.",
// };

const StatsPage = () => {
  return (
    <ReactQueryProvider>
      <StatChart />
    </ReactQueryProvider>
  );
};

export default StatsPage;
