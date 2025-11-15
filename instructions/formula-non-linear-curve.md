# ✅ ** Non-Linear Swing-Adjusted Demographic Forecasting**

This task extends the existing population prediction module with a **new layer of dynamic volatility modeling** based on:

* **Geopolitical Stability Index (GSI)**
* **Economic Cycle Oscillator (ECO)**
* **International Support Factor (ISF)**
* **Shock Events & Recovery Curves**
* **Volatility Oscillation (“swings”) over time**

The result should make the projection **non-linear**, with realistic periodic cycles, geopolitical dips, recoveries, and support-driven boosts.

---

# 📁 **1. Directory & Files to Modify / Create**

Update or create the following files:

```
/lib/prediction/
    formula.ts                     # extend core population formula
    modifiers/swingFactors.ts      # NEW: geopolitical & economic oscillation model
    modifiers/shocks.ts            # NEW: sudden shock/recovery curves
    modifiers/support.ts           # NEW: intl. support adjustments

/lib/types/
    prediction.ts                  # extend PredictionResult with new fields

/app/api/predict/route.ts          # integrate modifiers

/components/PredictionChart.tsx    # add visualization of swings (optional)
```

---

# ⚙️ **2. Add New Input Fields**

In `/lib/types/prediction.ts`:

```ts
export interface SwingInputs {
  geopoliticalIndex: number; // -1 (war) → +1 (high stability)
  economicCyclePosition: number; // 0–1 phase of economic cycle (oscillator)
  internationalSupport: number; // 0–1 strength of external support
  volatility: number; // 0–1 additional random variability
  shockEvents?: ShockEvent[]; // wars, crises, pandemics
}
```

---

# 🧠 **3. Implement Swing Factors Model**

Create file:

### `/lib/prediction/modifiers/swingFactors.ts`

**Goal:** Add smooth GDP-cycle-like oscillation and geopolitical stability curvature.

```ts
export function applySwingFactors(
  baseGrowthRate: number,
  yearOffset: number,
  inputs: SwingInputs
): number {
  const { geopoliticalIndex, economicCyclePosition, internationalSupport, volatility } = inputs;

  // 1. Economic cycle: sinusoidal oscillator (7–12 year cycles)
  const ecoCycle =
    Math.sin((2 * Math.PI * (yearOffset + economicCyclePosition * 100)) / 9.5) * 0.015;

  // 2. Geopolitical stability affects amplitude of cycle + base rate
  const geoEffect = geopoliticalIndex * 0.01; // -1 → -1%, +1 → +1%

  // 3. International support dampens negative periods
  const supportBoost = internationalSupport * 0.007;

  // 4. Controlled volatility (adds variance)
  const randomVolatility = (Math.random() - 0.5) * 0.01 * volatility;

  // Combined swing factor
  return (
    baseGrowthRate +
    ecoCycle * (1 + geopoliticalIndex * 0.4) + // more unstable → bigger swings
    geoEffect +
    supportBoost +
    randomVolatility
  );
}
```

---

# ⚔️ **4. Add Shock Event Handling**

Create:

### `/lib/prediction/modifiers/shocks.ts`

```ts
export interface ShockEvent {
  year: number;
  severity: number; // -1 (catastrophic decline) → +1 (mass migration inflow)
  recoveryYears: number; // how long recovery curve lasts
}

export function applyShockModifier(
  population: number,
  currentYear: number,
  shocks: ShockEvent[]
): number {
  let modifier = 0;

  for (const s of shocks) {
    const distance = currentYear - s.year;
    if (distance >= 0 && distance <= s.recoveryYears) {
      const phase = distance / s.recoveryYears;

      // logistic recovery curve
      const recoveryCurve = 1 - Math.exp(-5 * phase);

      modifier += s.severity * (recoveryCurve * 0.04); // up to ±4% over curve
    }
  }

  return population * (1 + modifier);
}
```

---

# 🌍 **5. International Support Softening Model**

Create:

### `/lib/prediction/modifiers/support.ts`

```ts
export function applySupportSoftening(
  adjustedRate: number,
  supportLevel: number
): number {
  // Support reduces amplitude of negative rates
  if (adjustedRate < 0) {
    return adjustedRate * (1 - supportLevel * 0.5);
  }
  return adjustedRate;
}
```

---

# 🧩 **6. Integrate Everything Into the Main Formula**

Modify:

### `/lib/prediction/formula.ts`

Inside your multi-year iteration loop, apply the modifiers:

```ts
import { applySwingFactors } from "./modifiers/swingFactors";
import { applyShockModifier } from "./modifiers/shocks";
import { applySupportSoftening } from "./modifiers/support";

export function projectPopulationWithDynamics(
  initialPopulation: number,
  baseGrowthRate: number,
  carryingCapacity: number,
  startYear: number,
  endYear: number,
  inputs: SwingInputs
) {
  const data = [];
  let P = initialPopulation;

  for (let year = startYear; year <= endYear; year++) {
    const t = year - startYear;

    // Apply swing modifiers
    let g = applySwingFactors(baseGrowthRate, t, inputs);

    // International support softens negative periods
    g = applySupportSoftening(g, inputs.internationalSupport);

    // Logistic step with modified growth
    P = logisticStep(P, g, carryingCapacity);

    // Shock events
    if (inputs.shockEvents?.length) {
      P = applyShockModifier(P, year, inputs.shockEvents);
    }

    data.push({ year, value: Math.round(P) });
  }

  return data;
}
```

---

# 🔮 **7. Update API Route**

In `/app/api/predict/route.ts`:

* Accept new SwingInputs
* Pass them into the new `projectPopulationWithDynamics` function
* Return swing metadata (max/min volatility, shock effects, etc.)

---

# 📊 **8. Improve Visualization (Optional)**

Enhance `PredictionChart.tsx`:

* Draw a **dashed line** over the main line to show *swing-adjusted path vs. baseline*
* Highlight shock years with markers
* Tooltip fields:

  * growth rate after modifiers
  * shock influence %
  * economic cycle phase

---

# 🧬 **9. What This Adds to Predictions**

Your model now supports:

### ✔ Cyclical demographic waves (economic cycles)

### ✔ Periodic rises/falls around the trend

### ✔ War effects

### ✔ Recovery curves

### ✔ International support smoothing

### ✔ Emerging stability or instability signals

This results in much more **realistic, dynamic, and engaging** forecasts.

---

# 🎉 **Ready to Run in Cursor**

Just paste this entire block into Cursor, and it will:

* Generate missing files
* Update imports
* Refactor types
* Suggest unit tests
* Validate logic before writing
