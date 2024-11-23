'use client'

import { useState, useEffect } from 'react';
// import uaData from '@/helpers/ua-data.json';
import PopulationStackedChart from '@/components/PopulationStackedChart';
import Footer from '@/components/Footer';
import { RegionData } from '@/types/population';
import Header from '@/components/Header';
import { getPopulation } from '@/queries';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@/components';
import { PopulationData } from '@/types/population';

const StatChart = () => {
  const { data, isLoading } = useQuery<PopulationData>({
    queryKey: ["population"],
    queryFn: () => getPopulation(),
    staleTime: 1000 * 60 * 60 * 24,
  });

  // Initialize with null or default values
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [yearsRange,] = useState([2003, 2022]);

  useEffect(() => {
    // Set initial dimensions after component mounts
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setDimensions({
        width: isMobile ? 1200 : window.innerWidth - 100,
        height: window.innerHeight - 200,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Process the data for the chart
  const processedData = data?.flatMap(yearData =>
    yearData.regions.map(region => ({
      year: yearData.year.toString(),
      name: region.name,
      total: region.dataset.population.find(p => p.type === 'total')?.value || 0,
    }))
  ).filter(d => d.total > 0); // Filter out regions with 0 population

  if (isLoading) return <Spinner />;

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-5 sm:p-8 bg-background text-foreground relative">
      <Header title={`Статистика населення України за ${yearsRange[0]}-${yearsRange[1]}`} />
      <div className="w-full pb-4" style={{ overflow: 'scroll'}}>
        <div className="min-w-[1200px]">
          <PopulationStackedChart
            width={dimensions.width}
            height={dimensions.height}
            data={processedData as RegionData[]}
            margin={{ top: 120, right: 40, bottom: 40, left: 80 }}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StatChart;
