import type { InternalAxiosRequestConfig } from "axios";
import axios from "axios";
import { useMemo } from "react";
import { getEnv } from "@/lib/env/env";

export const useUnprotectedHttpClient = () => {
  return useMemo(() => {
    const instance = axios.create({
      baseURL: getEnv().NEXT_PUBLIC_SERVICE_BASE_URL,
      timeout: 10 * 1000,
    });

    instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    return instance;
  }, []);
};
