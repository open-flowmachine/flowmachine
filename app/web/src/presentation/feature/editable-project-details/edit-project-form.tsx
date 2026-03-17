import {
  Controller,
  type FieldErrors,
  type UseFormReturn,
} from "react-hook-form";
import {
  type ProjectDomain,
  projectProviders,
} from "@/core/domain/project/entity";
import {
  makeProjectDomainService,
  projectProviderToDisplayName,
} from "@/core/domain/project/service";
import { Button } from "@/presentation/component/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/component/ui/select";
import { Separator } from "@/presentation/component/ui/separator";
import { Spinner } from "@/presentation/component/ui/spinner";
import type { EditProjectFormValues } from "@/presentation/feature/editable-project-details/edit-project-form-schema";

type EditProjectFormProps = {
  project: ProjectDomain;
  form: UseFormReturn<EditProjectFormValues>;
  onCancel: () => void;
  onValidFormSubmit: (values: EditProjectFormValues) => Promise<void>;
  onInvalidFormSubmit: (values: FieldErrors<EditProjectFormValues>) => void;
};

export function EditProjectForm({
  project,
  form,
  onCancel,
  onValidFormSubmit,
  onInvalidFormSubmit,
}: EditProjectFormProps) {
  const projectDomainService = makeProjectDomainService({ project });

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(onValidFormSubmit, onInvalidFormSubmit)}
    >
      <FieldSet>
        <FieldLegend>Basic</FieldLegend>
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <FieldDescription>
                  A memorable name for your project
                </FieldDescription>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  disabled={form.formState.isSubmitting}
                  id="name"
                  placeholder="My Project"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </FieldSet>

      <Separator />

      <FieldSet>
        <FieldLegend>Integration</FieldLegend>
        <FieldGroup>
          <Controller
            name="integrationProvider"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field orientation="responsive" data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel htmlFor="integrationProvider">
                    Provider
                  </FieldLabel>
                  <FieldDescription>
                    Select the project management tool you want to integrate
                    with
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
                    id="integrationProvider"
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
                    {projectProviders.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {projectProviderToDisplayName[provider]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Controller
            name="integrationDomain"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="integrationDomain">Domain</FieldLabel>
                <FieldDescription>
                  The domain for your project in the selected provider
                </FieldDescription>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  disabled={form.formState.isSubmitting}
                  id="integrationDomain"
                  placeholder="https://<domain>.atlassian.net"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="integrationCredentialId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="integrationCredentialId">
                  Credential ID
                </FieldLabel>
                <FieldDescription>
                  The credential ID for your project in the selected provider
                </FieldDescription>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  disabled={form.formState.isSubmitting}
                  id="integrationCredentialId"
                  placeholder="Credential ID"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="integrationExternalId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="integrationExternalId">
                  External ID
                </FieldLabel>
                <FieldDescription>
                  The external ID for your project in the selected provider
                </FieldDescription>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  disabled={form.formState.isSubmitting}
                  id="integrationExternalId"
                  placeholder="External ID"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="integrationExternalKey"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="integrationExternalKey">
                  External Key
                </FieldLabel>
                <FieldDescription>
                  The external key for your project in the selected provider
                </FieldDescription>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  disabled={form.formState.isSubmitting}
                  id="integrationExternalKey"
                  placeholder="External Key"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="integrationWebhookSecret"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="integrationWebhookSecret">
                  Webhook Secret
                </FieldLabel>
                <FieldDescription>
                  The webhook secret for your project in the selected provider
                </FieldDescription>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  disabled={form.formState.isSubmitting}
                  id="integrationWebhookSecret"
                  placeholder="Webhook Secret"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </FieldSet>

      <Separator />

      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel>Created at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {projectDomainService.getCreatedAt()}
              </span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Updated at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {projectDomainService.getUpdatedAt()}
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
