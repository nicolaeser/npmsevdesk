import { describe, expect, it } from "vitest";
import { fileEnvelopeBytes } from "../src/utils/files.js";

describe("file response helpers", () => {
  it("preserves valid empty file content", () => {
    expect(fileEnvelopeBytes({ content: "", base64Encoded: false })).toEqual(new Uint8Array());
    expect(fileEnvelopeBytes({ content: "", base64Encoded: true })).toEqual(new Uint8Array());
  });
  it("distinguishes missing content from an empty file", () => {
    expect(() => fileEnvelopeBytes({ base64Encoded: false })).toThrow(
      "does not contain file content"
    );
    expect(() => fileEnvelopeBytes({ content: null, base64Encoded: false })).toThrow(
      "does not contain file content"
    );
  });
});
