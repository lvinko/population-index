'use client';

import StatChart from '@/container/StatChart';
import { ReactQueryProvider } from '@/config/apiClient';

const StatsPage = () => {
  return (
    <div className="flex-1 flex flex-col bg-base-100 text-base-content">
      <ReactQueryProvider>
        <StatChart />
      </ReactQueryProvider>
    </div>
  );
};

export default StatsPage;
