import type { Result } from "@/domain/shared/result";

import type { ApplicationError } from "@/application/shared/errors";

type UnitOfWorkPort = {
  run<T>(
    fn: () => Promise<Result<T, ApplicationError>>,
  ): Promise<Result<T, ApplicationError>>;
};

export type { UnitOfWorkPort };
