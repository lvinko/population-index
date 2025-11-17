'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { RegionForecast } from '@/lib/utils/types';

interface RegionalDistributionProps {
  regions: RegionForecast[];
  totalPopulation: number;
}

// Color palette for different regions - using vibrant colors
const REGION_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#a855f7', // violet
  '#eab308', // yellow
  '#22c55e', // emerald
  '#64748b', // slate
  '#dc2626', // rose
] as const;

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-base-200 border border-base-300 rounded-lg shadow-lg p-4">
        <p className="font-bold text-base-content mb-2">{data.region}</p>
        <p className="text-sm text-base-content/80 mb-1">
          <span className="font-semibold">Населення:</span> {data.population.toLocaleString()}
        </p>
        <p className="text-sm text-blue-500 mb-1">
          <span className="font-semibold">Чоловіки:</span> {data.male.toLocaleString()}
        </p>
        <p className="text-sm text-pink-500 mb-1">
          <span className="font-semibold">Жінки:</span> {data.female.toLocaleString()}
        </p>
        <p className="text-sm text-base-content/70">
          <span className="font-semibold">Відсоток:</span> {data.percent.toFixed(2)}%
        </p>
        <p className="text-xs text-base-content/60 mt-2 pt-2 border-t border-base-300">
          Діапазон: {data.lowerBound.toLocaleString()} – {data.upperBound.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

// Custom label function
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Convert percent to percentage (percent is decimal 0-1 in Recharts)
  const percentage = percent < 1 ? percent * 100 : percent;
  
  // Only show label if percentage is >= 3%
  if (percentage < 3) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${percentage.toFixed(1)}%`}
    </text>
  );
};

export default function RegionalDistribution({ regions, totalPopulation }: RegionalDistributionProps) {
  if (!regions || regions.length === 0) {
    return null;
  }

  // Sort regions by population (descending) for better visualization
  const sortedRegions = [...regions].sort((a, b) => b.population - a.population);

  // Transform data for pie chart
  const pieData = sortedRegions.map((region, index) => ({
    ...region,
    fill: REGION_COLORS[index % REGION_COLORS.length],
    displayName: region.label ?? region.region,
  }));

  return (
    <div className="card bg-base-100 shadow-xl border border-base-300">
      <div className="card-body p-6 sm:p-8">
        <div className="mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-base-content mb-2">
            Регіональний розподіл населення
          </h3>
          <p className="text-sm text-base-content/70">
            Розподіл прогнозованого населення по регіонах України
          </p>
        </div>

        {/* Pie Chart */}
        <div className="w-full mb-6">
          <ResponsiveContainer width="100%" height={500}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={120}
                innerRadius={40}
                fill="#8884d8"
                dataKey="population"
                animationBegin={0}
                animationDuration={800}
              >
                {pieData.map((entry, index) => (
                  <Cell key={entry.code ?? `cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                formatter={(_value, entry: any) => (
                  <span className="text-sm text-base-content">
                    {entry.payload.displayName} ({entry.payload.percent.toFixed(1)}%)
                  </span>
                )}
                wrapperStyle={{ paddingTop: '20px', overflow: 'scroll', maxHeight: '200px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {sortedRegions.slice(0, 6).map((region, index) => {
            const color = REGION_COLORS[index % REGION_COLORS.length];
            return (
              <div
                key={region.code ?? region.region}
                className="bg-base-200 border border-base-300 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <h4 className="font-semibold text-base-content">{region.label ?? region.region}</h4>
                </div>
                <div className="text-2xl font-bold text-base-content mb-1">
                  {region.population.toLocaleString()}
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="text-blue-500">
                    <span className="text-xs">♂</span> {region.male.toLocaleString()}
                  </div>
                  <div className="text-pink-500">
                    <span className="text-xs">♀</span> {region.female.toLocaleString()}
                  </div>
                </div>
                <div className="text-xs text-base-content/60 mt-2">
                  {region.percent.toFixed(2)}% від загального
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        <div className="mt-6 pt-4 border-t border-base-300">
          <div className="flex flex-wrap justify-between items-center gap-4 text-sm">
            <div className="text-base-content/70">
              <span className="font-semibold">Всього регіонів:</span> {regions.length}
            </div>
            <div className="text-base-content/70">
              <span className="font-semibold">Загальне населення:</span>{' '}
              <span className="text-primary font-bold">{totalPopulation.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

