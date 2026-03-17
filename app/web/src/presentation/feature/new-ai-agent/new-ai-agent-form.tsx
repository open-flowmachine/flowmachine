import {
  Controller,
  type SubmitErrorHandler,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";
import { aiAgentDomainSchema } from "@/core/domain/ai-agent/entity";
import type { ProjectDomain } from "@/core/domain/project/entity";
import { Button } from "@/presentation/component/ui/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/presentation/component/ui/combobox";
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
import type { NewAiAgentFormValues } from "@/presentation/feature/new-ai-agent/new-ai-agent-form-schema";

type NewAiAgentFormProps = {
  form: UseFormReturn<NewAiAgentFormValues>;
  projects: ProjectDomain[];
  handleValidFormSubmit: SubmitHandler<NewAiAgentFormValues>;
  handleInvalidFormSubmit: SubmitErrorHandler<NewAiAgentFormValues>;
};

export function NewAiAgentForm({
  form,
  projects,
  handleValidFormSubmit,
  handleInvalidFormSubmit,
}: NewAiAgentFormProps) {
  const chipsRef = useComboboxAnchor();

  return (
    <form
      className="max-w-2xl space-y-6"
      onSubmit={form.handleSubmit(
        handleValidFormSubmit,
        handleInvalidFormSubmit,
      )}
    >
      <FieldSet>
        <FieldLegend>Basic details</FieldLegend>
        <FieldDescription>
          Fill in the details below to create your custom AI agent
        </FieldDescription>
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <FieldDescription>
                  A memorable name for your custom AI agent
                </FieldDescription>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  disabled={form.formState.isSubmitting}
                  id="name"
                  placeholder="John Doe"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="model"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field orientation="responsive" data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel htmlFor="model">Model</FieldLabel>
                  <FieldDescription>
                    Select the best model for your use case
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
                    id="model"
                    aria-invalid={fieldState.invalid}
                    className="min-w-[120px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    align="end"
                    side="bottom"
                    alignItemWithTrigger={false}
                  >
                    {aiAgentDomainSchema.shape.model.options.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Controller
            name="projects"
            control={form.control}
            render={({ field, fieldState }) => {
              const selectedProjects = projects.filter((p) =>
                field.value.includes(p.id),
              );
              return (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Assigned projects</FieldLabel>
                  <FieldDescription>
                    Add to which projects this AI agent belongs. You can assign
                    it to multiple projects.
                  </FieldDescription>
                  <Combobox
                    multiple
                    items={projects}
                    value={selectedProjects}
                    onValueChange={(next: ProjectDomain[]) =>
                      field.onChange(next.map((p) => p.id))
                    }
                  >
                    <ComboboxChips ref={chipsRef}>
                      <ComboboxValue>
                        {(value: ProjectDomain[]) => (
                          <>
                            {value.map((project) => (
                              <ComboboxChip
                                key={project.id}
                                aria-label={project.name}
                              >
                                {project.name}
                              </ComboboxChip>
                            ))}
                            <ComboboxChipsInput
                              disabled={form.formState.isSubmitting}
                              placeholder={
                                value.length > 0 ? "" : "Search projects..."
                              }
                            />
                          </>
                        )}
                      </ComboboxValue>
                    </ComboboxChips>
                    <ComboboxContent anchor={chipsRef}>
                      <ComboboxList>
                        {(project: ProjectDomain) => (
                          <ComboboxItem key={project.id} value={project}>
                            {project.name}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                      <ComboboxEmpty>No projects found</ComboboxEmpty>
                    </ComboboxContent>
                  </Combobox>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              );
            }}
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
