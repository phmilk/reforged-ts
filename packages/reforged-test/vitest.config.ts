import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // The vitest project under test/fixtures is run by map.test.ts, not here.
    exclude: ["test/fixtures/**"],
    environment: "node",
    globalSetup: ["test/support/compile-runner.ts"],
  },
});
