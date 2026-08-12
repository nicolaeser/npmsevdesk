import type { AxiosResponse } from "axios";

export type PrimaryData<TJson> = TJson extends { objects?: unknown } ? TJson["objects"] : TJson;

export type SevdeskAxiosResponse<TData = unknown, TRequestBody = unknown> = Omit<
  AxiosResponse<TData, TRequestBody>,
  "request"
> & {
  readonly request?: never;
};

export interface ResponseMetadata {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly requestId?: string;
}

export interface PaginationMetadata {
  readonly limit?: number;
  readonly offset: number;
  readonly total?: number;
  readonly returned: number;
  readonly nextOffset?: number;
  readonly hasMore?: boolean;
}

export interface SevdeskResult<TJson, TData = PrimaryData<TJson>, TRequestBody = unknown> {
  readonly data: TData;
  readonly objects: PrimaryData<TJson>;
  readonly json: TJson;
  readonly raw: SevdeskAxiosResponse<TJson, TRequestBody>;
  readonly response: ResponseMetadata;
  readonly pagination?: PaginationMetadata;
  toJSON(): TJson;
}

export interface FileEnvelope {
  readonly filename?: string;
  readonly mimeType?: string;
  readonly base64Encoded: boolean;
  readonly content?: string | null;
}
