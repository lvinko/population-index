'use client';

import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  ReferenceLine,
} from 'recharts';
import type { TooltipProps } from 'recharts';

import { PopulationDataPoint } from '@/lib/utils/types';

interface PredictionChartProps {
  data: PopulationDataPoint[];
}

function formatPercent(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0%';
  }
  return `${(value * 100).toFixed(2)}%`;
}

function formatPopulation(value: number): string {
  if (value >= 1000000) {
    const millions = value / 1000000;
    return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
  }
  if (value >= 1000) {
    const thousands = value / 1000;
    return thousands % 1 === 0 ? `${thousands}K` : `${thousands.toFixed(1)}K`;
  }
  return value.toString();
}

const CustomTooltip = (props: TooltipProps<number, string> & { payload: Array<{ payload: PopulationDataPoint }>; label: string | number }) => {
  const { active, payload, label } = props;
  if (!active || !payload.length) {
    return null;
  }
  const point: PopulationDataPoint = payload[0].payload;

  return (
    <div className="rounded-lg border border-base-200 bg-base-100 p-3 shadow-lg text-sm space-y-1">
      <p className="font-semibold text-base-content">Рік: {label}</p>
      <p className="text-base-content/80">
        Нелінійна траєкторія: <span className="font-semibold">{point.value.toLocaleString()}</span>
      </p>
      {typeof point.baselineValue === 'number' && (
        <p className="text-base-content/80">
          Базова траєкторія:{' '}
          <span className="font-semibold">{point.baselineValue.toLocaleString()}</span>
        </p>
      )}
      {typeof point.growthRate === 'number' && (
        <p className={point.growthRate < 0 ? 'text-error' : 'text-base-content/80'}>
          Зростання з урахуванням модифікаторів:{' '}
          <span className="font-semibold">{formatPercent(point.growthRate)}</span>
          {point.growthRate < 0 && ' ⚠️'}
        </p>
      )}
      {typeof point.shockImpact === 'number' && point.shockImpact !== 0 && (
        <p className={point.shockImpact < 0 ? 'text-error font-semibold' : 'text-success'}>
          Вплив шоку: <span className="font-semibold">{formatPercent(point.shockImpact)}</span>
          {point.shockImpact < -0.05 && ' 🔴 Критичний вплив'}
        </p>
      )}
      {typeof point.cyclePhase === 'number' && (
        <p className="text-base-content/80">
          Фаза економічного циклу:{' '}
          <span className="font-semibold">{formatPercent(point.cyclePhase)}</span>
        </p>
      )}
      {point.swingComponents && (
        <div className="text-xs text-base-content/70 space-y-0.5 pt-1 border-t border-base-200 mt-2">
          <p className="font-semibold text-base-content/80">Вклад компонентів</p>
          <p>Цикл: {formatPercent(point.swingComponents.ecoCycle)}</p>
          <p>Геополітика: {formatPercent(point.swingComponents.geopolitical)}</p>
          <p>Підтримка: {formatPercent(point.swingComponents.support)}</p>
          <p>Настрої: {formatPercent(point.swingComponents.sentiment)}</p>
          <p>Волатильність: {formatPercent(point.swingComponents.volatility)}</p>
          <p>Регіони: {formatPercent(point.swingComponents.regionalFeedback)}</p>
        </div>
      )}
      {typeof point.policyModifier === 'number' && point.policyModifier !== 0 && (
        <p className="text-xs text-base-content/70">
          Політична модифікація: {formatPercent(point.policyModifier)}
        </p>
      )}
    </div>
  );
};

function ShockDot(props: any) {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;

  const impact = payload?.shockImpact ?? 0;
  if (Math.abs(impact) < 0.001) {
    return <circle cx={cx} cy={cy} r={3} stroke="none" fill="#2563eb" />;
  }

  // Enhanced visual feedback: larger dots for more severe impacts
  const isSevere = Math.abs(impact) > 0.05;
  const radius = isSevere ? 7 : 5;
  const strokeWidth = isSevere ? 3 : 2;
  const color = impact > 0 ? '#16a34a' : '#dc2626';
  
  return (
    <g>
      <circle 
        cx={cx} 
        cy={cy} 
        r={radius} 
        stroke={color} 
        strokeWidth={strokeWidth} 
        fill={isSevere ? color : '#fff'}
        fillOpacity={isSevere ? 0.3 : 1}
      />
    </g>
  );
}

export default function PredictionChart({ data }: PredictionChartProps) {
  if (!data?.length) {
    return null;
  }

  // Find the base year (transition from historical to predicted)
  const baseYear = data.find((point) => point.lowerBound !== undefined && point.upperBound !== undefined)?.year;
  const baseYearIndex = baseYear ? data.findIndex((p) => p.year === baseYear) : -1;

  // Transform data for stacked area chart
  const chartData = data.map((point, index) => {
    const isHistorical = index <= baseYearIndex || (baseYearIndex === -1 && !point.lowerBound);
    const isPredicted = point.lowerBound !== undefined && point.upperBound !== undefined;

    return {
      ...point,
      // For historical data, show as area from 0 to value
      historicalValue: isHistorical ? point.value : null,
      // For predicted range: use lowerBound as base, and rangeHeight as the difference
      rangeBase: isPredicted ? point.lowerBound : null,
      rangeHeight: isPredicted && point.lowerBound && point.upperBound 
        ? point.upperBound - point.lowerBound 
        : null,
      // Main prediction value
      predictedValue: isPredicted ? point.value : null,
    };
  });

  return (
    <div className="h-80 sm:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorRange" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="year" 
            scale="linear"
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={formatPopulation}
            tick={{ fontSize: 12 }}
            width={70}
          />
          <Tooltip content={<CustomTooltip payload={[]} label={''} /> as unknown as React.ReactElement} />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="line"
          />
          
          {/* Historical data area */}
          <Area
            type="monotone"
            dataKey="historicalValue"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorHistorical)"
            name="Історичні дані"
            connectNulls={false}
          />

          {/* Prediction range area - shows uncertainty band */}
          <Area
            type="monotone"
            dataKey="rangeBase"
            stroke="none"
            fill="transparent"
            connectNulls={false}
            stackId="range"
          />
          <Area
            type="monotone"
            dataKey="rangeHeight"
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="2 2"
            fill="url(#colorRange)"
            name="Діапазон прогнозу"
            connectNulls={false}
            stackId="range"
          />

          {/* Baseline trajectory line */}
          <Line
            type="monotone"
            dataKey="baselineValue"
            stroke="#6366f1"
            strokeDasharray="6 6"
            strokeWidth={1.5}
            dot={false}
            name="Базова траєкторія"
            connectNulls={false}
          />

          {/* Main prediction line */}
          <Line
            type="monotone"
            dataKey="predictedValue"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={<ShockDot />}
            name="Нелінійна траєкторія"
            connectNulls={false}
          />

          {/* Reference line at base year */}
          {baseYear && (
            <ReferenceLine 
              x={baseYear} 
              stroke="#64748b" 
              strokeDasharray="3 3" 
              strokeWidth={1}
              label={{ value: 'Початок прогнозу', position: 'top', fill: '#64748b', fontSize: 11 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

