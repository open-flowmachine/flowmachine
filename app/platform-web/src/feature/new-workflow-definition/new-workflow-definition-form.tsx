import {
  Controller,
  type SubmitErrorHandler,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";
import { JsonEditorTextarea } from "@/component/extended-ui/json-editor-textarea";
import { Button } from "@/component/ui/button";
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
} from "@/component/ui/combobox";
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
import { Separator } from "@/component/ui/separator";
import { Spinner } from "@/component/ui/spinner";
import { Switch } from "@/component/ui/switch";
import type { NewWorkflowDefinitionFormValues } from "@/feature/new-workflow-definition/new-workflow-definition-form-schema";
import type { Project } from "@/module/project/project-type";

type NewWorkflowDefinitionFormProps = {
  form: UseFormReturn<NewWorkflowDefinitionFormValues>;
  projects: Project[];
  handleValidFormSubmit: SubmitHandler<NewWorkflowDefinitionFormValues>;
  handleInvalidFormSubmit: SubmitErrorHandler<NewWorkflowDefinitionFormValues>;
};

export function NewWorkflowDefinitionForm({
  form,
  projects,
  handleValidFormSubmit,
  handleInvalidFormSubmit,
}: NewWorkflowDefinitionFormProps) {
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
          Fill in the details below to create a new workflow
        </FieldDescription>
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <FieldDescription>
                  A descriptive name for your workflow
                </FieldDescription>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  disabled={form.formState.isSubmitting}
                  id="name"
                  placeholder="My Workflow"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <FieldDescription>
                  A brief description of what this workflow does
                </FieldDescription>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                  disabled={form.formState.isSubmitting}
                  id="description"
                  placeholder="This workflow..."
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="isActive"
            control={form.control}
            render={({ field }) => (
              <Field orientation="responsive">
                <FieldContent>
                  <FieldLabel htmlFor="isActive">Active</FieldLabel>
                  <FieldDescription>
                    Whether this workflow is active and can be triggered
                  </FieldDescription>
                </FieldContent>
                <Switch
                  id="isActive"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={form.formState.isSubmitting}
                />
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
                    Add to which projects this workflow belongs. You can assign
                    it to multiple projects.
                  </FieldDescription>
                  <Combobox
                    multiple
                    items={projects}
                    value={selectedProjects}
                    onValueChange={(next: Project[]) =>
                      field.onChange(next.map((p) => p.id))
                    }
                  >
                    <ComboboxChips ref={chipsRef}>
                      <ComboboxValue>
                        {(value: Project[]) => (
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
                        {(project: Project) => (
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

      <FieldSet>
        <FieldLegend>Workflow definition</FieldLegend>
        <FieldDescription>
          Define the actions and edges that make up your workflow
        </FieldDescription>
        <FieldGroup>
          <Controller
            name="actionsJson"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Actions (JSON)</FieldLabel>
                <FieldDescription>
                  An array of workflow actions, each with an id, kind, and name
                </FieldDescription>
                <div className="h-64">
                  <JsonEditorTextarea
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    disabled={form.formState.isSubmitting}
                  />
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="edgesJson"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Edges (JSON)</FieldLabel>
                <FieldDescription>
                  An array of edges connecting actions, each with a from and to
                  action ID
                </FieldDescription>
                <div className="h-48">
                  <JsonEditorTextarea
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    disabled={form.formState.isSubmitting}
                  />
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
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
