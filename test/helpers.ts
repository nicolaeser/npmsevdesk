import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from "axios";

export function jsonResponse<T>(
  config: InternalAxiosRequestConfig,
  data: T,
  status = 200
): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status >= 200 && status < 300 ? "OK" : "Error",
    headers: new AxiosHeaders(),
    config,
    request: {}
  };
}

export function responseError(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown
): AxiosError {
  const response = jsonResponse(config, data, status);
  return new AxiosError(
    `Request failed with status code ${status}`,
    AxiosError.ERR_BAD_RESPONSE,
    config,
    {},
    response
  );
}

export function adapter(
  handler: (config: InternalAxiosRequestConfig) => AxiosResponse | Promise<AxiosResponse>
): AxiosAdapter {
  return async (config) => handler(config);
}

export function requestJson(config: InternalAxiosRequestConfig): unknown {
  if (typeof config.data === "string") return JSON.parse(config.data) as unknown;
  return config.data;
}
