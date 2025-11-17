import { PredictionResult } from '@/lib/utils/types';

interface SummaryBoxProps {
  result: PredictionResult;
}

const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;
const displayPercent = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) ? formatPercent(value) : '0.00%';

export default function SummaryBox({ result }: SummaryBoxProps) {
  // Calculate capacity utilization percentage (0-100)
  const capacityUtilization = Math.min(
    (result.predictedPopulation / result.carryingCapacity) * 100,
    100
  );

  // Calculate growth rate percentage for radial progress
  const growthRateDisplay = result.adjustedRate * 100;
  const growthRatePercent = Math.min(Math.abs(growthRateDisplay), 100);

  return (
    <div className="">
      <h3 className="text-base font-bold mb-2">Обчислення</h3>
      <div className="space-y-3">
        <p className="text-xs text-base-content/80">{result.message}</p>

        {/* Main Stats */}
        <div className="stats stats-vertical lg:stats-horizontal shadow w-full py-2">
          {/* Predicted Population */}
          <div className="stat py-2">
            <div className="stat-title text-xs">Прогнозоване населення</div>
            <div className="stat-value text-base sm:text-xl text-primary">
              {result.predictedPopulation.toLocaleString()}
            </div>
            <div className="stat-desc text-xs">
              Діапазон: {result.lowerBound.toLocaleString()} – {result.upperBound.toLocaleString()}
            </div>
          </div>

          {/* Growth Rate with Radial Progress */}
          <div className="stat py-2">
            <div className="stat-title text-xs">Темп зростання</div>
            <div className="stat-figure">
              <div
                className="radial-progress bg-primary text-primary-content border-primary border"
                style={
                  {
                    '--value': growthRatePercent,
                    '--size': '3rem',
                    '--thickness': '0.4rem',
                  } as React.CSSProperties
                }
                role="progressbar"
                aria-valuenow={growthRatePercent}
              >
                <span className="text-xs">
                  {growthRateDisplay > 0 ? '+' : ''}
                  {growthRateDisplay.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="stat-desc text-xs">на рік</div>
          </div>

          {/* Carrying Capacity with Progress Bar */}
          <div className="stat py-2">
            <div className="stat-title text-xs">Несуча здатність</div>
            <div className="stat-value text-base sm:text-xl text-accent">
              {result.carryingCapacity.toLocaleString()}
            </div>
            <div className="stat-desc">
              <div className="flex justify-between items-center text-xs mb-0.5">
                <span>Використання</span>
                <span className="font-semibold">{capacityUtilization.toFixed(1)}%</span>
              </div>
              <progress
                className="progress progress-accent w-full h-1.5"
                value={capacityUtilization}
                max="100"
              ></progress>
            </div>
          </div>
        </div>

        {/* Confidence Range */}
        <div className="alert alert-info py-1.5 px-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <div className="text-xs">
            <div className="font-semibold">Діапазон впевненості</div>
            <div className="text-xs">
              {result.lowerBound.toLocaleString()} – {result.upperBound.toLocaleString()}
            </div>
          </div>
        </div>

        {result.swingMetadata && (
          <div className="card bg-base-200 border border-base-300 shadow-inner p-3 space-y-2">
            <div>
              <p className="text-xs font-semibold text-base-content/80">Нелінійні коливання</p>
              <p className="text-xs text-base-content/60">
                Відслідковує піки/спади темпів зростання, згладжені підтримкою.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-base-content/60">Макс темп</p>
                <p className="text-sm font-semibold text-success">
                  {displayPercent(result.swingMetadata.maxAdjustedGrowth)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-base-content/60">Мін темп</p>
                <p className="text-sm font-semibold text-error">
                  {displayPercent(result.swingMetadata.minAdjustedGrowth)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-base-content/60">Коливання</p>
                <p className="text-sm font-semibold text-primary">
                  {displayPercent(result.swingMetadata.volatilityRange)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-base-content/60">Підтримка</p>
                <p className="text-sm font-semibold text-accent">
                  {displayPercent(result.swingMetadata.supportSoftening)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-base-content/70">
              <div>
                Регіональний дрейф:{' '}
                <span className="font-semibold">
                  {displayPercent(result.swingMetadata.averageRegionalFeedback)}
                </span>
              </div>
              <div>
                Політика:{' '}
                {result.swingMetadata.policyImpacts.length
                  ? result.swingMetadata.policyImpacts.map((impact) => impact.label).join(', ')
                  : '—'}
              </div>
              <div>
                Шоки: {result.swingMetadata.shockImpacts.length}{' '}
                {result.swingMetadata.shockImpacts.length === 1 ? 'подія' : 'подій'}
              </div>
            </div>
            {result.swingMetadata.componentAverages && (
              <div className="overflow-x-auto">
                <table className="table table-zebra text-xs table-compact">
                  <thead>
                    <tr>
                      <th className="py-1">Компонент</th>
                      <th className="py-1">Внесок</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-1">Базовий тренд</td>
                      <td className="py-1">{displayPercent(result.swingMetadata.componentAverages.base)}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Економічний цикл</td>
                      <td className="py-1">{displayPercent(result.swingMetadata.componentAverages.ecoCycle)}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Геополітика</td>
                      <td className="py-1">{displayPercent(result.swingMetadata.componentAverages.geopolitical)}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Підтримка</td>
                      <td className="py-1">{displayPercent(result.swingMetadata.componentAverages.support)}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Настрої</td>
                      <td className="py-1">{displayPercent(result.swingMetadata.componentAverages.sentiment)}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Волатильність</td>
                      <td className="py-1">{displayPercent(result.swingMetadata.componentAverages.volatility)}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Регіональний відтік</td>
                      <td className="py-1">{displayPercent(result.swingMetadata.componentAverages.regionalFeedback)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

