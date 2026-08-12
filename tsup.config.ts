import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    raw: "src/raw.ts",
    types: "src/types-entry.ts",
    enums: "src/enums-entry.ts",
    bundles: "src/bundles-entry.ts",
    taxes: "src/taxes-entry.ts"
  },
  format: ["esm", "cjs"],
  target: "node24",
  platform: "neutral",
  dts: false,
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
  minify: false,
  external: ["axios"],
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" };
  }
});
