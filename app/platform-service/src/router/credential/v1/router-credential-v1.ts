import Elysia from "elysia";
import type { Credential } from "@/module/credential/credential-model";
import {
  createCredential,
  deleteCredential,
  getCredential,
  listCredentials,
  updateCredential,
} from "@/module/credential/credential-service";
import type { CredentialResponseDto } from "@/router/credential/v1/router-credential-v1-dto";
import {
  deleteCredentialRequestParamsDtoSchema,
  patchCredentialRequestBodyDtoSchema,
  patchCredentialRequestParamsDtoSchema,
  postCredentialRequestBodyDtoSchema,
} from "@/router/credential/v1/router-credential-v1-dto";
import { routerAuthGuard } from "@/router/router-auth-guard";
import { errEnvelope, okEnvelope } from "@/shared/http/http-envelope";

const toDto = (credential: Credential) => {
  const base = {
    id: credential.id,
    createdAt: credential.createdAt,
    updatedAt: credential.updatedAt,
    name: credential.name,
    expiredAt: credential.expiredAt,
  };

  if (credential.type === "apiKey") {
    return { ...base, type: credential.type, apiKey: credential.apiKey } satisfies CredentialResponseDto;
  }

  return {
    ...base,
    type: credential.type,
    username: credential.username,
    password: credential.password,
  } satisfies CredentialResponseDto;
};

const credentialV1Router = new Elysia({ name: "credentialV1HttpRouter" })
  .use(routerAuthGuard)
  .group("/api/v1/credential", (r) =>
    r
      .post(
        "",
        async ({ body, tenant }) => {
          const result = await createCredential({
            ctx: { tenant },
            payload: body,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope({ data: { id: result.value.id } });
        },
        {
          body: postCredentialRequestBodyDtoSchema,
        },
      )
      .get("", async ({ tenant }) => {
        const result = await listCredentials({
          ctx: { tenant },
        });
        if (result.isErr()) {
          return errEnvelope(result.error);
        }
        return okEnvelope({
          data: result.value.data.map(toDto),
        });
      })
      .get(
        "/:id",
        async ({ tenant, params }) => {
          const result = await getCredential({
            ctx: { tenant },
            id: params.id,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope({ data: toDto(result.value.data) });
        },
        {
          params: patchCredentialRequestParamsDtoSchema,
        },
      )
      .patch(
        "/:id",
        async ({ body, tenant, params }) => {
          const result = await updateCredential({
            ctx: { tenant },
            id: params.id,
            data: body,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope();
        },
        {
          body: patchCredentialRequestBodyDtoSchema,
          params: patchCredentialRequestParamsDtoSchema,
        },
      )
      .delete(
        "/:id",
        async ({ tenant, params }) => {
          const result = await deleteCredential({
            ctx: { tenant },
            id: params.id,
          });
          if (result.isErr()) {
            return errEnvelope(result.error);
          }
          return okEnvelope();
        },
        {
          params: deleteCredentialRequestParamsDtoSchema,
        },
      ),
  );

export { credentialV1Router };
