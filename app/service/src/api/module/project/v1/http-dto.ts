import z from "zod";
import { entityIdSchema } from "@/core/domain/entity";
import { projectCrudServiceInputSchema } from "@/core/domain/project/crud-service";
import { projectEntityProps } from "@/core/domain/project/entity";
import { tenantSchema } from "@/core/domain/tenant-aware-entity";

const projectResponseDtoSchema = z.object({
  id: entityIdSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  tenant: tenantSchema,
  name: projectEntityProps.shape.name,
});
type ProjectResponseDto = z.output<typeof projectResponseDtoSchema>;

const postProjectRequestBodyDtoSchema = z.object({
  name: projectCrudServiceInputSchema.create.shape.payload.shape.name,
  integration:
    projectCrudServiceInputSchema.create.shape.payload.shape.integration,
});

const patchProjectRequestParamsDtoSchema = z.object({
  id: entityIdSchema,
});

const patchProjectRequestBodyDtoSchema = z.object({
  name: projectEntityProps.shape.name.optional(),
  integration: projectEntityProps.shape.integration.optional(),
});

const deleteProjectRequestParamsDtoSchema = z.object({
  id: entityIdSchema,
});

export {
  projectResponseDtoSchema,
  type ProjectResponseDto,
  postProjectRequestBodyDtoSchema,
  patchProjectRequestParamsDtoSchema,
  patchProjectRequestBodyDtoSchema,
  deleteProjectRequestParamsDtoSchema,
};
