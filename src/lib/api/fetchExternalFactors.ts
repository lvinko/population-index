export async function fetchExternalFactors() {
  // placeholder logic — later you can call World Bank, ACLED, etc.
  const gdpGrowth = 2.8; // %
  const conflictIndex = 0.6; // 0 (peace) → 1 (war)
  const sentiment = 0.2; // -1 (pessimistic) → +1 (optimistic)

  return { gdpGrowth, conflictIndex, sentiment };
}

