/** Per-million-token USD rates for cost estimation at log time. */
const MODEL_RATES = {
  "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
  "gpt-4o": { inputPer1M: 2.5, outputPer1M: 10 },
  "text-embedding-3-small": { inputPer1M: 0.02, outputPer1M: 0 },
  "text-embedding-3-large": { inputPer1M: 0.13, outputPer1M: 0 }
};

const DEFAULT_RATE = { inputPer1M: 0.15, outputPer1M: 0.6 };

export function estimateCostUsd(model, { promptTokens = 0, completionTokens = 0 }) {
  const rates = MODEL_RATES[model] || DEFAULT_RATE;
  const inputCost = (promptTokens / 1_000_000) * rates.inputPer1M;
  const outputCost = (completionTokens / 1_000_000) * rates.outputPer1M;
  return Number((inputCost + outputCost).toFixed(8));
}

export function computeBillableUnits(totalTokens, unitsPerThousand = 1) {
  if (!totalTokens || totalTokens <= 0) return 0;
  return Math.ceil(totalTokens / 1000) * unitsPerThousand;
}
