import axios from "axios";
import { useMemo } from "react";
import { getEnv } from "@/lib/env/env";

export const useProtectedHttpClient = () => {
  return useMemo(() => {
    return axios.create({
      baseURL: getEnv().NEXT_PUBLIC_SERVICE_BASE_URL,
      timeout: 10 * 1000,
      withCredentials: true, // Send cookies with requests
    });
  }, []);
};
