import type { FileEnvelope } from "../types/result.js";

export function normalizeFileEnvelope(value: unknown): FileEnvelope {
  const root = isRecord(value) && isRecord(value.objects) ? value.objects : value;
  if (!isRecord(root)) return { base64Encoded: false };
  const base64Marker = root.base64Encoded ?? root.base64encoded;
  return {
    ...(typeof root.filename === "string" ? { filename: root.filename } : {}),
    ...(typeof (root.mimeType ?? root.mimetype) === "string"
      ? { mimeType: String(root.mimeType ?? root.mimetype) }
      : {}),
    base64Encoded: base64Marker === true || base64Marker === "true",
    ...(typeof root.content === "string" || root.content === null ? { content: root.content } : {})
  };
}

export function decodeBase64(content: string): Uint8Array {
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(content, "base64"));
  const binary = globalThis.atob(content);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function fileEnvelopeBytes(value: unknown): Uint8Array {
  const envelope = normalizeFileEnvelope(value);
  if (envelope.content === undefined || envelope.content === null) {
    throw new TypeError("The sevdesk response does not contain file content.");
  }
  return envelope.base64Encoded
    ? decodeBase64(envelope.content)
    : new TextEncoder().encode(envelope.content);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
