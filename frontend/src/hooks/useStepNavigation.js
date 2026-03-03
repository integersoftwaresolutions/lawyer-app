import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Reusable hook for managing multi-step navigation in auth flows
 */
export function useStepNavigation(initialStep = 1, options = {}) {
  const navigate = useNavigate();
  const { onStepChange, defaultBackPath } = options;
  const [step, setStep] = useState(initialStep);

  const goToStep = useCallback((newStep) => {
    setStep(newStep);
    if (onStepChange) {
      onStepChange(newStep);
    }
  }, [onStepChange]);

  const goNext = useCallback(() => {
    goToStep(step + 1);
  }, [step, goToStep]);

  const goBack = useCallback(() => {
    if (step > 1) {
      goToStep(step - 1);
    } else if (defaultBackPath) {
      navigate(defaultBackPath);
    } else {
      navigate(-1);
    }
  }, [step, goToStep, defaultBackPath, navigate]);

  const goTo = useCallback((targetStep) => {
    goToStep(targetStep);
  }, [goToStep]);

  return {
    step,
    goNext,
    goBack,
    goTo,
    goToStep,
    canGoBack: step > 1,
    isFirstStep: step === 1,
    isLastStep: false // Override in specific implementations
  };
}

