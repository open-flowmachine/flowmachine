import { err, type Result } from "neverthrow";

import { Err } from "@/shared/err/err";
import { safeFnSync } from "@/shared/err/err-util";
import { validate } from "@/shared/schema/schema-validation";
import { type Tenant, tenantSchema } from "@/shared/tenant/tenant-model";

const encodeTenant = (tenant: Tenant): string =>
  encodeURIComponent(`${tenant.type}:${tenant.id}`);

const decodeTenant = (encoded: string): Result<Tenant, Err> => {
  const decodedResult = safeFnSync(
    () => decodeURIComponent(encoded),
    () => Err.code("badRequest", { message: "Invalid tenant encoding" }),
  );
  if (decodedResult.isErr()) {
    return err(decodedResult.error);
  }
  const decoded = decodedResult.value;

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) {
    return err(Err.code("badRequest", { message: "Invalid tenant encoding" }));
  }

  const candidate = {
    type: decoded.slice(0, separatorIndex),
    id: decoded.slice(separatorIndex + 1),
  };

  return validate(tenantSchema, candidate).mapErr(() =>
    Err.code("badRequest", { message: "Invalid tenant data" }),
  );
};

export { encodeTenant, decodeTenant };
