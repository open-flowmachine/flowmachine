import { useState } from "react";

type ConfirmableActionStep = "idle" | "confirmation" | "inProgress";

export const useConfirmableAction = () => {
  const [step, setStep] = useState<ConfirmableActionStep>("idle");

  const withConfirmableAction =
    <T extends unknown[], K>(action: (...args: T) => Promise<K>) =>
    async (...args: T) => {
      if (step === "confirmation") {
        setStep("inProgress");
        try {
          await action(...args);
        } finally {
          setStep("idle");
        }
      } else {
        setStep("confirmation");
      }
    };

  const resetAction = () => setStep("idle");
  const triggerAction = () => setStep("confirmation");

  return {
    step,
    withConfirmableAction,
    resetAction,
    triggerAction,
  };
};
