// Track A: fetch 2026 VIIRS and MODIS hotspots for the Philippines from the NASA FIRMS area API.
// Needs FIRMS_MAP_KEY in .env (git-ignored). The key is never printed or written anywhere else.
// Run: node pipeline/fetch-2026.mjs
// Written with an AI assistant (Claude Code) during the hackathon, 14 Nov 2026; see README.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const OUT = path.join(ROOT, "data", "raw", "firms_api");
fs.mkdirSync(OUT, { recursive: true });

const env = fs.existsSync(path.join(ROOT, ".env")) ? fs.readFileSync(path.join(ROOT, ".env"), "utf8") : "";
const KEY = (env.match(/^\s*FIRMS_MAP_KEY\s*=\s*([^\s#]+)/m) || [])[1];
if (!KEY) { console.error("No FIRMS_MAP_KEY in .env. Add the line FIRMS_MAP_KEY=<your key> and run again."); process.exit(1); }

const BASE = "https://firms.modaps.eosdis.nasa.gov/api";
const BBOX = "116,4,127,21.5"; // west,south,east,north around the Philippines; points outside Philippine regions are dropped later
const START = "2026-01-01";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const addDays = (d, n) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
// Fetch up to yesterday (UTC): today is never a complete day.
const lastDay = addDays(new Date().toISOString().slice(0, 10), -1);
const SNPP_END = "2026-11-02"; // Suomi NPP delivery ceased at 13:00 UTC on 2 Nov 2026 (NASA Earthdata alert); build-data.mjs uses it to 1 Nov

async function get(url, label) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const r = await fetch(url);
      const t = await r.text();
      if (r.ok) return t;
      console.error(`${label}: HTTP ${r.status} (attempt ${attempt})`);
    } catch (e) {
      console.error(`${label}: ${e.message} (attempt ${attempt})`);
    }
    await sleep(3000 * attempt);
  }
  throw new Error(`${label}: failed after retries`);
}

// 1. What dates does each source cover?
const avail = await get(`${BASE}/data_availability/csv/${KEY}/ALL`, "data_availability");
if (!/^data_id/i.test(avail.trim())) { console.error("Unexpected answer from data_availability (is the key valid?):", avail.slice(0, 120).replace(KEY, "<key>")); process.exit(1); }
const range = Object.fromEntries(avail.trim().split(/\r?\n/).slice(1).map((l) => { const [id, min, max] = l.split(","); return [id, { min, max }]; }));
for (const id of ["VIIRS_SNPP_SP", "VIIRS_SNPP_NRT", "VIIRS_NOAA20_SP", "VIIRS_NOAA20_NRT", "MODIS_SP", "MODIS_NRT"]) console.log(id, range[id] ? `${range[id].min} .. ${range[id].max}` : "not listed");

// 2. Plan: standard quality (SP) where it exists, near real time (NRT) after it, with no overlap.
function plan(spId, nrtId, end) {
  const spMax = range[spId]?.max && range[spId].max >= START ? range[spId].max : addDays(START, -1);
  const out = [];
  for (let d = START; d <= end && d <= spMax; d = addDays(d, 5)) out.push({ source: spId, date: d, days: Math.min(5, 1 + (new Date((spMax < end ? spMax : end) + "T00:00:00Z") - new Date(d + "T00:00:00Z")) / 864e5) });
  for (let d = addDays(spMax, 1); d <= end; d = addDays(d, 5)) out.push({ source: nrtId, date: d, days: Math.min(5, 1 + (new Date(end + "T00:00:00Z") - new Date(d + "T00:00:00Z")) / 864e5) });
  return out;
}
const jobs = [...plan("VIIRS_SNPP_SP", "VIIRS_SNPP_NRT", SNPP_END < lastDay ? SNPP_END : lastDay), ...plan("VIIRS_NOAA20_SP", "VIIRS_NOAA20_NRT", lastDay), ...plan("MODIS_SP", "MODIS_NRT", lastDay)];
console.log(`${jobs.length} requests`);

// 3. Fetch, one file per request; skip standard-quality files already fetched (re-runs are cheap).
// Near-real-time files are always fetched again, and once NASA publishes standard quality for those days the plan
// no longer asks for them: remove the old ones first, so no day is read twice.
for (const f of fs.readdirSync(OUT)) if (f.includes("_NRT_")) fs.unlinkSync(path.join(OUT, f));
let rows = 0;
for (const j of jobs) {
  const file = path.join(OUT, `${j.source}_${j.date}_${j.days}d.csv`);
  if (fs.existsSync(file) && !j.source.endsWith("_NRT")) { rows += fs.readFileSync(file, "utf8").split("\n").length - 2; continue; }
  const t = await get(`${BASE}/area/csv/${KEY}/${j.source}/${BBOX}/${j.days}/${j.date}`, `${j.source} ${j.date}`);
  if (!/^latitude/i.test(t.trim())) { console.error(`${j.source} ${j.date}: unexpected answer:`, t.slice(0, 120).replace(KEY, "<key>")); process.exit(1); }
  fs.writeFileSync(file, t);
  const n = t.trim().split(/\r?\n/).length - 1;
  rows += n;
  process.stdout.write(`${j.source} ${j.date} +${j.days}d: ${n}\n`);
  await sleep(400);
}
console.log(`done: ${rows} rows in ${OUT}`);
