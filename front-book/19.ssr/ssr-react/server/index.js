import express from "express";
import path from "path";
import { render } from "../dist/server/server.js";

const app = express();

app.use(express.static(path.join(process.cwd(), "dist/client")));

app.get("*", (req, res) => {
  const html = render();
  res.send(html);
});

app.listen(3000, () => {
  console.log("SSR server running at http://localhost:3000");
});
