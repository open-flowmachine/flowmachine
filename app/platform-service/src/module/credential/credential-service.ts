import { merge } from "es-toolkit";
import { err, ok } from "neverthrow";

import type { Credential } from "@/module/credential/credential-model";
import type { Id } from "@/shared/model/model-id";
import type { TenantAware } from "@/shared/tenant/tenant-model";

import { credentialRepository } from "@/module/credential/credential-repository";
import { Err } from "@/shared/err/err";
import { type ExcludedUpdateModelFields, newModel } from "@/shared/model/model";

type CredentialPayload =
  | { type: "apiKey"; name: string; apiKey: string; expiredAt: Date }
  | {
      type: "basic";
      name: string;
      username: string;
      password: string;
      expiredAt: Date;
    };

const createCredential = async (input: {
  ctx: TenantAware;
  payload: CredentialPayload;
}) => {
  const { ctx, payload } = input;

  const model = newModel(payload);
  const result = await credentialRepository.insert({
    ctx,
    data: model,
  });

  if (result.isErr()) {
    return err(result.error);
  }
  return ok({ id: model.id });
};

const getCredential = async (input: { ctx: TenantAware; id: Id }) => {
  const { ctx, id } = input;

  const result = await credentialRepository.findById({ ctx, id });

  if (result.isErr()) {
    return err(result.error);
  }
  if (!result.value.data) {
    return err(Err.code("notFound"));
  }

  return ok({ data: result.value.data });
};

const listCredentials = async (input: { ctx: TenantAware }) => {
  const { ctx } = input;

  return credentialRepository.findMany({ ctx });
};

const updateCredential = async (input: {
  ctx: TenantAware;
  id: Id;
  data: ExactPartial<Omit<Credential, ExcludedUpdateModelFields>>;
}) => {
  const { ctx, id, data: partialUpdatedData } = input;

  const findResult = await credentialRepository.findById({ ctx, id });

  if (findResult.isErr()) {
    return err(findResult.error);
  }
  if (!findResult.value.data) {
    return err(Err.code("notFound"));
  }
  const currentData = findResult.value.data;

  return credentialRepository.update({
    ctx,
    id,
    data: merge(currentData, partialUpdatedData),
    expectedVersion: findResult.value.data._version,
  });
};

const deleteCredential = async (input: { ctx: TenantAware; id: Id }) => {
  const { ctx, id } = input;

  return credentialRepository.deleteById({ ctx, id });
};

const makeCredentialService = () => ({
  create: createCredential,
  get: getCredential,
  list: listCredentials,
  update: updateCredential,
  delete: deleteCredential,
});

export { makeCredentialService };
