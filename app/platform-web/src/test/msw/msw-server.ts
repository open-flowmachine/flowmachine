import { setupServer } from "msw/node";

const mswServer = setupServer();

export { mswServer };
