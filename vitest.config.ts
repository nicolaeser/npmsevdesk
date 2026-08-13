import { defineConfig } from "vitest/config";

const suite = process.env.NPMSEVDESK_TEST_SUITE;

export default defineConfig({
  test: {
    include:
      suite === "live-read"
        ? ["test/read-only.live.ts"]
        : suite === "live-write"
          ? ["test/write.live.ts"]
          : ["test/**/*.test.ts"]
  }
});
