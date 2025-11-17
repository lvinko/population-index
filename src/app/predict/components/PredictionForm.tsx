'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import ky, { HTTPError } from 'ky';
import {
  Activity,
  Baby,
  CalendarDays,
  CalendarRange,
  FileText,
  Globe,
  Info,
  LineChart,
  MapPin,
  Plane,
  Save,
  Shield,
  Target,
  Trash2,
  LifeBuoy,
  TrendingUp,
  TrendingDown,
  Users,
  Waves,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { PredictionInput, PredictionResult, SwingInputs } from '@/lib/utils/types';
import {
  deleteScenarioConfig,
  loadScenarios,
  saveScenarioConfig,
  SavedScenario,
} from '@/lib/prediction/scenarios';
import PredictionChart from './PredictionChart';
import SummaryBox from './SummaryBox';
import RegionalDistribution from './RegionalDistribution';
import SensitivityPanel from './SensitivityPanel';
import './styles.css';

const DEFAULT_SWING_INPUTS: SwingInputs = {
  geopoliticalIndex: 0.1,
  economicCyclePosition: 0.4,
  internationalSupport: 0.5,
  volatility: 0.3,
  shockEvents: [],
};

const DEFAULT_INPUT: PredictionInput = {
  baseYear: new Date().getFullYear() - 1, // Temporary default, will be updated from API
  targetYear: new Date().getFullYear() + 5, // Default to 5 years ahead
  birthRateChange: 0,
  deathRateChange: 0,
  migrationChange: 0,
  economicSituation: 'stable',
  conflictIntensity: 'tension',
  familySupport: 'medium',
  swingInputs: { ...DEFAULT_SWING_INPUTS },
};

const normalizeInput = (values: PredictionInput): PredictionInput => ({
  ...DEFAULT_INPUT,
  ...values,
  swingInputs: {
    ...DEFAULT_SWING_INPUTS,
    ...values.swingInputs,
  },
});

function InfoHint({ text }: { text: string }) {
  return (
    <div className="tooltip tooltip-right" data-tip={text}>
      <Info className="w-4 h-4 text-base-content/60" aria-hidden="true" />
      <span className="sr-only">{text}</span>
    </div>
  );
}

function SectionDivider({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="divider">
      <span className="text-sm font-semibold text-base-content/70 inline-flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
        {text}
      </span>
    </div>
  );
}

function FieldLabel({
  icon: Icon,
  text,
  hint,
}: {
  icon: LucideIcon;
  text: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
      <span className="label-text text-base font-semibold">{text}</span>
      {hint && <InfoHint text={hint} />}
    </div>
  );
}

interface LatestYearData {
  latestYear: number;
  latestPopulation: number | null;
  availableYears: number[];
}

export default function PredictionForm() {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [latestYearData, setLatestYearData] = useState<LatestYearData | null>(null);
  const [loadingLatestYear, setLoadingLatestYear] = useState(true);
  const [activeTab, setActiveTab] = useState<'chart' | 'regions' | 'summary' | 'sensitivity'>('chart');
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [scenarioName, setScenarioName] = useState('');
  const [selectedScenarioId, setSelectedScenarioId] = useState('');
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [scenariosLoading, setScenariosLoading] = useState(true);
  const [scenarioSyncing, setScenarioSyncing] = useState(false);
  const {
    register,
    handleSubmit: submitForm,
    watch,
    setValue,
    reset,
    getValues,
  } = useForm<PredictionInput>({
    defaultValues: DEFAULT_INPUT,
  });
  const formValues = watch();
  const swingInputs = formValues.swingInputs ?? DEFAULT_SWING_INPUTS;

  // Fetch latest available year on mount
  useEffect(() => {
    const fetchLatestYear = async () => {
      try {
        const data = await ky.get('/api/predict').json<LatestYearData>();
        setLatestYearData(data);
        // Update input with latest year and ensure target year stays ahead
        setValue('baseYear', data.latestYear);
        const currentTargetYear = getValues('targetYear');
        if (currentTargetYear <= data.latestYear) {
          setValue('targetYear', data.latestYear + 1);
        }
      } catch (err) {
        console.error('Failed to fetch latest year', err);
        // Keep default values if fetch fails
      } finally {
        setLoadingLatestYear(false);
      }
    };

    fetchLatestYear();
  }, [getValues, setValue]);

  useEffect(() => {
    let ignore = false;

    const hydrateScenarios = async () => {
      try {
        const data = await loadScenarios();
        if (!ignore) {
          setScenarios(data);
        }
      } catch (err) {
        console.error('Failed to load scenarios', err);
        if (!ignore) {
          setScenarioError('Не вдалося завантажити сценарії. Спробуйте пізніше.');
        }
      } finally {
        if (!ignore) {
          setScenariosLoading(false);
        }
      }
    };

    hydrateScenarios();

    return () => {
      ignore = true;
    };
  }, []);

  const applyScenarioById = (scenarioId: string) => {
    if (!scenarioId) {
      return;
    }
    const scenario = scenarios.find((item) => item.id === scenarioId);
    if (!scenario) {
      setScenarioError('Не вдалося знайти обраний сценарій.');
      return;
    }
    reset(normalizeInput(scenario.input));
    setScenarioError(null);
  };

  const handleScenarioSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const newScenarioId = event.target.value;
    setSelectedScenarioId(newScenarioId);
    if (!newScenarioId) {
      return;
    }
    applyScenarioById(newScenarioId);
  };

  const handleSaveScenario = async () => {
    const trimmedName =
      scenarioName.trim() ||
      scenarios.find((scenario) => scenario.id === selectedScenarioId)?.name ||
      '';

    if (!trimmedName) {
      setScenarioError('Вкажіть назву сценарію, щоб зберегти.');
      return;
    }

    setScenarioSyncing(true);
    try {
      const currentInput = normalizeInput(getValues());
      const updated = await saveScenarioConfig(trimmedName, currentInput, selectedScenarioId || undefined);
      setScenarios(updated);
      const saved = updated.find(
        (scenario) => scenario.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (saved) {
        setSelectedScenarioId(saved.id);
      }
      setScenarioName('');
      setScenarioError(null);
    } catch (err) {
      console.error('Failed to save scenario', err);
      setScenarioError('Не вдалося зберегти сценарій. Спробуйте пізніше.');
    } finally {
      setScenarioSyncing(false);
    }
  };

  const handleDeleteScenario = async () => {
    if (!selectedScenarioId) {
      setScenarioError('Немає сценарію для видалення.');
      return;
    }

    setScenarioSyncing(true);
    try {
      const updated = await deleteScenarioConfig(selectedScenarioId);
      setScenarios(updated);
      setSelectedScenarioId('');
      setScenarioError(null);
    } catch (err) {
      console.error('Failed to delete scenario', err);
      setScenarioError('Не вдалося видалити сценарій. Спробуйте пізніше.');
    } finally {
      setScenarioSyncing(false);
    }
  };

  const onSubmit = async (formData: PredictionInput) => {
    setLoading(true);
    setError(null);

    try {
      const payload = normalizeInput(formData);
      const data = await ky.post('/api/predict', { json: payload }).json<PredictionResult>();
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
          
          <form className="space-y-8" onSubmit={submitForm(onSubmit)}>
            {/* Year Selection Section */}
            <div className="space-y-6">
              <SectionDivider icon={CalendarRange} text="Роки прогнозу" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Base Year */}
                <div className="form-control space-y-3">
                  <label className="label p-0 flex items-start justify-between gap-2" htmlFor="baseYear">
                    <FieldLabel icon={CalendarDays} text="Базовий рік" hint="Вихідна точка, від якої починається прогноз." />
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
                    {...register('baseYear', {
                      valueAsNumber: true,
                      onChange: (event) => {
                        const newBaseYear = Number(event.target.value);
                        const currentTarget = getValues('targetYear');
                        if (currentTarget <= newBaseYear) {
                          setValue('targetYear', newBaseYear + 1);
                        }
                      },
                    })}
                    className="input input-bordered w-full focus:input-primary transition-colors"
                    disabled={loading || loadingLatestYear}
                  />
                  {latestYearData && (
                    <div className="text-xs text-base-content/60">
                      <button
                        type="button"
                        onClick={() => {
                          setValue('baseYear', latestYearData.latestYear);
                          const currentTarget = getValues('targetYear');
                          if (currentTarget <= latestYearData.latestYear) {
                            setValue('targetYear', latestYearData.latestYear + 1);
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
                  <label className="label p-0 flex items-center justify-between" htmlFor="targetYear">
                    <FieldLabel icon={Target} text="Цільовий рік прогнозу" hint="Рік, для якого розраховується основний результат." />
                  </label>
                  <input
                    id="targetYear"
                    type="number"
                    min={formValues.baseYear + 1}
                    max={2200}
                    {...register('targetYear', { valueAsNumber: true })}
                    className="input input-bordered w-full focus:input-primary transition-colors"
                    disabled={loading || loadingLatestYear}
                  />
                  <div className="text-xs text-base-content/60">
                    Прогноз на {formValues.targetYear - formValues.baseYear}{' '}
                    {formValues.targetYear - formValues.baseYear === 1
                      ? 'рік'
                      : formValues.targetYear - formValues.baseYear < 5
                      ? 'роки'
                      : 'років'}
                  </div>
                </div>
              </div>
            </div>

            {/* Demographic Rates Section */}
            <div className="space-y-6">
              <SectionDivider icon={Activity} text="Демографічні показники" />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Birth Rate */}
                <div className="form-control space-y-3">
                  <label className="label p-0" htmlFor="birthRateChange">
                    <FieldLabel icon={Baby} text="Народжуваність" hint="Очікувана зміна народжуваності у відсотках." />
                    <span className="label-text-alt font-bold text-primary text-lg">
                      {formValues.birthRateChange > 0 ? '+' : ''}
                      {formValues.birthRateChange}%
                    </span>
                  </label>
                  <div className="space-y-2">
                    <input
                      id="birthRateChange"
                      type="range"
                      min={-10}
                      max={10}
                      step={0.5}
                      {...register('birthRateChange', { valueAsNumber: true })}
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
                    <FieldLabel icon={TrendingDown} text="Смертність" hint="Очікувана зміна смертності у відсотках." />
                    <span className="label-text-alt font-bold text-secondary text-lg">
                      {formValues.deathRateChange > 0 ? '+' : ''}
                      {formValues.deathRateChange}%
                    </span>
                  </label>
                  <div className="space-y-2">
                    <input
                      id="deathRateChange"
                      type="range"
                      min={-10}
                      max={10}
                      step={0.5}
                      {...register('deathRateChange', { valueAsNumber: true })}
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
                    <FieldLabel icon={Plane} text="Міграція" hint="Баланс міграції: приплив або відтік населення у %." />
                    <span className="label-text-alt font-bold text-accent text-lg">
                      {formValues.migrationChange > 0 ? '+' : ''}
                      {formValues.migrationChange}%
                    </span>
                  </label>
                  <div className="space-y-2">
                    <input
                      id="migrationChange"
                      type="range"
                      min={-10}
                      max={10}
                      step={0.5}
                      {...register('migrationChange', { valueAsNumber: true })}
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
              <SectionDivider icon={Users} text="Соціальні фактори" />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="form-control space-y-3">
                  <label className="label p-0" htmlFor="economicSituation">
                    <FieldLabel icon={TrendingUp} text="Економічна ситуація" hint="Визначає загальний економічний фон для моделі." />
                  </label>
                  <select
                    id="economicSituation"
                    className="select select-bordered w-full focus:select-primary transition-colors"
                    {...register('economicSituation')}
                    disabled={loading}
                  >
                    <option value="weak">Слабка</option>
                    <option value="stable">Стабільна</option>
                    <option value="growing">Зростаюча</option>
                  </select>
                </div>

                <div className="form-control space-y-3">
                  <label className="label p-0" htmlFor="conflictIntensity">
                    <FieldLabel icon={Shield} text="Рівень конфлікту" hint="Показує силу воєнних чи безпекових ризиків." />
                  </label>
                  <select
                    id="conflictIntensity"
                    className="select select-bordered w-full focus:select-primary transition-colors"
                    {...register('conflictIntensity')}
                    disabled={loading}
                  >
                    <option value="peace">Мир</option>
                    <option value="tension">Напруженість</option>
                    <option value="war">Війна</option>
                  </select>
                </div>

                <div className="form-control space-y-3">
                  <label className="label p-0" htmlFor="familySupport">
                    <FieldLabel icon={Users} text="Підтримка сім&apos;ї" hint="Рівень внутрішньої соціальної підтримки родин." />
                  </label>
                  <select
                    id="familySupport"
                    className="select select-bordered w-full focus:select-primary transition-colors"
                    {...register('familySupport')}
                    disabled={loading}
                  >
                    <option value="low">Низька</option>
                    <option value="medium">Середня</option>
                    <option value="strong">Висока</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dynamic Swing Factors */}
            <div className="space-y-6">
              <SectionDivider icon={Globe} text="Динамічні фактори нестабільності" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control space-y-3">
                  <label className="label p-0" htmlFor="geopoliticalIndex">
                    <FieldLabel icon={Globe} text="Геополітичний індекс" hint="Стабільність або загрози ззовні: -1 війна, +1 спокій." />
                    <span className="label-text-alt font-bold text-primary text-lg">
                      {swingInputs.geopoliticalIndex?.toFixed(2)}
                    </span>
                  </label>
                  <input
                    id="geopoliticalIndex"
                    type="range"
                    min={-1}
                    max={1}
                    step={0.1}
                    {...register('swingInputs.geopoliticalIndex', { valueAsNumber: true })}
                    className="range range-primary"
                    disabled={loading}
                  />
                  <div className="w-full flex justify-between text-xs text-base-content/60 px-2">
                    <span>Війна</span>
                    <span>Стабільність</span>
                  </div>
                </div>

                <div className="form-control space-y-3">
                  <label className="label p-0" htmlFor="economicCyclePosition">
                    <FieldLabel icon={TrendingUp} text="Фаза економічного циклу" hint="Положення у циклі: 0 — спад, 1 — пік зростання." />
                    <span className="label-text-alt font-bold text-secondary text-lg">
                      {swingInputs.economicCyclePosition?.toFixed(2)}
                    </span>
                  </label>
                  <input
                    id="economicCyclePosition"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    {...register('swingInputs.economicCyclePosition', { valueAsNumber: true })}
                    className="range range-secondary"
                    disabled={loading}
                  />
                  <div className="w-full flex justify-between text-xs text-base-content/60 px-2">
                    <span>Спад</span>
                    <span>Пік</span>
                  </div>
                </div>

                <div className="form-control space-y-3">
                  <label className="label p-0" htmlFor="internationalSupport">
                    <FieldLabel icon={LifeBuoy} text="Міжнародна підтримка" hint="Наскільки сильна зовнішня допомога та ресурси." />
                    <span className="label-text-alt font-bold text-accent text-lg">
                      {swingInputs.internationalSupport?.toFixed(2)}
                    </span>
                  </label>
                  <input
                    id="internationalSupport"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    {...register('swingInputs.internationalSupport', { valueAsNumber: true })}
                    className="range range-accent"
                    disabled={loading}
                  />
                  <div className="w-full flex justify-between text-xs text-base-content/60 px-2">
                    <span>Низька</span>
                    <span>Висока</span>
                  </div>
                </div>

                <div className="form-control space-y-3">
                  <label className="label p-0" htmlFor="volatility">
                    <FieldLabel icon={Waves} text="Волатильність" hint="Ступінь випадкових коливань навколо тренду." />
                    <span className="label-text-alt font-bold text-warning text-lg">
                      {swingInputs.volatility?.toFixed(2)}
                    </span>
                  </label>
                  <input
                    id="volatility"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    {...register('swingInputs.volatility', { valueAsNumber: true })}
                    className="range range-warning"
                    disabled={loading}
                  />
                  <div className="w-full flex justify-between text-xs text-base-content/60 px-2">
                    <span>Стабільно</span>
                    <span>Хаотично</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scenario Management */}
            <div className="space-y-6">
              <SectionDivider icon={Save} text="Сценарії прогнозів" />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="form-control space-y-3">
                  <label className="label p-0" htmlFor="scenarioName">
                    <FieldLabel icon={Save} text="Назва сценарію" />
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="scenarioName"
                      type="text"
                      value={scenarioName}
                      onChange={(event) => setScenarioName(event.target.value)}
                      className="input input-bordered w-full focus:input-primary transition-colors"
                      placeholder="Наприклад, Оптимістичне відновлення"
                    />
                    <button
                      type="button"
                      className="btn btn-outline btn-primary btn-square btn-sm"
                      onClick={handleSaveScenario}
                      disabled={scenarioSyncing}
                    >
                      <Save className="w-4 h-4" aria-hidden="true" />
                      <span className="sr-only">Зберегти сценарій</span>
                    </button>
                  </div>
                  <span className="text-xs text-base-content/60">
                    Збереження виконує невелику іконку вище.
                  </span>
                </div>

                <div className="form-control space-y-3">
                  <label className="label p-0" htmlFor="scenarioSelect">
                    <FieldLabel icon={FileText} text="Збережені сценарії" />
                  </label>
                  <div className="flex items-center gap-3">
                    <select
                      id="scenarioSelect"
                      className="select select-bordered w-full focus:select-primary transition-colors"
                      value={selectedScenarioId}
                      onChange={handleScenarioSelect}
                      disabled={scenariosLoading || scenarioSyncing}
                    >
                      <option value="">
                        {scenariosLoading ? 'Завантаження сценаріїв...' : 'Оберіть сценарій'}
                      </option>
                      {scenarios.map((scenario) => (
                        <option key={scenario.id} value={scenario.id}>
                          {scenario.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-outline btn-error btn-square btn-sm"
                      onClick={handleDeleteScenario}
                      disabled={!selectedScenarioId || scenarioSyncing}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      <span className="sr-only">Видалити сценарій</span>
                    </button>
                  </div>
                  <span className="text-xs text-base-content/60">
                    Сценарій застосовується автоматично після вибору.
                  </span>
                </div>
              </div>

              {scenarioError && (
                <div className="alert alert-warning shadow-sm">
                  <span className="text-sm">{scenarioError}</span>
                </div>
              )}
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

          {/* Regional Distribution Skeleton */}
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body p-6 sm:p-8">
              <div className="mb-4">
                <div className="skeleton h-8 w-64 mb-2"></div>
                <div className="skeleton h-4 w-96 max-w-full"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="stats stats-vertical shadow bg-base-200 border border-base-300">
                    <div className="stat">
                      <div className="skeleton h-4 w-20 mb-2"></div>
                      <div className="skeleton h-8 w-24 mb-2"></div>
                      <div className="skeleton h-3 w-16"></div>
                    </div>
                    <div className="stat">
                      <div className="skeleton h-4 w-16 mb-2"></div>
                      <div className="skeleton h-6 w-20"></div>
                    </div>
                    <div className="stat">
                      <div className="skeleton h-4 w-16 mb-2"></div>
                      <div className="skeleton h-6 w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className={`bg-base-100 rounded-lg shadow-xl border border-base-300 transition-opacity duration-300 ${loading && !isInitialLoad ? 'opacity-75' : ''}`}>
          <div className="px-4 pt-4 sm:px-6 sm:pt-6 pb-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-base-content">Результати прогнозу</h3>
              <div className="tooltip tooltip-bottom" data-tip="Візуалізація та аналіз прогнозованих даних">
                <p className="text-base-content/60 text-xs cursor-pointer">ⓘ</p>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="tabs abs-lift w-full px-6 sm:px-8 pt-4">
            <input
              type="radio"
              name="prediction-tabs"
              role="tab"
              className="tab hidden"
              aria-label="Графік"
              id="tab-chart"
              checked={activeTab === 'chart'}
              onChange={() => setActiveTab('chart')}
            />
            <label
              role="tab"
              htmlFor="tab-chart"
              className={`tab flex items-center gap-2 ${activeTab === 'chart' ? 'tab-active' : ''}`}
            >
              <LineChart className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Графік</span>
            </label>
            <div
              role="tabpanel"
              className={`tab-content bg-base-100 border-base-300 rounded-box p-6 ${
                activeTab === 'chart' ? '' : 'hidden'
              }`}
            >
              <PredictionChart data={result.data} />
            </div>

            <input
              type="radio"
              name="prediction-tabs"
              role="tab"
              className="tab hidden"
              aria-label="Регіони"
              id="tab-regions"
              checked={activeTab === 'regions'}
              onChange={() => setActiveTab('regions')}
            />
            <label
              role="tab"
              htmlFor="tab-regions"
              className={`tab flex items-center gap-2 ${activeTab === 'regions' ? 'tab-active' : ''}`}
            >
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Регіони</span>
            </label>
            <div
              role="tabpanel"
              className={`tab-content bg-base-100 border-base-300 rounded-box p-6 ${
                activeTab === 'regions' ? '' : 'hidden'
              }`}
            >
              {result.regions && result.regions.length > 0 ? (
                <RegionalDistribution
                  regions={result.regions}
                  totalPopulation={result.predictedPopulation}
                />
              ) : (
                <div className="alert alert-info">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span>Регіональні дані недоступні</span>
                </div>
              )}
            </div>

            <input
              type="radio"
              name="prediction-tabs"
              role="tab"
              className="tab hidden"
              aria-label="Підсумок"
              id="tab-summary"
              checked={activeTab === 'summary'}
              onChange={() => setActiveTab('summary')}
            />
            <label
              role="tab"
              htmlFor="tab-summary"
              className={`tab flex items-center gap-2 ${activeTab === 'summary' ? 'tab-active' : ''}`}
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Підсумок</span>
            </label>
            <div
              role="tabpanel"
              className={`tab-content bg-base-100 border-base-300 rounded-box p-6 ${
                activeTab === 'summary' ? '' : 'hidden'
              }`}
            >
              <SummaryBox result={result} />
            </div>

            <input
              type="radio"
              name="prediction-tabs"
              role="tab"
              className="tab hidden"
              aria-label="Чутливість"
              id="tab-sensitivity"
              checked={activeTab === 'sensitivity'}
              onChange={() => setActiveTab('sensitivity')}
            />
            <label
              role="tab"
              htmlFor="tab-sensitivity"
              className={`tab flex items-center gap-2 ${activeTab === 'sensitivity' ? 'tab-active' : ''}`}
            >
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Чутливість</span>
            </label>
            <div
              role="tabpanel"
              className={`tab-content bg-base-100 border-base-300 rounded-box p-6 ${
                activeTab === 'sensitivity' ? '' : 'hidden'
              }`}
            >
              <SensitivityPanel sensitivity={result.sensitivity} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

