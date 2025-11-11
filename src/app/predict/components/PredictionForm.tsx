'use client';

import { FormEvent, useState } from 'react';
import axios, { AxiosError } from 'axios';

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
      const { data } = await axios.post<PredictionResult>('/api/predict', input);
      setResult(data);
    } catch (err) {
      console.error(err);
      if (err instanceof AxiosError) {
        const message =
          err.response?.data?.error ??
          err.response?.statusText ??
          'Unable to generate prediction. Please try again.';
        setError(message);
      } else {
        setError('Unable to generate prediction. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prediction-form__result">
      <form className="prediction-form" onSubmit={handleSubmit}>
        <div className="prediction-form__controls">
          <div className="prediction-form__group">
            <label className="prediction-form__label" htmlFor="targetYear">
              Target Year
            </label>
            <input
              id="targetYear"
              type="number"
              min={input.baseYear + 1}
              value={input.targetYear}
              onChange={(event) => handleChange('targetYear', Number(event.target.value))}
              className="border rounded p-2"
            />
          </div>

          <div className="prediction-form__group">
            <label className="prediction-form__label" htmlFor="birthRateChange">
              Birth Rate Change (%)
            </label>
            <input
              className="prediction-form__range"
              id="birthRateChange"
              type="range"
              min={-10}
              max={10}
              step={0.5}
              value={input.birthRateChange}
              onChange={(event) => handleChange('birthRateChange', Number(event.target.value))}
            />
            <span>{input.birthRateChange}%</span>
          </div>

          <div className="prediction-form__group">
            <label className="prediction-form__label" htmlFor="deathRateChange">
              Death Rate Change (%)
            </label>
            <input
              className="prediction-form__range"
              id="deathRateChange"
              type="range"
              min={-10}
              max={10}
              step={0.5}
              value={input.deathRateChange}
              onChange={(event) => handleChange('deathRateChange', Number(event.target.value))}
            />
            <span>{input.deathRateChange}%</span>
          </div>

          <div className="prediction-form__group">
            <label className="prediction-form__label" htmlFor="migrationChange">
              Migration Change (%)
            </label>
            <input
              className="prediction-form__range"
              id="migrationChange"
              type="range"
              min={-10}
              max={10}
              step={0.5}
              value={input.migrationChange}
              onChange={(event) => handleChange('migrationChange', Number(event.target.value))}
            />
            <span>{input.migrationChange}%</span>
          </div>

          <div className="prediction-form__group">
            <label className="prediction-form__label" htmlFor="economicSituation">
              Economic Situation
            </label>
            <select
              id="economicSituation"
              className="border rounded p-2"
              value={input.economicSituation}
              onChange={(event) =>
                handleChange('economicSituation', event.target.value as PredictionInput['economicSituation'])
              }
            >
              <option value="weak">Weak</option>
              <option value="stable">Stable</option>
              <option value="growing">Growing</option>
            </select>
          </div>

          <div className="prediction-form__group">
            <label className="prediction-form__label" htmlFor="conflictIntensity">
              Conflict Intensity
            </label>
            <select
              id="conflictIntensity"
              className="border rounded p-2"
              value={input.conflictIntensity}
              onChange={(event) =>
                handleChange('conflictIntensity', event.target.value as PredictionInput['conflictIntensity'])
              }
            >
              <option value="peace">Peace</option>
              <option value="tension">Tension</option>
              <option value="war">War</option>
            </select>
          </div>

          <div className="prediction-form__group">
            <label className="prediction-form__label" htmlFor="familySupport">
              Family Support
            </label>
            <select
              id="familySupport"
              className="border rounded p-2"
              value={input.familySupport}
              onChange={(event) =>
                handleChange('familySupport', event.target.value as PredictionInput['familySupport'])
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="strong">Strong</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Predicting…' : 'Predict'}
        </button>
      </form>

      {error && <p className="text-red-600">{error}</p>}
      {result && (
        <>
          <SummaryBox result={result} />
          <PredictionChart data={result.data} />
        </>
      )}
    </div>
  );
}

