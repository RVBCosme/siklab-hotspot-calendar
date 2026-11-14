// After `observable build`: mark every page as English (<html lang="en">) for screen readers.
// Observable Framework 1.13.4 writes a bare <html> tag and has no option for it.
import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "dist");
let n = 0;
for (const f of fs.readdirSync(DIST).filter((f) => f.endsWith(".html"))) {
  const p = path.join(DIST, f);
  const s = fs.readFileSync(p, "utf8");
  if (s.includes("<html>")) { fs.writeFileSync(p, s.replace("<html>", '<html lang="en">')); n++; }
}
console.log(`set lang="en" on ${n} page(s)`);
