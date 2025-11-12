
# 🧭 **Implementation Instructions**

### Module: `Population Prediction Tool`

### Stack: Next.js (App Router) + TypeScript + pnpm

---

## ⚙️ **1. Install dependencies**

Open the integrated terminal and run:

```bash
pnpm add recharts axios zod
pnpm add -D @types/node
```

**Why:**

* `recharts` → for clean population trend charts
* `axios` → for API fetching (can replace with `fetch` later)
* `zod` → schema validation for user inputs
* Type definitions for server and utilities

---

## 🏗️ **2. Folder Structure**

In your `src/` directory (or root if no `src` used), follow this structure:

```
src/
 ├─ app/
 │   ├─ predict/
 │   │   ├─ page.tsx                # main page (UI)
 │   │   ├─ components/
 │   │   │   ├─ PredictionForm.tsx  # user input UI
 │   │   │   ├─ PredictionChart.tsx # chart output
 │   │   │   └─ SummaryBox.tsx      # textual summary
 │   │   └─ styles.css
 │   └─ api/
 │       └─ predict/route.ts        # API endpoint logic
 ├─ lib/
 │   ├─ api/
 │   │   ├─ fetchCountryData.ts     # calls country.space
 │   │   ├─ fetchExternalFactors.ts # calls WorldBank, ACLED, etc.
 │   ├─ utils/
 │   │   ├─ formula.ts              # core math formula logic
 │   │   └─ types.ts                # shared types
 └─ components/
     └─ ui/                         # shared UI components (optional)
```

---

## 🧩 **3. Define shared types**

File: `src/lib/utils/types.ts`

```ts
export interface PopulationDataPoint {
  year: number;
  value: number;
}

export interface PredictionInput {
  baseYear: number;
  targetYear: number;
  birthRateChange: number;
  deathRateChange: number;
  migrationChange: number;
  economicSituation: 'weak' | 'stable' | 'growing';
  conflictIntensity: 'peace' | 'tension' | 'war';
  familySupport: 'low' | 'medium' | 'strong';
}

export interface PredictionResult {
  predictedPopulation: number;
  growthRate: number;
  adjustedRate: number;
  message: string;
  data: { year: number; value: number }[];
}
```

---

## 🧮 **4. Core mathematical formula**

File: `src/lib/utils/formula.ts`

```ts
import { PredictionInput } from './types';

// baseline weights for modifiers
const WEIGHTS = {
  birth: 0.002,
  death: 0.002,
  migration: 0.001,
  economic: 0.0003,
  conflict: 0.0015,
  support: 0.0008,
};

export function calculateAdjustedRate(
  baseRate: number,
  input: PredictionInput
): number {
  const econ = input.economicSituation === 'growing'
    ? 1 : input.economicSituation === 'weak' ? -1 : 0;

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

  return (
    baseRate +
    WEIGHTS.birth * (input.birthRateChange / 100) -
    WEIGHTS.death * (input.deathRateChange / 100) +
    WEIGHTS.migration * (input.migrationChange / 100) +
    WEIGHTS.economic * econ -
    WEIGHTS.conflict * conflict +
    WEIGHTS.support * support
  );
}

export function predictPopulation(
  basePopulation: number,
  baseRate: number,
  input: PredictionInput
): number {
  const adjustedRate = calculateAdjustedRate(baseRate, input);
  const years = input.targetYear - input.baseYear;
  const predicted = basePopulation * Math.exp(adjustedRate * years);
  return Math.round(predicted);
}
```

---

## 🌐 **5. Fetching APIs**

### `src/lib/api/fetchCountryData.ts`

```ts
import axios from 'axios';
import { PopulationDataPoint } from '../utils/types';

export async function fetchUkrainePopulation(): Promise<PopulationDataPoint[]> {
  const res = await axios.get('https://country.space/api/v0.1/population/ukraine');
  return res.data.data.populationCounts;
}
```

### `src/lib/api/fetchExternalFactors.ts`

*(Stub — later you can connect World Bank / ACLED here)*

```ts
export async function fetchExternalFactors() {
  return {
    gdpGrowth: 2.5,
    conflictLevel: 'tension',
    migrationRate: -0.5,
  };
}
```

---

## 🔮 **6. Server API endpoint**

File: `src/app/api/predict/route.ts`

```ts
import { NextResponse } from 'next/server';
import { fetchUkrainePopulation } from '@/lib/api/fetchCountryData';
import { predictPopulation } from '@/lib/utils/formula';
import { PredictionInput } from '@/lib/utils/types';

export async function POST(req: Request) {
  const input: PredictionInput = await req.json();

  const data = await fetchUkrainePopulation();
  const base = data.find(d => d.year === input.baseYear) ?? data[data.length - 1];
  const next = data[data.length - 1];
  const baseRate = Math.log(next.value / base.value) / (next.year - base.year);

  const result = predictPopulation(base.value, baseRate, input);

  return NextResponse.json({
    predictedPopulation: result,
    baseRate,
    message: `Predicted population for ${input.targetYear}: ${result.toLocaleString()}`,
  });
}
```

---

## 🧱 **7. Frontend components**

### `PredictionForm.tsx`

```tsx
'use client';

import { useState } from 'react';
import axios from 'axios';
import { PredictionInput } from '@/lib/utils/types';
import PredictionChart from './PredictionChart';
import SummaryBox from './SummaryBox';

export default function PredictionForm() {
  const [input, setInput] = useState<PredictionInput>({
    baseYear: 2018,
    targetYear: 2030,
    birthRateChange: 0,
    deathRateChange: 0,
    migrationChange: 0,
    economicSituation: 'stable',
    conflictIntensity: 'tension',
    familySupport: 'medium',
  });

  const [result, setResult] = useState<any>(null);

  const handleChange = (field: keyof PredictionInput, value: any) => {
    setInput(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await axios.post('/api/predict', input);
    setResult(res.data);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>Target Year: </label>
          <input
            type="number"
            value={input.targetYear}
            onChange={e => handleChange('targetYear', Number(e.target.value))}
            className="border rounded p-2"
          />
        </div>
        <div>
          <label>Birth Rate Change (%): </label>
          <input
            type="range"
            min={-10}
            max={10}
            value={input.birthRateChange}
            onChange={e => handleChange('birthRateChange', Number(e.target.value))}
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          Predict
        </button>
      </form>

      {result && (
        <>
          <SummaryBox data={result} />
          <PredictionChart data={result.data} />
        </>
      )}
    </div>
  );
}
```

---

### `SummaryBox.tsx`

```tsx
export default function SummaryBox({ data }: { data: any }) {
  return (
    <div className="p-4 bg-gray-100 rounded shadow">
      <p>{data.message}</p>
      <p><b>Base rate:</b> {data.baseRate.toFixed(4)}</p>
    </div>
  );
}
```

### `PredictionChart.tsx`

```tsx
'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function PredictionChart({ data }: { data: any[] }) {
  if (!data) return null;
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#2563eb" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## 📘 **8. Page Entry**

File: `src/app/predict/page.tsx`

```tsx
import PredictionForm from './components/PredictionForm';

export default function PredictPage() {
  return (
    <main className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Population Prediction (Ukraine)</h1>
      <PredictionForm />
    </main>
  );
}
```

---

## 🧹 **9. Best Practice Notes**

* Keep **all math and API logic** isolated in `/lib/` — easy to unit test and extend.
* Never hardcode API keys in the frontend — use server routes.
* For more realism later, replace `fetchExternalFactors()` with live API calls.
* Use **Zod validation** in `/api/predict` for robust schema checking.
* Cache results in a small DB (like SQLite or Redis) if performance matters.
