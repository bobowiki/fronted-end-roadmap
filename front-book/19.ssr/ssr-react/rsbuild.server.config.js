import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [pluginReact()],
  target: "node",
  source: {
    entry: {
      server: "./src/server.jsx",
    },
  },
  output: {
    distPath: {
      root: "./dist/server",
      js: ".",
    },
    filenameHash: false,
    cleanDistPath: false,
    library: {
      type: "module", // ✅ 输出 ESM
      name: "serverBundle",
    },
  },
  tools: {
    rspack: {
      // ⚠️ ESM 下 splitChunks 默认不会拆分 Node 端入口
      optimization: {
        splitChunks: false,
      },
    },
  },
});
