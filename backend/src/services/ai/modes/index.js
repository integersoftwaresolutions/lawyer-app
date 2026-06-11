import { ApiError } from "../../../helpers/apiError.js";
import { AI_MODES } from "../../../config/constants.js";
import { researchStrategy } from "./research.strategy.js";

const registry = {
  [AI_MODES.RESEARCH]: researchStrategy
};

export function getModeStrategy(mode) {
  const strategy = registry[mode];
  if (!strategy) {
    throw new ApiError(400, `AI mode "${mode}" is not supported yet`);
  }
  return strategy;
}
