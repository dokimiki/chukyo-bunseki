import { defineConfig } from "vitest/config";
import { URL } from "url";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "tests/**/*.{test,spec}.{js,ts}",
      "apps/**/*.{test,spec}.{js,ts}",
    ],
    exclude: ["node_modules", "dist", "target", "tests/**/*.spec.ts"], // Playwrightテストを除外
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/", "**/*.d.ts"],
    },
  },
  resolve: {
    alias: {
      "@shared": new URL("./packages/shared/src", import.meta.url).pathname,
      "@ui": new URL("./packages/ui-components/src", import.meta.url).pathname,
    },
  },
});
