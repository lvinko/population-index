import { PredictionResult } from '@/lib/utils/types';

interface SummaryBoxProps {
  result: PredictionResult;
}

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
      </div>
    </div>
  );
}

