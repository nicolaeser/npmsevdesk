export { AxiosTransport, operationCatalog, type OperationId } from "./client/index.js";
export * from "./resources/index.js";
export { createRawResources, type RawResources } from "./resources/registry.js";
export type { operations, paths, components } from "./types/openapi.js";
export type {
  PreparedRequest,
  RawBinaryUpload,
  RequestBodyFor,
  RequestFor,
  ResponseJsonFor,
  ResultFor,
  SuccessStatusFor,
  TransportBodyFor
} from "./types/operation.js";
