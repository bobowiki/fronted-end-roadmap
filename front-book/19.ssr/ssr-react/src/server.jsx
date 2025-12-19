import React from "react";
import { renderToString } from "react-dom/server";
import App from "./App";

export function render() {
  const html = renderToString(<App />);
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Rsbuild SSR Demo</title>
    </head>
    <body>
      <div id="root">${html}</div>
      <script src="/client.js"></script>
    </body>
  </html>`;
}
