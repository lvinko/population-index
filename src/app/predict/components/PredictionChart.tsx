'use client';

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { PopulationDataPoint } from '@/lib/utils/types';

interface PredictionChartProps {
  data: PopulationDataPoint[];
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
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#2563eb" dot />
          <Line type="monotone" dataKey="lowerBound" stroke="#9ca3af" strokeDasharray="4 4" dot={false} />
          <Line type="monotone" dataKey="upperBound" stroke="#9ca3af" strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

