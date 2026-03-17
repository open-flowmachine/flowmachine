import { useState } from "react";
import { toast } from "sonner";
import type { z } from "zod/v4";

type UseJsonEditorOptions<TSchema extends z.ZodType> = {
  initialValue?: string;
  schema: TSchema;
};

export const useJsonEditor = <TSchema extends z.ZodType>({
  initialValue,
  schema,
}: UseJsonEditorOptions<TSchema>) => {
  const [value, setValue] = useState<string>(initialValue ?? "");
  const [error, setError] = useState<Error | null>(null);

  const handleValueChange = (newValue: string) => {
    try {
      JSON.parse(newValue);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
    setValue(newValue);
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 4);
      setValue(formatted);
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();

      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newValue =
        value.substring(0, start) + "    " + value.substring(end);
      handleValueChange(newValue);

      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      });
    }
  };

  const withValidation = (onSave: (data: z.output<TSchema>) => void) => {
    return () => {
      try {
        const parsed = JSON.parse(value);
        const validationResult = schema.safeParse(parsed);

        if (!validationResult.success) {
          const firstIssue = validationResult.error.issues[0];
          const errorMessage = firstIssue?.message ?? "Validation failed";
          toast.error(`Validation error: ${errorMessage}`);
          setError(new Error(errorMessage));
          return;
        }

        setError(null);
        onSave(validationResult.data);
      } catch (err) {
        toast.error("Invalid JSON syntax");
        setError(err as Error);
      }
    };
  };

  return {
    value,
    error,
    onChange: handleValueChange,
    onFormat: handleFormatJson,
    onKeyDown: handleKeyDown,
    withValidation,
  } as const;
};
