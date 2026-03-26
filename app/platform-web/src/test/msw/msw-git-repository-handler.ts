import { getEnv } from "@/lib/env/env";
import type { GitRepository } from "@/module/git-repository/git-repository-type";
import { makeBaseMswHandler } from "@/test/msw/msw-util";

const BASE_URL = `${getEnv().NEXT_PUBLIC_SERVICE_BASE_URL}/api/v1/git-repository`;

const makeGitRepositoryMswHandler = () => ({
  list: makeBaseMswHandler<GitRepository[]>({ method: "get", url: BASE_URL }),
  getById: makeBaseMswHandler<GitRepository>({
    method: "get",
    url: `${BASE_URL}/:id`,
  }),
  deleteById: makeBaseMswHandler({ method: "delete", url: `${BASE_URL}/:id` }),
  create: makeBaseMswHandler({ method: "post", url: BASE_URL }),
  updateById: makeBaseMswHandler({ method: "patch", url: `${BASE_URL}/:id` }),
});

export { makeGitRepositoryMswHandler };
