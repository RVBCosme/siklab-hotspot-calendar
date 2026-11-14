// After `observable build`: mark every page as English (<html lang="en">) for screen readers, and allow pinch zoom
// (Observable Framework 1.13.4 writes a bare <html> tag and a viewport tag with maximum-scale=1, and has no option for either).
// Written with AI assistance (Claude Code, Anthropic) during NASA Space Apps 2026, 14 Nov 2026; see README.
import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "dist");
let n = 0;
for (const f of fs.readdirSync(DIST).filter((f) => f.endsWith(".html"))) {
  const p = path.join(DIST, f);
  const s = fs.readFileSync(p, "utf8");
  const t = s.replace("<html>", '<html lang="en">').replace(", maximum-scale=1", "");
  if (t !== s) { fs.writeFileSync(p, t); n++; }
}
console.log(`set lang="en" and allowed zoom on ${n} page(s)`);
