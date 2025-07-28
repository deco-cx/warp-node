/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Skip tests on Node.js versions that don't support Promise.withResolvers
    skipIf: () => {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      return majorVersion < 22;
    }
  },
  resolve: {
    alias: {
      "@": new URL("./", import.meta.url).pathname,
    },
  },
});
