import { Daytona } from "@daytonaio/sdk";

const daytonaClient = new Daytona({
  apiKey: process.env.DAYTONA_API_KEY,
});

export { daytonaClient };
