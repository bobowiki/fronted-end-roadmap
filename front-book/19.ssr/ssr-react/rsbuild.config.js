import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      client: "./src/client.jsx",
    },
  },
  output: {
    distPath: {
      root: "./dist/client",
    },
  },
});
