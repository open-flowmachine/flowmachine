import z from "zod";

const postProjectSyncRequestParamsDtoSchema = z.object({
  projectId: z.string(),
});

export { postProjectSyncRequestParamsDtoSchema };
