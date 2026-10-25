import { describe, expect, it } from "vitest";
import {
  developmentDistTag,
  developmentVersion,
  replaceLeadingVersions
} from "../.github/scripts/channel-version.mjs";

const sha = "7c05bd0337f7a51dbc8274891aa778d7d19c7384";

describe("development channel version", () => {
  it("builds a vdev prerelease from the stable version, commit date, and sha", () => {
    expect(developmentVersion("0.4.0", "2026-10-25", sha)).toBe("0.4.0-vdev.2026.10.25.7c05bd0");
    expect(developmentVersion("0.4.0", "2026-01-05", sha)).toBe("0.4.0-vdev.2026.1.5.7c05bd0");
    expect(developmentDistTag(sha)).toBe("dev-7c05bd0");
  });
  it("keeps an all-digit sha from becoming a zero-padded numeric identifier", () => {
    expect(developmentVersion("0.4.0", "2026-10-25", "0123456789abcdef0123456789abcdef01234567")).toBe(
      "0.4.0-vdev.2026.10.25.s0123456"
    );
  });
  it("replaces only the leading package versions", () => {
    const source = [
      '{',
      '  "version": "0.4.0",',
      '  "packages": {',
      '    "": { "version": "0.4.0" },',
      '    "asynckit": { "version": "0.4.0" }',
      "  }",
      "}",
      ""
    ].join("\n");
    expect(replaceLeadingVersions(source, "0.4.0", "0.4.0-vdev.2026.10.25.7c05bd0", 2)).toContain(
      '"asynckit": { "version": "0.4.0" }'
    );
    expect(replaceLeadingVersions(source, "0.4.0", "0.4.0-vdev.2026.10.25.7c05bd0", 2).match(/vdev/g)).toHaveLength(2);
  });
});
