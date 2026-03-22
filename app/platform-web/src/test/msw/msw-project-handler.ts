import { http, HttpResponse } from "msw";
import type { HttpEnvelope } from "@/lib/http/http-schema";
import type { Project } from "@/module/project/project-type";

const BASE_URL = "http://localhost:8000/api/v1/project";

const makeOkEnvelope = <T>(data: T): HttpEnvelope<T> => ({
  status: 200,
  code: "ok",
  message: "ok",
  data,
});

const makeProjectMswHandler = () => ({
  list: (projects: Project[]) =>
    http.get(BASE_URL, () =>
      HttpResponse.json(makeOkEnvelope(projects)),
    ),

  listError: (status = 500) =>
    http.get(BASE_URL, () =>
      HttpResponse.json(
        { status, code: "error", message: "Internal server error", data: null },
        { status },
      ),
    ),

  getById: (project: Project) =>
    http.get(`${BASE_URL}/:id`, () =>
      HttpResponse.json(makeOkEnvelope(project)),
    ),

  getByIdError: (status = 500) =>
    http.get(`${BASE_URL}/:id`, () =>
      HttpResponse.json(
        { status, code: "error", message: "Not found", data: null },
        { status },
      ),
    ),

  deleteById: () =>
    http.delete(`${BASE_URL}/:id`, () =>
      HttpResponse.json(makeOkEnvelope(undefined)),
    ),

  deleteByIdError: (status = 500) =>
    http.delete(`${BASE_URL}/:id`, () =>
      HttpResponse.json(
        { status, code: "error", message: "Failed to delete", data: null },
        { status },
      ),
    ),

  syncById: (project: Project) =>
    http.post(`${BASE_URL}/:id/sync`, () =>
      HttpResponse.json(makeOkEnvelope(project)),
    ),

  syncByIdError: (status = 500) =>
    http.post(`${BASE_URL}/:id/sync`, () =>
      HttpResponse.json(
        { status, code: "error", message: "Failed to sync", data: null },
        { status },
      ),
    ),

  create: (project: Project) =>
    http.post(BASE_URL, () =>
      HttpResponse.json(makeOkEnvelope(project)),
    ),

  updateById: () =>
    http.patch(`${BASE_URL}/:id`, () =>
      HttpResponse.json(makeOkEnvelope(undefined)),
    ),
});

export { makeProjectMswHandler };
