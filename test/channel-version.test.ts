import { describe, expect, it } from "vitest";
import { developmentVersion, replaceLeadingVersions } from "../.github/scripts/channel-version.mjs";

const sha = "7c05bd0337f7a51dbc8274891aa778d7d19c7384";

describe("development channel version", () => {
  it("builds a date prerelease without the package.json release number", () => {
    expect(developmentVersion("2026-10-25", sha)).toBe("2026.10.25-vdev.7c05bd0");
    expect(developmentVersion("2026-01-05", sha)).toBe("2026.1.5-vdev.7c05bd0");
    expect(developmentVersion("2026-10-25", sha)).not.toContain("0.4.0");
  });
  it("keeps an all-digit sha from becoming a zero-padded numeric identifier", () => {
    expect(developmentVersion("2026-10-25", "0123456789abcdef0123456789abcdef01234567")).toBe(
      "2026.10.25-vdev.s0123456"
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
    const stamped = replaceLeadingVersions(source, "0.4.0", "2026.10.25-vdev.7c05bd0", 2);
    expect(stamped).toContain('"asynckit": { "version": "0.4.0" }');
    expect(stamped.match(/2026\.10\.25-vdev\.7c05bd0/g)).toHaveLength(2);
  });
});
