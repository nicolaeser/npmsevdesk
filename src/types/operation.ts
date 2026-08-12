import type { AxiosRequestConfig } from "axios";
import type { RequestOptions } from "./config.js";
import type { operations } from "./openapi.js";
import type { PrimaryData, SevdeskResult } from "./result.js";

export interface QueryParameterDefinition {
  readonly name: string;
  readonly style: string;
  readonly explode: boolean;
  readonly array: boolean;
}

export interface OperationDefinition<TOperationId extends keyof operations = keyof operations> {
  readonly operationId: TOperationId;
  readonly method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  readonly path: string;
  readonly tag: string;
  readonly requestContentType: string | null;
  readonly responseContentType: string | null;
  readonly retrySafe: boolean;
  readonly deprecated: boolean;
  readonly query: readonly QueryParameterDefinition[];
}

export type QueryPrimitive = string | number | boolean | bigint | Date | null;
export type QueryValue =
  QueryPrimitive | readonly QueryValue[] | { readonly [key: string]: QueryValue | undefined };
export type ExtraQuery = Readonly<Record<string, QueryValue | undefined>>;

type ParametersOf<TOperation> = TOperation extends { parameters: infer TParameters }
  ? TParameters
  : Record<string, never>;

type NonNever<T> = [T] extends [never] ? never : Exclude<T, undefined>;

type ParameterPart<
  TParameters,
  TKey extends PropertyKey,
  TAlias extends PropertyKey
> = TKey extends keyof TParameters
  ? [NonNever<TParameters[TKey]>] extends [never]
    ? Record<never, never>
    : Record<never, never> extends Pick<TParameters, TKey>
      ? { readonly [TProperty in TAlias]?: NonNever<TParameters[TKey]> }
      : { readonly [TProperty in TAlias]: NonNever<TParameters[TKey]> }
  : Record<never, never>;

type DeclaredRequestBodyOf<TOperation> = TOperation extends {
  requestBody?: infer TRequestBody;
}
  ? NonNever<TRequestBody> extends { content: infer TContent }
    ? {
        [TMediaType in keyof TContent]: TMediaType extends "multipart/form-data"
          ? FormData | MultipartBody<TContent[TMediaType]>
          : TContent[TMediaType];
      }[keyof TContent]
    : never
  : never;

export type RawBinaryUpload = Blob | ArrayBuffer | Uint8Array;

type MultipartBody<TBody> = TBody extends { file: unknown }
  ? Omit<TBody, "file"> & { readonly file: RawBinaryUpload }
  : TBody;

export type RequestBodyFor<TOperation> = DeclaredRequestBodyOf<TOperation>;

export type TransportBodyFor<TOperation> = [RequestBodyFor<TOperation>] extends [never]
  ? undefined
  : RequestBodyFor<TOperation>;

type BodyPart<TOperation> = [RequestBodyFor<TOperation>] extends [never]
  ? Record<never, never>
  : TOperation extends { requestBody: unknown }
    ? { body: RequestBodyFor<TOperation> }
    : { body?: RequestBodyFor<TOperation> };

export type RequestFor<TOperation> = ParameterPart<ParametersOf<TOperation>, "path", "path"> &
  ParameterPart<ParametersOf<TOperation>, "query", "query"> &
  ParameterPart<ParametersOf<TOperation>, "header", "headers"> &
  BodyPart<TOperation> & {
    readonly extraQuery?: ExtraQuery;
    readonly options?: RequestOptions;
  };

type ResponsesOf<TOperation> = TOperation extends { responses: infer TResponses }
  ? TResponses
  : never;

type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

type SuccessKey<TResponses> = {
  [TStatus in keyof TResponses]: TStatus extends string | number
    ? `${TStatus}` extends `2${Digit}${Digit}`
      ? TStatus
      : never
    : never;
}[keyof TResponses];

export type SuccessStatusFor<TOperation> = SuccessKey<ResponsesOf<TOperation>>;

type SuccessResponseOf<TOperation> = ResponsesOf<TOperation>[SuccessKey<ResponsesOf<TOperation>>];

type ResponseContent<TResponse> = TResponse extends { content: infer TContent }
  ? [TContent] extends [never]
    ? undefined
    : TContent extends object
      ? TContent[keyof TContent]
      : undefined
  : undefined;

export type ResponseJsonFor<TOperation> =
  SuccessResponseOf<TOperation> extends infer TResponse ? ResponseContent<TResponse> : never;

export type ResultFor<TOperation> = SevdeskResult<
  ResponseJsonFor<TOperation>,
  PrimaryData<ResponseJsonFor<TOperation>>,
  TransportBodyFor<TOperation>
>;

export interface OperationExecutor {
  execute<TOperationId extends keyof operations>(
    operationId: TOperationId,
    request: RequestFor<operations[TOperationId]>
  ): Promise<ResultFor<operations[TOperationId]>>;
}

export interface PreparedRequest<TBody = unknown, TOperationId extends string = string> {
  readonly operationId: TOperationId;
  readonly method: string;
  readonly path: string;
  readonly url: string;
  readonly queryString: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body?: TBody;
  readonly axios: AxiosRequestConfig<[TBody] extends [never] ? undefined : TBody>;
}
