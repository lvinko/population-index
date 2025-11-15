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
      <h3 className="text-lg sm:text-xl mb-3">Обчислення</h3>
      <div className="space-y-4">
        <p className="text-sm text-base-content/80">{result.message}</p>

        {/* Main Stats */}
        <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
          {/* Predicted Population */}
          <div className="stat">
            <div className="stat-title text-xs sm:text-sm">Прогнозоване населення</div>
            <div className="stat-value text-lg sm:text-2xl text-primary">
              {result.predictedPopulation.toLocaleString()}
            </div>
            <div className="stat-desc text-xs">
              Діапазон: {result.lowerBound.toLocaleString()} – {result.upperBound.toLocaleString()}
            </div>
          </div>

          {/* Growth Rate with Radial Progress */}
          <div className="stat">
            <div className="stat-title text-xs sm:text-sm">Темп зростання</div>
            <div className="stat-figure">
              <div
                className="radial-progress bg-primary text-primary-content border-primary border"
                style={
                  {
                    '--value': growthRatePercent,
                    '--size': '4rem',
                    '--thickness': '0.5rem',
                  } as React.CSSProperties
                }
                role="progressbar"
                aria-valuenow={growthRatePercent}
              >
                {growthRateDisplay > 0 ? '+' : ''}
                {growthRateDisplay.toFixed(2)}%
              </div>
            </div>
            <div className="stat-desc text-xs">на рік</div>
          </div>

          {/* Carrying Capacity with Progress Bar */}
          <div className="stat">
            <div className="stat-title text-xs sm:text-sm">Несуча здатність</div>
            <div className="stat-value text-lg sm:text-2xl text-accent">
              {result.carryingCapacity.toLocaleString()}
            </div>
            <div className="stat-desc">
              <div className="flex justify-between items-center text-xs mb-1">
                <span>Використання</span>
                <span className="font-semibold">{capacityUtilization.toFixed(1)}%</span>
              </div>
              <progress
                className="progress progress-accent w-full h-2"
                value={capacityUtilization}
                max="100"
              ></progress>
            </div>
          </div>
        </div>

        {/* Confidence Range */}
        <div className="alert alert-info py-2 sm:py-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-5 h-5 sm:w-6 sm:h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <div className="text-sm">
            <div className="font-semibold">Діапазон впевненості</div>
            <div className="text-xs sm:text-sm">
              {result.lowerBound.toLocaleString()} – {result.upperBound.toLocaleString()}
            </div>
          </div>
        </div>

        {result.swingMetadata && (
          <div className="card bg-base-200 border border-base-300 shadow-inner p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-base-content/80">Нелінійні коливання</p>
              <p className="text-xs text-base-content/60">
                Відслідковує піки/спади темпів зростання, згладжені підтримкою.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-base-content/60">Макс темп</p>
                <p className="text-lg font-semibold text-success">
                  {displayPercent(result.swingMetadata.maxAdjustedGrowth)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-base-content/60">Мін темп</p>
                <p className="text-lg font-semibold text-error">
                  {displayPercent(result.swingMetadata.minAdjustedGrowth)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-base-content/60">Коливання</p>
                <p className="text-lg font-semibold text-primary">
                  {displayPercent(result.swingMetadata.volatilityRange)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-base-content/60">Підтримка</p>
                <p className="text-lg font-semibold text-accent">
                  {displayPercent(result.swingMetadata.supportSoftening)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-base-content/70">
              <div>
                Середній регіональний дрейф:{' '}
                <span className="font-semibold">
                  {displayPercent(result.swingMetadata.averageRegionalFeedback)}
                </span>
              </div>
              <div>
                Політичні реакції:{' '}
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
                <table className="table table-zebra text-xs">
                  <thead>
                    <tr>
                      <th>Компонент</th>
                      <th>Внесок</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Базовий тренд</td>
                      <td>{displayPercent(result.swingMetadata.componentAverages.base)}</td>
                    </tr>
                    <tr>
                      <td>Економічний цикл</td>
                      <td>{displayPercent(result.swingMetadata.componentAverages.ecoCycle)}</td>
                    </tr>
                    <tr>
                      <td>Геополітика</td>
                      <td>{displayPercent(result.swingMetadata.componentAverages.geopolitical)}</td>
                    </tr>
                    <tr>
                      <td>Підтримка</td>
                      <td>{displayPercent(result.swingMetadata.componentAverages.support)}</td>
                    </tr>
                    <tr>
                      <td>Настрої</td>
                      <td>{displayPercent(result.swingMetadata.componentAverages.sentiment)}</td>
                    </tr>
                    <tr>
                      <td>Волатильність</td>
                      <td>{displayPercent(result.swingMetadata.componentAverages.volatility)}</td>
                    </tr>
                    <tr>
                      <td>Регіональний відтік</td>
                      <td>{displayPercent(result.swingMetadata.componentAverages.regionalFeedback)}</td>
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

