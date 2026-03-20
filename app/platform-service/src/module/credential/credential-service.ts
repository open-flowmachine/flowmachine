import { err, ok } from "neverthrow";
import { credentialRepository } from "@/module/credential/credential-repository";
import { Err } from "@/shared/err/err";
import { newModel } from "@/shared/model/model";
import type { Id } from "@/shared/model/model-id";
import type { Tenant } from "@/shared/model/model-tenant";

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
  ctx: { tenant: Tenant };
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

const getCredential = async (input: { ctx: { tenant: Tenant }; id: Id }) => {
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

const listCredentials = async (input: { ctx: { tenant: Tenant } }) => {
  const { ctx } = input;

  return credentialRepository.findMany({ ctx });
};

const updateCredential = async (input: {
  ctx: { tenant: Tenant };
  id: Id;
  data: Partial<CredentialPayload>;
}) => {
  const { ctx, id, data } = input;

  const findResult = await credentialRepository.findById({ ctx, id });

  if (findResult.isErr()) {
    return err(findResult.error);
  }
  if (!findResult.value.data) {
    return err(Err.code("notFound"));
  }

  return credentialRepository.update({ ctx, id, data });
};

const deleteCredential = async (input: {
  ctx: { tenant: Tenant };
  id: Id;
}) => {
  const { ctx, id } = input;

  return credentialRepository.deleteById({ ctx, id });
};

export {
  createCredential,
  getCredential,
  listCredentials,
  updateCredential,
  deleteCredential,
};
