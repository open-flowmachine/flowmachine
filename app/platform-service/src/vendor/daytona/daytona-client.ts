import { Daytona } from "@daytonaio/sdk";
import { getEnv } from "@/vendor/env/env";

const daytonaClient = new Daytona({
  apiKey: getEnv().DAYTONA_API_KEY,
});

export { daytonaClient };
