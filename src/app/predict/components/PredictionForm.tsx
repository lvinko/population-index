'use client';

import { FormEvent, useState } from 'react';
import ky, { HTTPError } from 'ky';

import { PredictionInput, PredictionResult } from '@/lib/utils/types';
import PredictionChart from './PredictionChart';
import SummaryBox from './SummaryBox';
import './styles.css';

const DEFAULT_INPUT: PredictionInput = {
  baseYear: 2018,
  targetYear: 2030,
  birthRateChange: 0,
  deathRateChange: 0,
  migrationChange: 0,
  economicSituation: 'stable',
  conflictIntensity: 'tension',
  familySupport: 'medium',
};

export default function PredictionForm() {
  const [input, setInput] = useState<PredictionInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = <Field extends keyof PredictionInput>(
    field: Field,
    value: PredictionInput[Field]
  ) => {
    setInput((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await ky.post('/api/predict', { json: input }).json<PredictionResult>();
      setResult(data);
    } catch (err) {
      console.error(err);
      if (err instanceof HTTPError) {
        try {
          const errorData = await err.response.json() as { error?: string };
          const message =
            errorData?.error ??
            err.response.statusText ??
            'Unable to generate prediction. Please try again.';
          setError(message);
        } catch {
          setError(err.response.statusText || 'Unable to generate prediction. Please try again.');
        }
      } else {
        setError('Unable to generate prediction. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body p-4 sm:p-6">
          <h2 className="card-title text-lg sm:text-xl mb-3">Параметри прогнозу</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 ${loading ? 'opacity-60' : ''}`}>
              <div className="form-control">
                <label className="label py-1" htmlFor="targetYear">
                  <span className="label-text text-sm font-medium">Цільовий рік</span>
                </label>
                <input
                  id="targetYear"
                  type="number"
                  min={input.baseYear + 1}
                  value={input.targetYear}
                  onChange={(event) => handleChange('targetYear', Number(event.target.value))}
                  className="input input-bordered input-sm w-full"
                  disabled={loading}
                />
              </div>

              <div className="form-control sm:col-span-2 lg:col-span-1">
                <label className="label py-1" htmlFor="birthRateChange">
                  <span className="label-text text-sm font-medium">
                    Народжуваність: <span className="font-semibold text-primary inline-block w-12 text-right">{input.birthRateChange > 0 ? '+' : ''}{input.birthRateChange}%</span>
                  </span>
                </label>
                <input
                  id="birthRateChange"
                  type="range"
                  min={-10}
                  max={10}
                  step={0.5}
                  value={input.birthRateChange}
                  onChange={(event) => handleChange('birthRateChange', Number(event.target.value))}
                  className="range range-primary range-sm"
                  disabled={loading}
                />
                <div className="w-full flex justify-between text-xs px-1 mt-0.5">
                  <span>-10%</span>
                  <span>0%</span>
                  <span>+10%</span>
                </div>
              </div>

              <div className="form-control sm:col-span-2 lg:col-span-1">
                <label className="label py-1" htmlFor="deathRateChange">
                  <span className="label-text text-sm font-medium">
                    Смертність: <span className="font-semibold text-secondary inline-block w-12 text-right">{input.deathRateChange > 0 ? '+' : ''}{input.deathRateChange}%</span>
                  </span>
                </label>
                <input
                  id="deathRateChange"
                  type="range"
                  min={-10}
                  max={10}
                  step={0.5}
                  value={input.deathRateChange}
                  onChange={(event) => handleChange('deathRateChange', Number(event.target.value))}
                  className="range range-secondary range-sm"
                  disabled={loading}
                />
                <div className="w-full flex justify-between text-xs px-1 mt-0.5">
                  <span>-10%</span>
                  <span>0%</span>
                  <span>+10%</span>
                </div>
              </div>

              <div className="form-control sm:col-span-2 lg:col-span-1">
                <label className="label py-1" htmlFor="migrationChange">
                  <span className="label-text text-sm font-medium">
                    Міграція: <span className="font-semibold text-accent inline-block w-12 text-right">{input.migrationChange > 0 ? '+' : ''}{input.migrationChange}%</span>
                  </span>
                </label>
                <input
                  id="migrationChange"
                  type="range"
                  min={-10}
                  max={10}
                  step={0.5}
                  value={input.migrationChange}
                  onChange={(event) => handleChange('migrationChange', Number(event.target.value))}
                  className="range range-accent range-sm"
                  disabled={loading}
                />
                <div className="w-full flex justify-between text-xs px-1 mt-0.5">
                  <span>-10%</span>
                  <span>0%</span>
                  <span>+10%</span>
                </div>
              </div>

              <div className="form-control">
                <label className="label py-1" htmlFor="economicSituation">
                  <span className="label-text text-sm font-medium">Економіка</span>
                </label>
                <select
                  id="economicSituation"
                  className="select select-bordered select-sm w-full"
                  value={input.economicSituation}
                  onChange={(event) =>
                    handleChange('economicSituation', event.target.value as PredictionInput['economicSituation'])
                  }
                  disabled={loading}
                >
                  <option value="weak">Слабка</option>
                  <option value="stable">Стабільна</option>
                  <option value="growing">Зростаюча</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label py-1" htmlFor="conflictIntensity">
                  <span className="label-text text-sm font-medium">Конфлікт</span>
                </label>
                <select
                  id="conflictIntensity"
                  className="select select-bordered select-sm w-full"
                  value={input.conflictIntensity}
                  onChange={(event) =>
                    handleChange('conflictIntensity', event.target.value as PredictionInput['conflictIntensity'])
                  }
                  disabled={loading}
                >
                  <option value="peace">Мир</option>
                  <option value="tension">Напруженість</option>
                  <option value="war">Війна</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label py-1" htmlFor="familySupport">
                  <span className="label-text text-sm font-medium">Підтримка сім'ї</span>
                </label>
                <select
                  id="familySupport"
                  className="select select-bordered select-sm w-full"
                  value={input.familySupport}
                  onChange={(event) =>
                    handleChange('familySupport', event.target.value as PredictionInput['familySupport'])
                  }
                  disabled={loading}
                >
                  <option value="low">Низька</option>
                  <option value="medium">Середня</option>
                  <option value="strong">Висока</option>
                </select>
              </div>
            </div>

            <div className="card-actions justify-end pt-2">
              <button
                type="submit"
                className="btn btn-primary btn-sm sm:btn-md"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    <span className="hidden sm:inline">Обчислення...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Створити прогноз</span>
                    <span className="sm:hidden">Прогноз</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {/* SummaryBox Skeleton */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body p-4 sm:p-6">
              <div className="skeleton h-6 w-48 mb-3"></div>
              <div className="space-y-4">
                <div className="skeleton h-4 w-full max-w-xs"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="stat bg-base-100 rounded-lg shadow p-4">
                    <div className="skeleton h-4 w-32 mb-2"></div>
                    <div className="skeleton h-8 w-24 mb-2"></div>
                    <div className="skeleton h-3 w-full"></div>
                  </div>
                  <div className="stat bg-base-100 rounded-lg shadow p-4 flex flex-col items-center">
                    <div className="skeleton h-4 w-24 mb-2"></div>
                    <div className="skeleton h-20 w-20 rounded-full"></div>
                    <div className="skeleton h-3 w-16 mt-2"></div>
                  </div>
                  <div className="stat bg-base-100 rounded-lg shadow p-4">
                    <div className="skeleton h-4 w-28 mb-2"></div>
                    <div className="skeleton h-8 w-24 mb-2"></div>
                    <div className="skeleton h-2 w-full"></div>
                  </div>
                </div>
                <div className="card bg-base-100 shadow p-4">
                  <div className="skeleton h-5 w-40 mb-2"></div>
                  <div className="skeleton h-2 w-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Skeleton */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body p-4 sm:p-6">
              <div className="skeleton h-6 w-40 mb-4"></div>
              <div className="skeleton h-64 w-full"></div>
            </div>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          <SummaryBox result={result} />
          <PredictionChart data={result.data} />
        </div>
      )}
    </div>
  );
}

