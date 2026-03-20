import z from "zod";
import { projectProviders } from "@/module/project/project-model";
import { idSchema } from "@/shared/model/model-id";

const integrationSchema = z.object({
  domain: z.string(),
  externalId: z.string(),
  externalKey: z.string(),
  provider: z.enum(projectProviders),
  webhookSecret: z.string(),
  credentialId: idSchema,
});

const projectResponseDtoSchema = z.object({
  id: idSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  name: z.string(),
  integration: integrationSchema.nullable(),
});
type ProjectResponseDto = z.infer<typeof projectResponseDtoSchema>;

const postProjectRequestBodyDtoSchema = z.object({
  name: z.string(),
  integration: integrationSchema.nullable(),
});

const patchProjectRequestParamsDtoSchema = z.object({
  id: idSchema,
});

const patchProjectRequestBodyDtoSchema = z.object({
  name: z.string().optional(),
  integration: integrationSchema.nullable().optional(),
});

const deleteProjectRequestParamsDtoSchema = z.object({
  id: idSchema,
});

export {
  projectResponseDtoSchema,
  type ProjectResponseDto,
  postProjectRequestBodyDtoSchema,
  patchProjectRequestParamsDtoSchema,
  patchProjectRequestBodyDtoSchema,
  deleteProjectRequestParamsDtoSchema,
};
