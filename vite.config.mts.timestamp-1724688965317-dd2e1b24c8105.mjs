// vite.config.mts
import { defineConfig } from "file:///C:/Code/side-by-side/node_modules/vite/dist/node/index.js";
import { nodePolyfills } from "file:///C:/Code/side-by-side/node_modules/vite-plugin-node-polyfills/dist/index.js";
import vue from "file:///C:/Code/side-by-side/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import * as path from "path";
import Components from "file:///C:/Code/side-by-side/node_modules/unplugin-vue-components/dist/vite.js";
import { BootstrapVueNextResolver } from "file:///C:/Code/side-by-side/node_modules/bootstrap-vue-next/dist/bootstrap-vue-next.mjs";
import tsconfigPaths from "file:///C:/Code/side-by-side/node_modules/vite-tsconfig-paths/dist/index.js";
var __vite_injected_original_dirname = "C:\\Code\\side-by-side";
var vite_config_default = defineConfig({
  plugins: [
    vue(),
    nodePolyfills(),
    // for path
    tsconfigPaths(),
    // resolve aliases
    Components({
      resolvers: [BootstrapVueNextResolver()]
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      "~bootstrap": path.resolve(__vite_injected_original_dirname, "node_modules/bootstrap")
    }
  },
  server: {
    port: 8080
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcQ29kZVxcXFxzaWRlLWJ5LXNpZGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXENvZGVcXFxcc2lkZS1ieS1zaWRlXFxcXHZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovQ29kZS9zaWRlLWJ5LXNpZGUvdml0ZS5jb25maWcubXRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBQbHVnaW5PcHRpb24gfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgeyBub2RlUG9seWZpbGxzIH0gZnJvbSBcInZpdGUtcGx1Z2luLW5vZGUtcG9seWZpbGxzXCI7XHJcbmltcG9ydCB2dWUgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXZ1ZVwiO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCBDb21wb25lbnRzIGZyb20gXCJ1bnBsdWdpbi12dWUtY29tcG9uZW50cy92aXRlXCI7XHJcbmltcG9ydCB7IEJvb3RzdHJhcFZ1ZU5leHRSZXNvbHZlciB9IGZyb20gXCJib290c3RyYXAtdnVlLW5leHRcIjtcclxuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSBcInZpdGUtdHNjb25maWctcGF0aHNcIjtcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW1xyXG4gICAgdnVlKCksXHJcbiAgICBub2RlUG9seWZpbGxzKCksIC8vIGZvciBwYXRoXHJcbiAgICB0c2NvbmZpZ1BhdGhzKCksIC8vIHJlc29sdmUgYWxpYXNlc1xyXG4gICAgQ29tcG9uZW50cyh7XHJcbiAgICAgIHJlc29sdmVyczogW0Jvb3RzdHJhcFZ1ZU5leHRSZXNvbHZlcigpXSxcclxuICAgIH0pLFxyXG4gIF0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICAgIFwifmJvb3RzdHJhcFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIm5vZGVfbW9kdWxlcy9ib290c3RyYXBcIiksXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwb3J0OiA4MDgwLFxyXG4gIH0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXNQLFNBQVMsb0JBQWtDO0FBQ2pTLFNBQVMscUJBQXFCO0FBQzlCLE9BQU8sU0FBUztBQUNoQixZQUFZLFVBQVU7QUFDdEIsT0FBTyxnQkFBZ0I7QUFDdkIsU0FBUyxnQ0FBZ0M7QUFDekMsT0FBTyxtQkFBbUI7QUFOMUIsSUFBTSxtQ0FBbUM7QUFTekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsSUFBSTtBQUFBLElBQ0osY0FBYztBQUFBO0FBQUEsSUFDZCxjQUFjO0FBQUE7QUFBQSxJQUNkLFdBQVc7QUFBQSxNQUNULFdBQVcsQ0FBQyx5QkFBeUIsQ0FBQztBQUFBLElBQ3hDLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFVLGFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3BDLGNBQW1CLGFBQVEsa0NBQVcsd0JBQXdCO0FBQUEsSUFDaEU7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
