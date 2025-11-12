# 🧠 Improved Population Prediction Layer

### Goal

Enhance the population prediction module with:

* A **hybrid exponential-logistic model**
* Dynamic **economic / conflict / sentiment** modifiers
* Smooth nonlinear factor responses
* Optional **scenario uncertainty**

---

## 🪄 STEP 1: Upgrade `formula.ts`

**File:** `src/lib/utils/formula.ts`
**Task:** Replace existing formula logic with this enhanced hybrid model.

```ts
// @cursor: step start
import { PredictionInput } from './types';

/**
 * Complex hybrid population prediction model:
 * - Combines exponential & logistic growth
 * - Adjusts for economic, conflict, and global sentiment effects
 * - Nonlinear response using tanh/log/exponential weighting
 */

const WEIGHTS = {
  birth: 0.002,
  death: 0.002,
  migration: 0.001,
  economic: 0.0003,
  conflict: 0.0015,
  support: 0.0008,
};

// helper nonlinear functions
const tanh = (x: number) => Math.tanh(x / 10);
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const clamp = (x: number, min: number, max: number) => Math.min(Math.max(x, min), max);

/**
 * Compute dynamic carrying capacity (K)
 */
function computeCarryingCapacity(
  basePop: number,
  gdpGrowth: number,
  conflictLevel: number,
  support: number
): number {
  const baseK = basePop * 1.3; // assume max potential ~130% of base
  const econEffect = 1 + 0.05 * Math.log1p(gdpGrowth / 100);
  const conflictPenalty = Math.exp(conflictLevel * 0.1);
  const supportBoost = 1 + support * 0.05;
  return baseK * econEffect * supportBoost / conflictPenalty;
}

/**
 * Effective growth rate (r_eff)
 */
function effectiveRate(baseRate: number, input: PredictionInput): number {
  const econ =
    input.economicSituation === 'growing'
      ? 1
      : input.economicSituation === 'weak'
      ? -1
      : 0;

  const conflict =
    input.conflictIntensity === 'war'
      ? 1
      : input.conflictIntensity === 'tension'
      ? 0.5
      : -0.2;

  const support =
    input.familySupport === 'strong'
      ? 1
      : input.familySupport === 'medium'
      ? 0.4
      : 0;

  const rEff =
    baseRate +
    WEIGHTS.birth * tanh(input.birthRateChange) -
    WEIGHTS.death * tanh(input.deathRateChange) +
    WEIGHTS.migration * tanh(input.migrationChange) +
    WEIGHTS.economic * econ -
    WEIGHTS.conflict * conflict +
    WEIGHTS.support * support;

  return clamp(rEff, -0.02, 0.02); // ±2% yearly limit for realism
}

/**
 * Main hybrid population prediction
 */
export function predictPopulationAdvanced(
  basePopulation: number,
  baseRate: number,
  input: PredictionInput,
  globalFactors?: { gdpGrowth?: number; conflictIndex?: number; sentiment?: number }
) {
  const years = input.targetYear - input.baseYear;
  const rEff = effectiveRate(baseRate, input);

  const gdpGrowth = globalFactors?.gdpGrowth ?? 2;
  const conflictIdx = globalFactors?.conflictIndex ?? 0.5;
  const sentiment = globalFactors?.sentiment ?? 0;

  // compute carrying capacity
  const K = computeCarryingCapacity(basePopulation, gdpGrowth, conflictIdx, sentiment);

  // logistic + exponential hybrid model
  const gamma = 0.3; // shape parameter
  const P_exp = basePopulation * Math.exp(rEff * years);
  const P_log = P_exp * Math.pow(1 - basePopulation / K, -gamma);

  // apply sentiment influence (global effect ±2%)
  const worldInfluence = 1 + (sentiment * 0.02);
  const predicted = P_log * worldInfluence;

  // add uncertainty band (±3%)
  const uncertainty = predicted * 0.03;

  return {
    predicted: Math.round(predicted),
    lower: Math.round(predicted - uncertainty),
    upper: Math.round(predicted + uncertainty),
    adjustedRate: rEff,
    carryingCapacity: Math.round(K),
  };
}
// @cursor: step end
```

---

## 🌍 STEP 2: Extend Global Factors Layer

**File:** `src/lib/api/fetchExternalFactors.ts`

Replace stub with simulated dynamic data (later can be real APIs).

```ts
// @cursor: step start
export async function fetchExternalFactors() {
  // placeholder logic — later you can call World Bank, ACLED, etc.
  const gdpGrowth = 2.8;       // %
  const conflictIndex = 0.6;   // 0 (peace) → 1 (war)
  const sentiment = 0.2;       // -1 (pessimistic) → +1 (optimistic)

  return { gdpGrowth, conflictIndex, sentiment };
}
// @cursor: step end
```

---

## ⚙️ STEP 3: Integrate Into API Route

**File:** `src/app/api/predict/route.ts`
Modify to call new formula and factors.

```ts
// @cursor: step start
import { NextResponse } from 'next/server';
import { fetchUkrainePopulation } from '@/lib/api/fetchCountryData';
import { fetchExternalFactors } from '@/lib/api/fetchExternalFactors';
import { predictPopulationAdvanced } from '@/lib/utils/formula';
import { PredictionInput } from '@/lib/utils/types';

export async function POST(req: Request) {
  const input: PredictionInput = await req.json();

  const data = await fetchUkrainePopulation();
  const base = data.find(d => d.year === input.baseYear) ?? data[data.length - 1];
  const next = data[data.length - 1];
  const baseRate = Math.log(next.value / base.value) / (next.year - base.year);

  const factors = await fetchExternalFactors();
  const result = predictPopulationAdvanced(base.value, baseRate, input, factors);

  return NextResponse.json({
    predictedPopulation: result.predicted,
    baseRate,
    adjustedRate: result.adjustedRate,
    carryingCapacity: result.carryingCapacity,
    lowerBound: result.lower,
    upperBound: result.upper,
    message: `Predicted population for ${input.targetYear}: ${result.predicted.toLocaleString()} (±3%)`,
  });
}
// @cursor: step end
```

---

## 📈 STEP 4: Improve Chart Visualization (Optional)

**File:** `PredictionChart.tsx`
Add confidence bands.

```tsx
// @cursor: step start
<Line type="monotone" dataKey="value" stroke="#2563eb" />
<Line type="monotone" dataKey="lowerBound" stroke="#9ca3af" strokeDasharray="3 3" />
<Line type="monotone" dataKey="upperBound" stroke="#9ca3af" strokeDasharray="3 3" />
// @cursor: step end
```

*(Make sure the API adds `lowerBound` and `upperBound` into the `data` object before plotting.)*

---

## 🧩 STEP 5: Add Scenario Summary

**File:** `SummaryBox.tsx`
Show more dynamic context.

```tsx
// @cursor: step start
<div className="p-4 bg-gray-100 rounded shadow">
  <p>{data.message}</p>
  <p><b>Adjusted growth rate:</b> {(data.adjustedRate * 100).toFixed(2)}% per year</p>
  <p><b>Carrying capacity:</b> {data.carryingCapacity.toLocaleString()}</p>
  <p><b>Confidence range:</b> {data.lowerBound.toLocaleString()} – {data.upperBound.toLocaleString()}</p>
</div>
// @cursor: step end
```

---

## 🧭 STEP 6: Notes for Cursor AI Execution

* Keep existing file paths — this layer only **enhances**, not replaces.
* Maintain all constants (`baseRate`, `P0`, etc.) as before.
* Allow `fetchExternalFactors()` to evolve later (connect to real APIs).
* The final system should return smooth, believable, nonlinear population trends.

---

## ✅ Final Outcome

Once Cursor AI applies these steps:

* Your `/api/predict` endpoint will use a **dynamic hybrid model**.
* Predictions will **curve naturally** under different input sliders.
* You’ll get **realistic confidence intervals** and **carrying capacity effects**.
* Backend math is complex, but the UI remains simple and intuitive.
