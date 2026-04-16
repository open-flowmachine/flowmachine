import type { Brand } from "@/domain/shared/id";

type TenantId = Brand<string, "TenantId">;
const TenantId = (value: string): TenantId => value as TenantId;

const tenantTypes = ["organization", "user"] as const;
type TenantType = (typeof tenantTypes)[number];

type Tenant = {
  readonly id: TenantId;
  readonly type: TenantType;
};

const tenantEquals = (a: Tenant, b: Tenant): boolean =>
  a.id === b.id && a.type === b.type;

export { TenantId, tenantTypes, tenantEquals };
export type { Tenant, TenantType };
