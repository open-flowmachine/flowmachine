import { addYears, format } from "date-fns";
import { isNil } from "es-toolkit";
import { CalendarIcon } from "lucide-react";
import {
  Controller,
  type FieldErrors,
  type UseFormReturn,
} from "react-hook-form";
import type { CredentialDomain } from "@/core/domain/credential/entity";
import { makeCredentialDomainService } from "@/core/domain/credential/service";
import { Badge } from "@/presentation/component/ui/badge";
import { Button } from "@/presentation/component/ui/button";
import { Calendar } from "@/presentation/component/ui/calendar";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/presentation/component/ui/field";
import { Input } from "@/presentation/component/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/presentation/component/ui/popover";
import { Separator } from "@/presentation/component/ui/separator";
import { Spinner } from "@/presentation/component/ui/spinner";
import type { EditCredentialFormValues } from "@/presentation/feature/editable-credential-details/edit-credential-form-schema";
import { cn } from "@/presentation/lib/util";

type EditCredentialFormProps = {
  credential: CredentialDomain;
  form: UseFormReturn<EditCredentialFormValues>;
  onCancel: () => void;
  onValidFormSubmit: (values: EditCredentialFormValues) => Promise<void>;
  onInvalidFormSubmit: (values: FieldErrors<EditCredentialFormValues>) => void;
};

export function EditCredentialForm({
  credential,
  form,
  onCancel,
  onValidFormSubmit,
  onInvalidFormSubmit,
}: EditCredentialFormProps) {
  const credentialDomainService = makeCredentialDomainService({ credential });

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(onValidFormSubmit, onInvalidFormSubmit)}
    >
      <FieldSet>
        <FieldLegend>Credential</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel>Type</FieldLabel>
            <FieldContent>
              <Badge variant="secondary" className="w-fit">
                {credentialDomainService.getTypeDisplayName()}
              </Badge>
            </FieldContent>
          </Field>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <FieldDescription>Update the credential name</FieldDescription>
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
          {credential.type === "apiKey" && (
            <Controller
              name="apiKey"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="apiKey">API Key</FieldLabel>
                  <FieldDescription>
                    Update the API key (leave empty to keep current)
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
          {credential.type === "basic" && (
            <>
              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="username">Username</FieldLabel>
                    <FieldDescription>Update the username</FieldDescription>
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
                      Update the password (leave empty to keep current)
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
          <Field>
            <FieldLabel>Created at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {credentialDomainService.getCreatedAt()}
              </span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Updated at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {credentialDomainService.getUpdatedAt()}
              </span>
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>

      <Separator />

      <Field orientation="horizontal">
        <Button
          disabled={form.formState.isSubmitting}
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
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
