import { Elysia } from "elysia";
import { projectV1Router } from "@/router/project/v1/router-project-v1";

const app = new Elysia().use(projectV1Router);

app.listen(8000);
