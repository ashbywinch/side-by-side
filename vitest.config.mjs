import path from "path";
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [vue(), tsconfigPaths()],

  test: {
    setupFiles: ["./test/setup.ts"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    include: ["test/test.*.ts"],
    watch: false,
    coverage: {
      provider: "istanbul",
      reporter: ["text", "clover"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "test/**",
        "**/*.d.ts",
      ],
      thresholds: {
        lines: 78,
        statements: 80,
        functions: 77,
        branches: 63,
      },
    },
    environment: "happy-dom",
  },
});
