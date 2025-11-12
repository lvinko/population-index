'use client';

import StatChart from '@/container/StatChart';
import { ReactQueryProvider } from '@/config/apiClient';

const StatsPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-base-100 text-base-content">
      <ReactQueryProvider>
        <StatChart />
      </ReactQueryProvider>
    </div>
  );
};

export default StatsPage;
