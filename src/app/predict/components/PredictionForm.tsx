'use client';

import { FormEvent, useEffect, useState } from 'react';
import ky, { HTTPError } from 'ky';

import { PredictionInput, PredictionResult } from '@/lib/utils/types';
import PredictionChart from './PredictionChart';
import SummaryBox from './SummaryBox';
import './styles.css';

const DEFAULT_INPUT: PredictionInput = {
  baseYear: new Date().getFullYear() - 1, // Temporary default, will be updated from API
  targetYear: new Date().getFullYear() + 5, // Default to 5 years ahead
  birthRateChange: 0,
  deathRateChange: 0,
  migrationChange: 0,
  economicSituation: 'stable',
  conflictIntensity: 'tension',
  familySupport: 'medium',
};

interface LatestYearData {
  latestYear: number;
  latestPopulation: number | null;
  availableYears: number[];
}

export default function PredictionForm() {
  const [input, setInput] = useState<PredictionInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [latestYearData, setLatestYearData] = useState<LatestYearData | null>(null);
  const [loadingLatestYear, setLoadingLatestYear] = useState(true);

  // Fetch latest available year on mount
  useEffect(() => {
    const fetchLatestYear = async () => {
      try {
        const data = await ky.get('/api/predict').json<LatestYearData>();
        setLatestYearData(data);
        // Update input with latest year and set target year to 5 years ahead
        setInput((prev) => ({
          ...prev,
          baseYear: data.latestYear,
          targetYear: Math.max(data.latestYear + 1, prev.targetYear),
        }));
      } catch (err) {
        console.error('Failed to fetch latest year', err);
        // Keep default values if fetch fails
      } finally {
        setLoadingLatestYear(false);
      }
    };

    fetchLatestYear();
  }, []);

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
      setIsInitialLoad(false);
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
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-base-content mb-2">Параметри прогнозу</h2>
            <p className="text-sm text-base-content/70">Налаштуйте параметри для створення прогнозу населення</p>
          </div>
          
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Year Selection Section */}
            <div className="space-y-6">
              <div className="divider">
                <span className="text-sm font-semibold text-base-content/70">Роки прогнозу</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Base Year */}
                <div className="form-control space-y-3">
                  <label className="label p-0" htmlFor="baseYear">
                    <span className="label-text text-base font-semibold">Базовий рік</span>
                    {latestYearData && (
                      <span className="label-text-alt text-xs text-base-content/60">
                        (Останній доступний: {latestYearData.latestYear})
                      </span>
                    )}
                  </label>
                  <input
                    id="baseYear"
                    type="number"
                    min={1900}
                    max={2100}
                    value={input.baseYear}
                    onChange={(event) => {
                      const newBaseYear = Number(event.target.value);
                      handleChange('baseYear', newBaseYear);
                      // Ensure target year is always greater than base year
                      if (input.targetYear <= newBaseYear) {
                        handleChange('targetYear', newBaseYear + 1);
                      }
                    }}
                    className="input input-bordered w-full focus:input-primary transition-colors"
                    disabled={loading || loadingLatestYear}
                  />
                  {latestYearData && (
                    <div className="text-xs text-base-content/60">
                      <button
                        type="button"
                        onClick={() => {
                          handleChange('baseYear', latestYearData.latestYear);
                          if (input.targetYear <= latestYearData.latestYear) {
                            handleChange('targetYear', latestYearData.latestYear + 1);
                          }
                        }}
                        className="link link-primary link-hover"
                        disabled={loading || loadingLatestYear}
                      >
                        Використати останній доступний рік ({latestYearData.latestYear})
                      </button>
                    </div>
                  )}
                </div>

                {/* Target Year */}
                <div className="form-control space-y-3">
                  <label className="label p-0" htmlFor="targetYear">
                    <span className="label-text text-base font-semibold">Цільовий рік прогнозу</span>
                  </label>
                  <input
                    id="targetYear"
                    type="number"
                    min={input.baseYear + 1}
                    max={2200}
                    value={input.targetYear}
                    onChange={(event) => handleChange('targetYear', Number(event.target.value))}
                    className="input input-bordered w-full focus:input-primary transition-colors"
                    disabled={loading || loadingLatestYear}
                  />
                  <div className="text-xs text-base-content/60">
                    Прогноз на {input.targetYear - input.baseYear} {input.targetYear - input.baseYear === 1 ? 'рік' : input.targetYear - input.baseYear < 5 ? 'роки' : 'років'}
                  </div>
                </div>
              </div>
            </div>

            {/* Demographic Rates Section */}
            <div className="space-y-6">
              <div className="divider">
                <span className="text-sm font-semibold text-base-content/70">Демографічні показники</span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Birth Rate */}
                <div className="form-control space-y-3">
                  <label className="label p-0" htmlFor="birthRateChange">
                    <span className="label-text text-base font-semibold">Народжуваність</span>
                    <span className="label-text-alt font-bold text-primary text-lg">
                      {input.birthRateChange > 0 ? '+' : ''}{input.birthRateChange}%
                    </span>
                  </label>
                  <div className="space-y-2">
                    <input
                      id="birthRateChange"
                      type="range"
                      min={-10}
                      max={10}
                      step={0.5}
                      value={input.birthRateChange}
                      onChange={(event) => handleChange('birthRateChange', Number(event.target.value))}
                      className="range range-primary range-lg w-full"
                      disabled={loading}
                    />
                    <div className="w-full flex justify-between text-xs text-base-content/60 px-2">
                      <span>-10%</span>
                      <span>0%</span>
                      <span>+10%</span>
                    </div>
                  </div>
                </div>

                {/* Death Rate */}
                <div className="form-control space-y-3">
                  <label className="label p-0" htmlFor="deathRateChange">
                    <span className="label-text text-base font-semibold">Смертність</span>
                    <span className="label-text-alt font-bold text-secondary text-lg">
                      {input.deathRateChange > 0 ? '+' : ''}{input.deathRateChange}%
                    </span>
                  </label>
                  <div className="space-y-2">
                    <input
                      id="deathRateChange"
                      type="range"
                      min={-10}
                      max={10}
                      step={0.5}
                      value={input.deathRateChange}
                      onChange={(event) => handleChange('deathRateChange', Number(event.target.value))}
                      className="range range-secondary range-lg w-full"
                      disabled={loading}
                    />
                    <div className="w-full flex justify-between text-xs text-base-content/60 px-2">
                      <span>-10%</span>
                      <span>0%</span>
                      <span>+10%</span>
                    </div>
                  </div>
                </div>

                {/* Migration */}
                <div className="form-control space-y-3">
                  <label className="label p-0" htmlFor="migrationChange">
                    <span className="label-text text-base font-semibold">Міграція</span>
                    <span className="label-text-alt font-bold text-accent text-lg">
                      {input.migrationChange > 0 ? '+' : ''}{input.migrationChange}%
                    </span>
                  </label>
                  <div className="space-y-2">
                    <input
                      id="migrationChange"
                      type="range"
                      min={-10}
                      max={10}
                      step={0.5}
                      value={input.migrationChange}
                      onChange={(event) => handleChange('migrationChange', Number(event.target.value))}
                      className="range range-accent range-lg w-full"
                      disabled={loading}
                    />
                    <div className="w-full flex justify-between text-xs text-base-content/60 px-2">
                      <span>-10%</span>
                      <span>0%</span>
                      <span>+10%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Factors Section */}
            <div className="space-y-6">
              <div className="divider">
                <span className="text-sm font-semibold text-base-content/70">Соціальні фактори</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="form-control space-y-3">
                  <label className="label p-0" htmlFor="economicSituation">
                    <span className="label-text text-base font-semibold">Економічна ситуація</span>
                  </label>
                  <select
                    id="economicSituation"
                    className="select select-bordered w-full focus:select-primary transition-colors"
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

                <div className="form-control space-y-3">
                  <label className="label p-0" htmlFor="conflictIntensity">
                    <span className="label-text text-base font-semibold">Рівень конфлікту</span>
                  </label>
                  <select
                    id="conflictIntensity"
                    className="select select-bordered w-full focus:select-primary transition-colors"
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

                <div className="form-control space-y-3">
                  <label className="label p-0" htmlFor="familySupport">
                    <span className="label-text text-base font-semibold">Підтримка сім'ї</span>
                  </label>
                  <select
                    id="familySupport"
                    className="select select-bordered w-full focus:select-primary transition-colors"
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
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-base-300">
              <button
                type="submit"
                className="btn btn-primary btn-lg min-w-[180px]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    <span>Обчислення...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Створити прогноз
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {error && (
        <div className="alert alert-error shadow-lg">
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
          <span className="font-medium">{error}</span>
        </div>
      )}

      {loading && isInitialLoad && (
        <div className="space-y-6">
          {/* SummaryBox Skeleton */}
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body p-6 sm:p-8">
              <div className="mb-4">
                <div className="skeleton h-8 w-64 mb-2"></div>
                <div className="skeleton h-4 w-96 max-w-full"></div>
              </div>
              <div className="space-y-6">
                <div className="skeleton h-4 w-full max-w-xs"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="stat bg-base-200 rounded-lg shadow p-6">
                    <div className="skeleton h-4 w-32 mb-3"></div>
                    <div className="skeleton h-10 w-28 mb-3"></div>
                    <div className="skeleton h-3 w-full"></div>
                  </div>
                  <div className="stat bg-base-200 rounded-lg shadow p-6 flex flex-col items-center">
                    <div className="skeleton h-4 w-24 mb-3"></div>
                    <div className="skeleton h-24 w-24 rounded-full"></div>
                    <div className="skeleton h-3 w-20 mt-3"></div>
                  </div>
                  <div className="stat bg-base-200 rounded-lg shadow p-6">
                    <div className="skeleton h-4 w-32 mb-3"></div>
                    <div className="skeleton h-10 w-28 mb-3"></div>
                    <div className="skeleton h-2 w-full"></div>
                  </div>
                </div>
                <div className="card bg-base-200 shadow p-6">
                  <div className="skeleton h-5 w-48 mb-3"></div>
                  <div className="skeleton h-3 w-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Skeleton */}
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body p-6 sm:p-8">
              <div className="mb-4">
                <div className="skeleton h-8 w-48 mb-2"></div>
                <div className="skeleton h-4 w-72 max-w-full"></div>
              </div>
              <div className="skeleton h-80 w-full rounded-lg"></div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className={`space-y-6 bg-base-100 p-6 sm:p-8 rounded-lg shadow-xl border border-base-300 transition-opacity duration-300 ${loading && !isInitialLoad ? 'opacity-75' : ''}`}>
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-base-content mb-2">Результати прогнозу</h3>
            <p className="text-sm text-base-content/70">Візуалізація та аналіз прогнозованих даних</p>
          </div>
          <PredictionChart data={result.data} />
          <SummaryBox result={result} />
        </div>
      )}
    </div>
  );
}

