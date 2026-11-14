// Serve the built site (dist/) on http://127.0.0.1:8123 for local checks. Node only, no dependencies.
// Written with AI assistance (Claude Code, Anthropic) during NASA Space Apps 2026, 14 Nov 2026; see README.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "dist");
const TYPES = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".csv": "text/csv", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2"};
http
  .createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p.endsWith("/")) p += "index";
    let f = path.join(DIST, p);
    if (!f.startsWith(DIST)) return res.writeHead(403).end();
    if (!path.extname(f) && fs.existsSync(f + ".html")) f += ".html";
    fs.readFile(f, (err, data) => {
      if (err) return res.writeHead(404).end("404");
      res.writeHead(200, {"content-type": TYPES[path.extname(f)] || "application/octet-stream"});
      res.end(data);
    });
  })
  .listen(8123, "127.0.0.1", () => console.log("serving dist on http://127.0.0.1:8123"));
