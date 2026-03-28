import { Separator } from "@base-ui/react/separator";
import {
  Controller,
  type FieldErrors,
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
import { Spinner } from "@/component/ui/spinner";
import { Switch } from "@/component/ui/switch";
import type { EditWorkflowDefinitionFormValues } from "@/feature/editable-workflow-definition-details/edit-workflow-definition-form-schema";
import type { Project } from "@/module/project/project-type";
import { makeWorkflowDefinitionService } from "@/module/workflow/workflow-definition-service";
import type { WorkflowDefinition } from "@/module/workflow/workflow-definition-type";

type EditWorkflowDefinitionFormProps = {
  workflowDefinition: WorkflowDefinition;
  form: UseFormReturn<EditWorkflowDefinitionFormValues>;
  projects: Project[];
  onCancel: () => void;
  onValidFormSubmit: (
    values: EditWorkflowDefinitionFormValues,
  ) => Promise<void>;
  onInvalidFormSubmit: (
    values: FieldErrors<EditWorkflowDefinitionFormValues>,
  ) => void;
};

export function EditWorkflowDefinitionForm({
  workflowDefinition,
  form,
  projects,
  onCancel,
  onValidFormSubmit,
  onInvalidFormSubmit,
}: EditWorkflowDefinitionFormProps) {
  const workflowDefinitionDomainService = makeWorkflowDefinitionService({
    workflowDefinition,
  });
  const chipsRef = useComboboxAnchor();

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
          <Field>
            <FieldLabel>Created at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {workflowDefinitionDomainService.getCreatedAt()}
              </span>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Updated at</FieldLabel>
            <FieldContent>
              <span className="text-sm">
                {workflowDefinitionDomainService.getUpdatedAt()}
              </span>
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>

      <Separator />

      <FieldSet>
        <FieldLegend>Workflow definition</FieldLegend>
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
