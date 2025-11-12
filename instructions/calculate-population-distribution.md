**Regional and Gender-Based Population Forecast Module**

---

## 🎯 Objective

Enhance the existing population prediction module by:

1. Distributing the predicted national population across **regions (or oblasts)** based on configurable coefficients (e.g., Kyiv = 3.7%, Lviv = 3.1%, etc.).
2. Further subdividing each regional prediction into **male and female populations** using historical or estimated gender ratios (e.g., male = 46%, female = 54%).
3. Returning a new structured JSON response including:

   * Region name
   * Region population (predicted)
   * Male population
   * Female population
   * Percent share of total
   * Optional bounds (±3%)

---

## 🧩 Implementation Plan

### 1. **File Structure Update**

Maintain modular structure and separation of logic.

```
src/
 ├─ lib/
 │   ├─ forecast/
 │   │   ├─ populationModel.ts        // existing logistic/AI model
 │   │   ├─ regionalDistribution.ts   // NEW: handle coefficients and regional logic
 │   │   ├─ genderSplit.ts            // NEW: handle gender-based ratios
 │   │   └─ utils.ts                  // shared helpers
 │   └─ types/
 │       └─ forecast.ts               // define shared interfaces
 ├─ app/
 │   ├─ api/
 │   │   └─ forecast/
 │   │       ├─ route.ts              // extend to include regional forecast
 │   └─ components/
 │       └─ ForecastResult.tsx        // optional: add visualization for regions
 └─ data/
     ├─ regionalCoefficients.json     // static % distribution
     └─ genderRatios.json             // default ratios, can be dynamic later
```

---

### 2. **Add Regional Coefficients**

Create `src/data/regionalCoefficients.json`:

```json
{
  "Kyiv": 3.7,
  "Lviv": 3.1,
  "Odesa": 3.2,
  "Kharkiv": 4.0,
  "Dnipro": 3.6,
  "Zaporizhzhia": 2.8,
  "Poltava": 2.4,
  "Vinnytsia": 2.5,
  "Chernihiv": 2.0,
  "Zhytomyr": 2.2,
  "Other": 70.5
}
```

---

### 3. **Add Gender Ratios**

Create `src/data/genderRatios.json`:

```json
{
  "default": { "male": 0.46, "female": 0.54 },
  "Kyiv": { "male": 0.47, "female": 0.53 },
  "Lviv": { "male": 0.45, "female": 0.55 }
}
```

Later, these ratios can be fetched dynamically (e.g., from UN Data API or World Bank).

---

### 4. **New Module: `regionalDistribution.ts`**

```ts
import coefficients from "@/data/regionalCoefficients.json";
import { RegionForecast } from "@/lib/types/forecast";
import { applyGenderSplit } from "./genderSplit";

export function calculateRegionalForecast(totalPopulation: number, year: number): RegionForecast[] {
  const totalCoeff = Object.values(coefficients).reduce((a, b) => a + b, 0);

  return Object.entries(coefficients).map(([region, coeff]) => {
    const regionPopulation = (totalPopulation * coeff) / totalCoeff;

    const genderSplit = applyGenderSplit(region, regionPopulation);

    return {
      region,
      population: Math.round(regionPopulation),
      male: genderSplit.male,
      female: genderSplit.female,
      percent: +(coeff / totalCoeff * 100).toFixed(2),
      year,
    };
  });
}
```

---

### 5. **New Module: `genderSplit.ts`**

```ts
import ratios from "@/data/genderRatios.json";

export function applyGenderSplit(region: string, population: number) {
  const ratio = ratios[region] || ratios["default"];
  const male = Math.round(population * ratio.male);
  const female = Math.round(population * ratio.female);
  return { male, female };
}
```

---

### 6. **Update API Route**

In `src/app/api/forecast/route.ts`, after your main forecast logic:

```ts
import { calculateRegionalForecast } from "@/lib/forecast/regionalDistribution";

export async function POST(req: Request) {
  const { country, year } = await req.json();

  const prediction = await predictPopulation(country, year); // existing model
  const regionalForecast = calculateRegionalForecast(prediction.predictedPopulation, year);

  return Response.json({
    ...prediction,
    regions: regionalForecast
  });
}
```

---

### 7. **Type Definitions**

Add to `src/lib/types/forecast.ts`:

```ts
export interface RegionForecast {
  region: string;
  population: number;
  male: number;
  female: number;
  percent: number;
  year: number;
}
```

---

### 8. **Optional: Display Layer**

Add a component at `src/app/components/ForecastResult.tsx`:

```tsx
"use client";
import React from "react";

export default function ForecastResult({ data }) {
  return (
    <div className="mt-4 space-y-3">
      <h3 className="text-lg font-semibold">Regional Forecast</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {data.regions.map((r) => (
          <div key={r.region} className="p-3 rounded-xl border shadow-sm">
            <p className="font-bold">{r.region}</p>
            <p>Total: {r.population.toLocaleString()}</p>
            <p>♂ {r.male.toLocaleString()} / ♀ {r.female.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 9. **Optional Future Upgrade**

Later, you can:

* Fetch **dynamic regional coefficients** via World Bank or UN APIs.
* Adjust ratios based on **migration, fertility rate**, or **war impact** data.
* Integrate **geopolitical layers** (GDP, displacement, fertility) to refine coefficients dynamically.

---

### 10. **Install Dependencies**

If not already present:

```bash
pnpm add zod
```

> To validate inputs cleanly before passing them into your model.

---

## ✅ Example Output

```json
{
  "predictedPopulation": 52480365,
  "year": 2030,
  "regions": [
    {
      "region": "Kyiv",
      "population": 1941773,
      "male": 912633,
      "female": 1029140,
      "percent": 3.7,
      "year": 2030
    },
    {
      "region": "Lviv",
      "population": 1626881,
      "male": 731096,
      "female": 896785,
      "percent": 3.1,
      "year": 2030
    }
  ]
}
```
