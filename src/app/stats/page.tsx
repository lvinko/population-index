'use client'
import { useState, useEffect } from 'react';
import uaData from '@/helpers/ua-data.json';
import PopulationStackedChart from '@/components/PopulationStackedChart';
import Footer from '@/components/Footer';

const StatsPage = () => {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [yearsRange, setYearsRange] = useState([2003, 2022]);
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: Math.min(window.innerWidth - 40, 1200),
        height: Math.min(window.innerHeight - 40, 800),
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Process the data for the chart
  const processedData = uaData.flatMap(yearData =>
    yearData.regions.map(region => ({
      year: yearData.year.toString(),
      name: region.name,
      total: region.dataset.population.find(p => p.type === 'total')?.value || 0,
    }))
  ).filter(d => d.total > 0); // Filter out regions with 0 population

  return (
    <div className="flex-1 flex flex-col items-center justify-between min-h-screen p-5 sm:p-8 font-[family-name:var(--font-geist-sans)] relative">
      <h1 className="text-2xl font-bold mb-6 text-center">Статистика населення України за {yearsRange[0]}-{yearsRange[1]}</h1>
      <div className="w-full overflow-x-auto">
        <PopulationStackedChart
          width={dimensions.width}
          height={dimensions.height}
          data={processedData}
          margin={{ top: 40, right: 40, bottom: 40, left: 200 }}
        />
      </div>
      <Footer />
    </div>
  );
};

export default StatsPage;