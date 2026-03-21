import { addYears, format } from "date-fns";
import { isNil } from "es-toolkit";
import { CalendarIcon } from "lucide-react";
import { useEffect } from "react";
import {
  Controller,
  type SubmitErrorHandler,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";
import { Button } from "@/component/ui/button";
import { Calendar } from "@/component/ui/calendar";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/component/ui/field";
import { Input } from "@/component/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/component/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/component/ui/select";
import { Separator } from "@/component/ui/separator";
import { Spinner } from "@/component/ui/spinner";
import type { NewCredentialFormValues } from "@/feature/new-credential/new-credential-form-schema";
import { cn } from "@/lib/util";
import { credentialTypes } from "@/module/credential/credential-type";

const typeDisplayNames: Record<(typeof credentialTypes)[number], string> = {
  apiKey: "API Key",
  basic: "Basic",
};

type NewCredentialFormProps = {
  form: UseFormReturn<NewCredentialFormValues>;
  handleValidFormSubmit: SubmitHandler<NewCredentialFormValues>;
  handleInvalidFormSubmit: SubmitErrorHandler<NewCredentialFormValues>;
};

export function NewCredentialForm({
  form,
  handleValidFormSubmit,
  handleInvalidFormSubmit,
}: NewCredentialFormProps) {
  const watchedType = form.watch("type");

  useEffect(() => {
    if (watchedType === "apiKey") {
      form.setValue("apiKey" as keyof NewCredentialFormValues, "");
    } else {
      form.setValue("username" as keyof NewCredentialFormValues, "");
      form.setValue("password" as keyof NewCredentialFormValues, "");
    }
  }, [watchedType, form]);

  return (
    <form
      className="max-w-2xl space-y-6"
      onSubmit={form.handleSubmit(
        handleValidFormSubmit,
        handleInvalidFormSubmit,
      )}
    >
      <FieldSet>
        <FieldLegend>Credential details</FieldLegend>
        <FieldDescription>
          Fill in the details below to create a new credential
        </FieldDescription>
        <FieldGroup>
          <Controller
            name="type"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field orientation="responsive" data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel htmlFor="type">Type</FieldLabel>
                  <FieldDescription>
                    Select the credential type
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldContent>
                <Select
                  disabled={form.formState.isSubmitting}
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="type"
                    aria-invalid={fieldState.invalid}
                    className="min-w-32"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    align="end"
                    side="bottom"
                    alignItemWithTrigger={false}
                  >
                    {credentialTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {typeDisplayNames[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <FieldDescription>
                  A human-readable name for this credential
                </FieldDescription>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  disabled={form.formState.isSubmitting}
                  id="name"
                  placeholder="e.g. Production GitHub Token"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          {watchedType === "apiKey" && (
            <Controller
              name="apiKey"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="apiKey">API Key</FieldLabel>
                  <FieldDescription>
                    The API key for authentication
                  </FieldDescription>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    disabled={form.formState.isSubmitting}
                    id="apiKey"
                    placeholder="sk-..."
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          )}
          {watchedType === "basic" && (
            <>
              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="username">Username</FieldLabel>
                    <FieldDescription>
                      The username for basic authentication
                    </FieldDescription>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                      disabled={form.formState.isSubmitting}
                      id="username"
                      placeholder="username"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <FieldDescription>
                      The password for basic authentication
                    </FieldDescription>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                      disabled={form.formState.isSubmitting}
                      id="password"
                      type="password"
                      placeholder="••••••••"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </>
          )}
          <Controller
            name="expiredAt"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field orientation="responsive" data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel htmlFor="expiredAt">Expired At</FieldLabel>
                  <FieldDescription>
                    The expiration date of this credential
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </FieldContent>
                <Popover>
                  <PopoverTrigger
                    render={(props) => (
                      <Button
                        {...props}
                        className={cn(
                          "min-w-32 justify-between gap-x-2.5",
                          !field.value && "text-muted-foreground",
                        )}
                        variant="outline"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon />
                      </Button>
                    )}
                  />
                  <PopoverContent className="w-auto" align="end">
                    <Calendar
                      captionLayout="dropdown"
                      disabled={(date) => date < new Date()}
                      endMonth={addYears(new Date(), 1)}
                      mode="single"
                      onSelect={(date) =>
                        field.onChange(
                          isNil(date) ? undefined : date.toISOString(),
                        )
                      }
                      selected={
                        isNil(field.value) ? undefined : new Date(field.value)
                      }
                    />
                  </PopoverContent>
                </Popover>
              </Field>
            )}
          />
        </FieldGroup>
      </FieldSet>

      <Separator />

      <Field orientation="horizontal">
        <Button
          disabled={form.formState.isSubmitting}
          type="button"
          variant="outline"
          onClick={() => form.reset()}
        >
          Reset
        </Button>
        <Button disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? (
            <>
              <Spinner />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </Field>
    </form>
  );
}
