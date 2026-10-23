import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: [
      { find: /^@\/(.*)/, replacement: path.resolve(import.meta.dirname, "./$1") },
      { find: "server-only", replacement: path.resolve(import.meta.dirname, "./tests/mocks/server-only.ts") },
    ],
  },
});
