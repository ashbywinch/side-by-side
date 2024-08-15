import path from "path";
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [vue(), tsconfigPaths()],

  test: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    include: ["test/test.*.js"],
    watch: false,
    coverage: {
      provider: "istanbul",
      reporter: ["text", "html"],
    },
  },
});
