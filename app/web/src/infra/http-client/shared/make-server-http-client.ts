import axios from "axios";
import { cookies } from "next/headers";
import { config } from "@/infra/config/config";

export const makeServerHttpClient = async () => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  return axios.create({
    baseURL: config.service.baseUrl,
    headers: {
      Cookie: cookieHeader,
    },
    timeout: 10_000,
  });
};
