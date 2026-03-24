import { getEnv } from "@/lib/env/env";
import type { Project } from "@/module/project/project-type";
import { makeBaseMswHandler } from "@/test/msw/msw-util";

const BASE_URL = `${getEnv().NEXT_PUBLIC_SERVICE_BASE_URL}/api/v1/project`;

const makeProjectMswHandler = () => ({
  list: makeBaseMswHandler<Project[]>({ method: "get", url: BASE_URL }),
  getById: makeBaseMswHandler<Project>({
    method: "get",
    url: `${BASE_URL}/:id`,
  }),
  deleteById: makeBaseMswHandler({ method: "delete", url: `${BASE_URL}/:id` }),
  create: makeBaseMswHandler({ method: "post", url: BASE_URL }),
  updateById: makeBaseMswHandler({ method: "patch", url: `${BASE_URL}/:id` }),
  syncById: makeBaseMswHandler({ method: "post", url: `${BASE_URL}/:id/sync` }),
});

export { makeProjectMswHandler };
