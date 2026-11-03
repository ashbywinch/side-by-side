import { defineConfig, PluginOption } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import vue from "@vitejs/plugin-vue";
import * as path from "path";
import Components from "unplugin-vue-components/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
/** Shown in the ?debug=1 panel, so a stale bundle cannot be mistaken for a fix. */
const buildStamp = new Date().toISOString().slice(5, 16).replace("T", " ");

export default defineConfig({
  define: {
    __BUILD_STAMP__: JSON.stringify(buildStamp),
  },
  plugins: [
    vue(),
    nodePolyfills(), // for path
    tsconfigPaths(), // resolve aliases
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080,
  },
});
