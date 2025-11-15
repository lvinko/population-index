'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { SensitivityResult } from '@/lib/utils/types';

interface SensitivityPanelProps {
  sensitivity?: SensitivityResult;
}

const formatNumber = (value: number) => value.toLocaleString('uk-UA');

export default function SensitivityPanel({ sensitivity }: SensitivityPanelProps) {
  if (!sensitivity) {
    return <div className="alert alert-info">Аналітика чутливості з&apos;явиться після першого прогнозу.</div>;
  }

  const chartData = sensitivity.variations.map((variant) => ({
    name: `${variant.label} ${variant.deltaLabel}`,
    population: variant.predictedPopulation,
    delta: variant.predictedPopulation - sensitivity.baselinePopulation,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-base-200 border border-base-300 shadow-inner">
          <div className="card-body p-4 space-y-1">
            <p className="text-xs uppercase tracking-wide text-base-content/60">Базовий прогноз</p>
            <p className="text-2xl font-semibold text-primary">
              {formatNumber(sensitivity.baselinePopulation)}
            </p>
            <p className="text-xs text-base-content/70">
              Волатильність: {(sensitivity.baselineVolatility * 100).toFixed(2)}%
            </p>
          </div>
        </div>
        <div className="card bg-base-200 border border-base-300 shadow-inner">
          <div className="card-body p-4">
            <p className="text-xs uppercase tracking-wide text-base-content/60">Середня зміна</p>
            <p className="text-2xl font-semibold text-secondary">
              {formatNumber(
                chartData.reduce((sum, item) => sum + item.delta, 0) / Math.max(1, chartData.length)
              )}
            </p>
            <p className="text-xs text-base-content/70">проти бази</p>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300 shadow">
        <div className="card-body p-4">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatNumber(value)}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="population" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Параметр</th>
                  <th>Δ</th>
                  <th>Населення</th>
                  <th>Волатильність</th>
                </tr>
              </thead>
              <tbody>
                {sensitivity.variations.map((variant) => (
                  <tr key={variant.id}>
                    <td>{variant.label}</td>
                    <td>{variant.deltaLabel}</td>
                    <td>{formatNumber(variant.predictedPopulation)}</td>
                    <td>{(variant.volatilityRange * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

