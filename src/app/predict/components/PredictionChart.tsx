'use client';

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
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
        <p className="text-base-content/80">
          Зростання з урахуванням модифікаторів: <span className="font-semibold">{formatPercent(point.growthRate)}</span>
        </p>
      )}
      {typeof point.shockImpact === 'number' && point.shockImpact !== 0 && (
        <p className="text-error">
          Вплив шоку: <span className="font-semibold">{formatPercent(point.shockImpact)}</span>
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

  const color = impact > 0 ? '#16a34a' : '#dc2626';
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} stroke={color} strokeWidth={2} fill="#fff" />
    </g>
  );
}

export default function PredictionChart({ data }: PredictionChartProps) {
  if (!data?.length) {
    return null;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="year" />
          <YAxis tickFormatter={formatPopulation} />
          <Tooltip content={<CustomTooltip payload={[]} label={''} /> as unknown as React.ReactElement} />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#2563eb"
            dot={<ShockDot />}
            strokeWidth={2}
            name="Нелінійна траєкторія"
          />
          <Line
            type="monotone"
            dataKey="baselineValue"
            stroke="#6366f1"
            strokeDasharray="6 6"
            dot={false}
            name="Базова траєкторія"
          />
          <Line
            type="monotone"
            dataKey="lowerBound"
            stroke="#9ca3af"
            strokeDasharray="4 4"
            dot={false}
            name="Нижня межа"
          />
          <Line
            type="monotone"
            dataKey="upperBound"
            stroke="#9ca3af"
            strokeDasharray="4 4"
            dot={false}
            name="Верхня межа"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

