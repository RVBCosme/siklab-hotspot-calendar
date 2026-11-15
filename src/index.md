---
title: Calendar
---

<!-- Written with AI assistance (Claude Code, Anthropic) during NASA Space Apps 2026, 14 Nov 2026; see README. -->

<header class="band">
  <h1>Siklab hotspot calendar</h1>
  <p class="tagline">When and where the Philippines burns, and how El Niño years compare</p>
  <ul class="band-figures">
    <li><b>${elnino.areas.ph.ratio.toFixed(1)}×</b> <span>as many hotspots in El Niño fire seasons (${MONTHS[elnino.seasonMonths[0] - 1]}–${MONTHS[elnino.seasonMonths[elnino.seasonMonths.length - 1] - 1]}) as in other years: whole country, medians of ${elnino.years[0]}–${elnino.years[1]}</span></li>
    <li><b>${validation.T1_leaveOneYearOut_2012_2020.harmonised.annualMedianAbsPctError}%</b> <span>typical error of a region's yearly total, tested on years the conversion never saw</span></li>
    <li><b>${fmt(allMonths.length)}</b> <span>months of MODIS and VIIRS on one scale, ${monthName(allMonths[0])} to ${meta.lastDate.slice(8, 10).replace(/^0/, "")} ${monthName(meta.lastDate.slice(0, 7))}</span></li>
  </ul>
  ${seasonRibbon}
</header>

<details class="explain">
  <summary>Explain it simply: how to read this page, what a hotspot is, and why two kinds of satellite</summary>
  <p><b>How to read this page.</b></p>
  <ol class="how-to-read">
    <li>Pick a place: the whole country, a region, a province, or a box you draw on a map. You can also click a province on the map further down.</li>
    <li>Pick the months to look at with From and To.</li>
    <li>Read the colours. Each square in the calendar is one month; the darker it is, the more fire hotspots the satellites saw.</li>
  </ol>
  <p><b>What is a hotspot?</b> Satellites circle the Earth carrying cameras that sense heat. When a patch of ground is much hotter than the land around it, usually because something is burning, the satellite marks it. Each mark is a hotspot. One big fire can make many hotspots, and a fire under thick cloud makes none.</p>
  <p><b>Why two kinds of satellite?</b> An older camera called MODIS has marked hotspots since 2000. A newer, sharper one called VIIRS started in 2012. It notices smaller fires, so over the Philippines it marks about ${Math.round(meta.factors.ph.k)} hotspots for every one that MODIS marks. Put end to end, the two records would make it look as if fires jumped in 2012, when only the camera changed.</p>
  <p><b>What did we do about it?</b> For each region we counted how many VIIRS hotspots matched one MODIS hotspot in the years both cameras were watching (2012 to 2020), and used that number to convert the older years. Then we tested it on years the conversion never saw: a region's yearly total came out within about ${validation.T1_leaveOneYearOut_2012_2020.harmonised.annualMedianAbsPctError}% of what VIIRS recorded, in a typical case. That conversion is what "harmonised" means on this site.</p>
  <p><b>What it cannot tell you.</b> A hotspot count is not the number of fires or the area burned. Clouds hide fires, so rainy months read low. The calendar shows the past. The outlook further down is a range taken from past El Niño seasons, not a forecast model.</p>
</details>

```js
const areas = FileAttachment("data/areas.json").json();
const monthlyRaw = FileAttachment("data/monthly.csv").csv();
const meta = FileAttachment("data/meta.json").json();
const validation = FileAttachment("data/validation.json").json();
const provinceShapes = FileAttachment("data/provinces.json").json();
const elnino = FileAttachment("data/elnino.json").json();
const outlook = FileAttachment("data/outlook.json").json();
const seam = FileAttachment("data/seam.json").json();
const pointFiles = {
  "r-armm": FileAttachment("data/points/r-armm.csv"),
  "r-bicol-region": FileAttachment("data/points/r-bicol-region.csv"),
  "r-cagayan-valley": FileAttachment("data/points/r-cagayan-valley.csv"),
  "r-calabarzon": FileAttachment("data/points/r-calabarzon.csv"),
  "r-car": FileAttachment("data/points/r-car.csv"),
  "r-caraga": FileAttachment("data/points/r-caraga.csv"),
  "r-central-luzon": FileAttachment("data/points/r-central-luzon.csv"),
  "r-central-visayas": FileAttachment("data/points/r-central-visayas.csv"),
  "r-davao-region": FileAttachment("data/points/r-davao-region.csv"),
  "r-eastern-visayas": FileAttachment("data/points/r-eastern-visayas.csv"),
  "r-ilocos-region": FileAttachment("data/points/r-ilocos-region.csv"),
  "r-mimaropa": FileAttachment("data/points/r-mimaropa.csv"),
  "r-ncr": FileAttachment("data/points/r-ncr.csv"),
  "r-northern-mindanao": FileAttachment("data/points/r-northern-mindanao.csv"),
  "r-soccsksargen": FileAttachment("data/points/r-soccsksargen.csv"),
  "r-western-visayas": FileAttachment("data/points/r-western-visayas.csv"),
  "r-zamboanga-peninsula": FileAttachment("data/points/r-zamboanga-peninsula.csv")
};
```

```js
// Plot labels each layer of a chart (<g aria-label="cell">, "geo", "tip"), which axe flags and screen readers read out
// without meaning; each chart's own label and description carry its content, so the layer labels are removed.
const quiet = (node) => (node.querySelectorAll("g[aria-label]").forEach((g) => g.removeAttribute("aria-label")), node);
// Parse the monthly table once and index it by area.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthly = monthlyRaw.map((d) => ({
  area_id: d.area_id,
  month: d.month,
  year: +d.month.slice(0, 4),
  m: +d.month.slice(5, 7),
  hotspots: +d.hotspots_harmonised,
  source: d.source,
  gap_days: +d.gap_days,
  days: +d.days,
  modis_aqua: +d.modis_aqua,
  modis_terra: +d.modis_terra,
  viirs_snpp: +d.viirs_snpp,
  viirs_noaa20: +d.viirs_noaa20
}));
const byArea = d3.group(monthly, (d) => d.area_id);
const allMonths = [...new Set(monthly.map((d) => d.month))].sort();
const regionName = new Map(areas.map((a) => [a.id, a.name]));
const CUSTOM = {id: "custom", name: "Custom area", level: "custom"};
const areaOptions = [
  ...areas.filter((a) => a.level === "country"),
  CUSTOM,
  ...areas.filter((a) => a.level === "region").sort((a, b) => d3.ascending(a.name, b.name)),
  ...areas.filter((a) => a.level === "province").sort((a, b) => d3.ascending(a.name, b.name))
];
const label = (a) => (a.level === "custom" ? "Custom area: draw a box on the map or enter coordinates" : a.level === "province" ? `${a.name} (province, ${regionName.get(a.parent)})` : a.level === "region" ? `${a.name} (region)` : a.name);
// El Niño years (one list, from the pipeline): marked on the calendar's year labels and the yearly chart with a diamond, not by colour alone.
const EL_NINO = new Set(elnino.elNinoYears);
const NINO_MARK = "◆";
const ninoLegend = () => html`<p class="nino-legend"><span aria-hidden="true">${NINO_MARK}</span> El Niño year: January–March value of +0.5 or more on NOAA's Oceanic Niño Index (${elnino.elNinoYears.join(", ")}).</p>`;
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen"];
```

<div class="card controls">

```js
// The page address remembers the view (area, months, colours), so a link opens the same view.
const startParams = new URLSearchParams(location.hash.slice(1));
// A view link edited or pasted into this open tab reloads the page so the controls follow it (heading links are left alone).
addEventListener("hashchange", () => { if (new URLSearchParams(location.hash.slice(1)).has("area")) location.reload(); });
const startMonth = (key, fallback) => (allMonths.includes(startParams.get(key)) ? startParams.get(key) : fallback);
const COLOUR_OPTIONS = ["Number of hotspots", "Difference from the average for that month"];
const areaInput = Inputs.select(areaOptions, {label: "Area", format: label, value: areaOptions.find((a) => a.id === startParams.get("area")) ?? areaOptions[0]});
const area = view(areaInput);
const fromMonth = view(Inputs.select(allMonths, {label: "From", value: startMonth("from", allMonths[0])}));
const toMonth = view(Inputs.select(allMonths, {label: "To", value: startMonth("to", allMonths[allMonths.length - 1])}));
const colourBy = view(Inputs.radio(COLOUR_OPTIONS, {label: "Colour by", value: COLOUR_OPTIONS[startParams.get("colour") === "difference" ? 1 : 0]}));
const ramp = view(Inputs.select(new Map([["Yellow–orange–red (ColorBrewer, colour-blind safe)", "ylorrd"], ["Viridis (colour-blind safe)", "viridis"]]), {label: "Colour ramp", value: startParams.get("ramp") === "viridis" ? "viridis" : "ylorrd"}));
// Choosing a province on the map or in the list sets the Area control, then shows that province's calendar.
function selectArea(id) {
  const next = areaOptions.find((a) => a.id === id);
  if (!next) return;
  if (next !== areaInput.value) {
    areaInput.value = next;
    areaInput.dispatchEvent(new Event("input", {bubbles: true}));
  }
  // Move focus to the calendar heading too, so keyboard and screen-reader users land on the new calendar.
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  requestAnimationFrame(() => {
    const heading = document.getElementById("calendar");
    heading?.scrollIntoView({behavior: reduceMotion ? "auto" : "smooth", block: "start"});
    heading?.focus({preventScroll: true});
  });
}
const shareButton = html`<button type="button" class="share">Copy a link to this view</button>`;
shareButton.onclick = async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    shareButton.textContent = "Link copied";
  } catch {
    shareButton.textContent = "Copy the address from the address bar";
  }
  setTimeout(() => (shareButton.textContent = "Copy a link to this view"), 2500);
};
display(shareButton);
```

</div>

```js
// Header ribbon: the country's median month over the full years of the El Niño analysis, coloured like the calendar.
const ribbonMedian = d3.range(1, 13).map((m) => d3.median(byArea.get("ph").filter((d) => d.m === m && d.year >= elnino.years[0] && d.year <= elnino.years[1]), (d) => d.hotspots));
const ribbonColour = d3.scaleSequentialSqrt(d3.interpolateYlOrRd).domain([0, d3.max(ribbonMedian)]);
const ribbonPeak = ribbonMedian.indexOf(d3.max(ribbonMedian));
const seasonRibbon = html`<figure class="ribbon" role="img" aria-label=${`The country's median month, ${elnino.years[0]} to ${elnino.years[1]}, coloured from light (few hotspots) to dark red (many). The peak is ${MONTH_NAMES[ribbonPeak]}.`}>
  <div class="cells">${ribbonMedian.map((v) => html`<span style=${`background: ${ribbonColour(v)}`}></span>`)}</div>
  <div class="months" aria-hidden="true">${MONTHS.map((m) => html`<span>${m}</span>`)}</div>
  <figcaption aria-hidden="true">The country's median month, ${elnino.years[0]}–${elnino.years[1]}: the fire season peaks in ${MONTH_NAMES[ribbonPeak]}</figcaption>
</figure>`;
```

```js
// "What the record shows" for the selected area, over the whole record (From and To do not change it).
const recordRows = series.filter((d) => d.year >= elnino.years[0] && d.year <= elnino.years[1]);
const monthTotals = d3.range(1, 13).map((m) => d3.sum(recordRows, (d) => (d.m === m ? d.hotspots : 0)));
const recordTotal = d3.sum(monthTotals);
// The three busiest consecutive calendar months (December–February counts as consecutive).
const peak3 = d3.greatest(d3.range(12).map((i) => ({start: i, share: (monthTotals[i] + monthTotals[(i + 1) % 12] + monthTotals[(i + 2) % 12]) / recordTotal})), (d) => d.share);
const yearSumOf = (y, f) => d3.sum(series, (d) => (d.year === y ? f(d) : 0));
const stepOf = (fBefore, fAfter) => {
  const b = d3.mean(d3.range(seam.before[0], seam.before[1] + 1), (y) => yearSumOf(y, fBefore));
  const a = d3.mean(d3.range(seam.after[0], seam.after[1] + 1), (y) => yearSumOf(y, fAfter));
  return b > 0 ? a / b : NaN;
};
const stepHarmonised = stepOf((d) => d.hotspots, (d) => d.hotspots);
const stepRaw = stepOf((d) => d.modis_aqua, (d) => d.viirs_snpp);
const goToPanel = (event) => {
  event.preventDefault(); // keep the view link in the address bar
  const panel = document.getElementById("el-nino");
  panel?.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start"});
  panel?.focus({preventScroll: true});
};
display(html`<section class="strip" aria-labelledby="strip-title">
  <h2 id="strip-title">What the record shows: ${placeName}, ${elnino.years[0]}–${elnino.years[1]}</h2>
  <div class="strip-items">
    <a class="strip-item" href="#el-nino" onclick=${goToPanel}><b>${nino.testable ? `${nino.ratio.toFixed(1)}×` : "Too few fires to tell"}</b><span>${nino.testable ? `as many hotspots in El Niño fire seasons (${seasonLabel}) as in other years.` : "for a comparison of El Niño fire seasons."} See the El Niño panel</span></a>
    <div class="strip-item"><b>${recordTotal > 0 ? `${Math.round(100 * peak3.share)}%` : "None"}</b><span>${recordTotal > 0 ? `of the year's hotspots fall from ${MONTH_NAMES[peak3.start]} to ${MONTH_NAMES[(peak3.start + 2) % 12]}, the three busiest months in a row` : "no hotspots in the record here"}</span></div>
    <div class="strip-item"><b>${Number.isFinite(stepHarmonised) ? `${stepHarmonised.toFixed(2)}×` : "n/a"}</b><span>change at ${seam.after[0]}, when the satellites changed, in the harmonised record${Number.isFinite(stepRaw) ? ` (${stepRaw.toFixed(2)}× in the raw record)` : area.id === "custom" ? "; raw counts are not kept for a drawn box" : ""}${Number.isFinite(stepHarmonised) ? "" : `: no hotspots in ${seam.before.join("–")} to compare with`}</span></div>
  </div>
</section>`);
```

```js
// Custom area: a box drawn on a NASA GIBS base map, or typed as coordinates.
function areaPicker(initial) {
  const GIBS = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best";
  const root = html`<div class="picker card">
    <div class="map"></div>
    <div class="coords">
      <label>West <input type="number" step="0.01" min="114" max="128" data-k="w"></label>
      <label>South <input type="number" step="0.01" min="4" max="22" data-k="s"></label>
      <label>East <input type="number" step="0.01" min="114" max="128" data-k="e"></label>
      <label>North <input type="number" step="0.01" min="4" max="22" data-k="n"></label>
      <button type="button" data-act="apply">Use these coordinates</button>
      <button type="button" data-act="draw">Draw a box on the map</button>
    </div>
    <p class="hint picker-msg">Longitude and latitude in decimal degrees. Click "Draw a box", then click two opposite corners on the map.</p>
  </div>`;
  const mapDiv = root.querySelector(".map");
  const msg = root.querySelector(".picker-msg");
  const inputs = Object.fromEntries([...root.querySelectorAll("input")].map((i) => [i.dataset.k, i]));
  for (const i of Object.values(inputs)) i.addEventListener("input", (e) => e.stopPropagation());
  const map = L.map(mapDiv, {minZoom: 4, maxZoom: 10}).setView([12.5, 122], 5);
  // NASA GIBS Blue Marble with coastlines by default; OpenStreetMap as an alternative for place names.
  // (GIBS's label tiles are not transparent, so they are not used.)
  const blueMarble = L.layerGroup([
    L.tileLayer(`${GIBS}/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg`, {maxNativeZoom: 8, attribution: "Base map: NASA GIBS Blue Marble and coastlines"}),
    L.tileLayer(`${GIBS}/Coastlines_15m/default/GoogleMapsCompatible_Level13/{z}/{y}/{x}.png`, {maxNativeZoom: 13, opacity: 0.6})
  ]).addTo(map);
  const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom: 10, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'});
  L.control.layers({"NASA Blue Marble": blueMarble, "OpenStreetMap (place names)": osm}, null, {collapsed: false}).addTo(map);
  const points = L.layerGroup().addTo(map);
  const rect = L.rectangle([[initial.s, initial.w], [initial.n, initial.e]], {color: "#ffd400", weight: 2, fill: false}).addTo(map);
  const r3 = (x) => Math.round(x * 1000) / 1000;
  function setBox(b, fit) {
    if (![b.w, b.s, b.e, b.n].every(Number.isFinite)) { msg.textContent = "Enter four numbers."; return; }
    b = {w: r3(Math.min(b.w, b.e)), e: r3(Math.max(b.w, b.e)), s: r3(Math.min(b.s, b.n)), n: r3(Math.max(b.s, b.n))};
    if (b.e - b.w < 0.02 || b.n - b.s < 0.02) { msg.textContent = "The box is too small: make it at least 0.02° on each side."; return; }
    if ((b.e - b.w) * (b.n - b.s) > 16) { msg.textContent = "The box is larger than 16 square degrees. For a whole region or the country, choose it from the Area list."; return; }
    msg.textContent = `Box: west ${b.w}, south ${b.s}, east ${b.e}, north ${b.n}.`;
    for (const k of ["w", "s", "e", "n"]) inputs[k].value = b[k];
    rect.setBounds([[b.s, b.w], [b.n, b.e]]);
    if (fit) map.fitBounds(rect.getBounds(), {padding: [30, 30], maxZoom: 9});
    root.value = b;
    root.dispatchEvent(new Event("input", {bubbles: true}));
  }
  let drawing = false, start = null, temp = null;
  root.querySelector("[data-act=draw]").onclick = () => {
    drawing = true;
    start = null;
    mapDiv.style.cursor = "crosshair";
    msg.textContent = "Click one corner of the box on the map, then the opposite corner.";
  };
  root.querySelector("[data-act=apply]").onclick = () => setBox({w: +inputs.w.value, s: +inputs.s.value, e: +inputs.e.value, n: +inputs.n.value}, true);
  map.on("click", (e) => {
    if (!drawing) return;
    if (!start) {
      start = e.latlng;
      temp = L.rectangle([start, start], {color: "#ffd400", weight: 1, dashArray: "4"}).addTo(map);
      return;
    }
    const b = L.latLngBounds(start, e.latlng);
    temp.remove();
    drawing = false;
    mapDiv.style.cursor = "";
    setBox({w: b.getWest(), s: b.getSouth(), e: b.getEast(), n: b.getNorth()}, false);
  });
  map.on("mousemove", (e) => { if (drawing && start && temp) temp.setBounds(L.latLngBounds(start, e.latlng)); });
  for (const k of ["w", "s", "e", "n"]) inputs[k].value = initial[k];
  root.value = initial;
  root.points = points;
  // Leaflet needs the element on the page to know its size.
  let fitted = false;
  new ResizeObserver(() => { map.invalidateSize(); if (!fitted && mapDiv.clientWidth) { fitted = true; map.fitBounds(rect.getBounds(), {padding: [60, 60], maxZoom: 8}); } }).observe(mapDiv);
  return root;
}

// Hotspot files are loaded once per region, only when needed.
const pointCache = new Map();
function regionRows(id) {
  if (!pointCache.has(id)) {
    pointCache.set(id, pointFiles[id].csv().then((rows) => {
      for (const r of rows) { r.lat = +r.latitude; r.lon = +r.longitude; r.month = r.date.slice(0, 7); r.w = +r.weight_viirs_equivalent; r.region_id = id; }
      return rows;
    }));
  }
  return pointCache.get(id);
}
async function pointsInBox(b) {
  const pad = 0.1;
  const ids = areas.filter((a) => a.level === "region" && a.bbox[0] - pad <= b.e && a.bbox[2] + pad >= b.w && a.bbox[1] - pad <= b.n && a.bbox[3] + pad >= b.s).map((a) => a.id);
  const parts = await Promise.all(ids.map(regionRows));
  return parts.flat().filter((p) => p.lon >= b.w && p.lon <= b.e && p.lat >= b.s && p.lat <= b.n);
}
```

```js
const startBox = Object.fromEntries(["w", "s", "e", "n"].map((k) => [k, Number(startParams.get(k))]));
const linkedBox = ["w", "s", "e", "n"].every((k) => startParams.has(k) && Number.isFinite(startBox[k])) && startBox.e > startBox.w && startBox.n > startBox.s;
const picker = area.id === "custom" ? areaPicker(linkedBox ? startBox : {w: 120.4, s: 16.2, e: 121.0, n: 16.8}) : null;
const box = picker ? view(picker) : null;
```

```js
const customPoints = box ? await pointsInBox(box) : null;
```

```js
// On the custom map, show the hotspots of the selected period (a random sample if there are very many).
if (picker && customPoints) {
  picker.points.clearLayers();
  const inRange = customPoints.filter((d) => d.month >= lo && d.month <= hi);
  const shown = inRange.length > 12000 ? d3.shuffler(d3.randomLcg(1))(inRange.slice()).slice(0, 12000) : inRange;
  const renderer = L.canvas();
  for (const p of shown) L.circleMarker([p.lat, p.lon], {renderer, radius: 1.5, stroke: false, fillColor: p.month < "2012-02" ? "#fdae61" : "#ff3b1f", fillOpacity: 0.5}).addTo(picker.points);
  display(html`<p class="hint">${fmt(inRange.length)} hotspot detections in this box from ${lo} to ${hi}${inRange.length > shown.length ? `; the map shows a random ${fmt(shown.length)} of them` : ""}. On the VIIRS scale, where each MODIS detection counts as k, that is about ${fmt(d3.sum(inRange, (d) => d.w))}. Light orange: MODIS Aqua (before February 2012); red: VIIRS.</p>`);
}
```

```js
const lo = fromMonth <= toMonth ? fromMonth : toMonth;
const hi = fromMonth <= toMonth ? toMonth : fromMonth;
const phSeries = byArea.get("ph");
// A custom area's monthly record is the sum of its hotspots' weights (each hotspot already on the VIIRS scale).
function customSeries(points) {
  const sums = d3.rollup(points, (v) => d3.sum(v, (d) => d.w), (d) => d.month);
  return phSeries.map((d) => ({...d, area_id: "custom", hotspots: Math.round((sums.get(d.month) ?? 0) * 10) / 10, modis_aqua: NaN, modis_terra: NaN, viirs_snpp: NaN, viirs_noaa20: NaN}));
}
const series = area.id === "custom" ? (customPoints ? customSeries(customPoints) : []) : byArea.get(area.id) ?? [];
const daysIn = (d) => new Date(Date.UTC(d.year, d.m, 0)).getUTCDate();
const isFullMonth = (d) => d.days === daysIn(d);
const monthMean = d3.rollup(series.filter(isFullMonth), (v) => d3.mean(v, (d) => d.hotspots), (d) => d.m);
// A month still in progress is compared with the same share of the average month.
const sel = series.filter((d) => d.month >= lo && d.month <= hi).map((d) => ({...d, anomaly: Math.round((d.hotspots - monthMean.get(d.m) * d.days / daysIn(d)) * 10) / 10, partial: !isFullMonth(d)}));
const years = [...new Set(sel.map((d) => d.year))].sort((a, b) => b - a).map(String);
const fmt = d3.format(",.0f");
const areaTitle = area.id === "custom" ? (box ? `custom area (W ${box.w}, S ${box.s}, E ${box.e}, N ${box.n})` : "custom area") : area.name;
// Which conversion factor applies: the country adds up its regions, each with its own k; a province uses its region's k.
const regionKs = areas.filter((a) => a.level === "region").map((a) => a.k);
const factorText =
  area.level === "country" ? `each region's own factor (k from ${d3.min(regionKs).toFixed(1)} to ${d3.max(regionKs).toFixed(1)})`
  : area.level === "region" ? `this region's factor (k = ${area.k.toFixed(2)})`
  : area.level === "province" ? `the factor of its region, ${regionName.get(area.parent)} (k = ${area.k.toFixed(2)})`
  : "the factor of the region each hotspot is in";
```

```js
// Keep the page address in step with the view, so "Copy a link to this view" (or the address bar) reopens it.
{
  const p = new URLSearchParams({area: area.id, from: lo, to: hi});
  if (colourBy !== COLOUR_OPTIONS[0]) p.set("colour", "difference");
  if (ramp !== "ylorrd") p.set("ramp", ramp);
  if (mapMode !== "elnino") p.set("map", mapMode);
  if (area.id === "custom" && box) for (const k of ["w", "s", "e", "n"]) p.set(k, box[k]);
  history.replaceState(history.state, "", `#${p}`);
}
```

## In plain words

```js
// A short summary of the current view for readers who are not scientists. Every number comes from the same data as the charts below.
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthName = (ym) => `${MONTH_NAMES[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`;
const placeName = area.level === "country" ? "the whole Philippines" : area.id === "custom" ? "the box you chose" : area.name;
const periodTotal = d3.sum(sel, (d) => d.hotspots);
const seasonMonths = profile.filter((d) => Number.isFinite(d.median));
const seasonPeak = d3.max(seasonMonths, (d) => d.median);
// Months as plain phrases: [2, 3, 4] → "from February to April"; [6] → "in June".
const monthPhrase = (ms) => {
  const runs = [];
  for (const m of ms) runs.length && m === runs[runs.length - 1][1] + 1 ? (runs[runs.length - 1][1] = m) : runs.push([m, m]);
  return runs.map(([a, b]) => (a === b ? `in ${MONTH_NAMES[a - 1]}` : `from ${MONTH_NAMES[a - 1]} to ${MONTH_NAMES[b - 1]}`)).join(" and ");
};
const busyMonths = seasonMonths.filter((d) => d.median >= 0.6 * seasonPeak).map((d) => d.m);
const rareMonths = seasonMonths.filter((d) => d.median <= 0.1 * seasonPeak).map((d) => d.m);
const busiestYear = d3.greatest(fullYears, (d) => d.total);
const quietestYear = d3.least(fullYears, (d) => d.total);
const endMonthName = MONTH_NAMES[endRow.m - 1];
const times = (r) => (r >= 10 ? fmt(r) : r.toFixed(1));
// "Usual" is the median of the same month in the other years (scaled to the days so far for a month in progress), as on the card below.
const usual = `a usual ${endMonthName}${partial ? " at this point in the month" : ""} has about ${fmt(med)}`;
const ratio = med > 0 ? endRow.hotspots / med : NaN;
const latestComparison =
  !(med > 0)
    ? endRow.hotspots > 0
      ? `In most years ${endMonthName} has almost none here, so this is more than usual.`
      : `${endMonthName} usually has almost none here, and this one has none either.`
    : ratio >= 1.5 && med >= 5
      ? `That is about ${times(ratio)} times as many as usual: ${usual}.`
      : ratio >= 1.15
        ? `That is more than usual: ${usual}.`
        : ratio > 0.85
          ? `That is close to usual: ${usual}.`
          : `That is fewer than usual: ${usual}.`;
const kText =
  area.level === "country" ? `each region's own number (about ${meta.factors.ph.k.toFixed(1)} across the country)`
  : area.level === "region" ? `${area.k.toFixed(1)} (this region's number)`
  : area.level === "province" ? `${area.k.toFixed(1)} (the number for its region, ${regionName.get(area.parent)})`
  : "the number for the region each hotspot is in";
display(html`<div class="plain">
  <p>From ${monthName(lo)} to ${monthName(hi)}, satellites marked about <b>${fmt(periodTotal)} hotspots</b> in ${placeName}, counted on the newer camera's scale.</p>
  ${seasonMonths.length === 12 && sel.length >= 24 ? html`<p>${seasonPeak > 0 ? `Burning is usually busiest ${monthPhrase(busyMonths)}${rareMonths.length ? `, and hotspots are rare ${monthPhrase(rareMonths)}` : ""}.` : "Hotspots are rare here in every month of the year."}</p>` : ""}
  ${fullYears.length >= 2 ? html`<p>The busiest full year was ${busiestYear.year} (${fmt(busiestYear.total)} hotspots); the quietest was ${quietestYear.year} (${fmt(quietestYear.total)}).</p>` : ""}
  <p>${monthName(hi)}${partial ? `, days 1 to ${endRow.days} so far` : ""}: <b>${fmt(endRow.hotspots)} hotspots</b>. ${latestComparison}${endRow.gap_days > 0 ? ` Some days had no satellite data, so this month reads low.` : ""}</p>
  ${lo < "2012-02" ? html`<p>Months before February 2012 come from the older MODIS camera, which misses smaller fires. We multiplied its counts by ${kText} so they match the newer VIIRS camera.</p>` : ""}
</div>`);
```

<h2 id="calendar" tabindex="-1">Burning activity calendar: ${areaTitle}, ${lo} to ${hi}</h2>

<p class="hint">Each cell is one month. ${colourBy === "Number of hotspots" ? "Colour shows the number of hotspots on the VIIRS scale." : "Colour shows how far each month is above (red) or below (blue) the average for that calendar month over every complete month of the record; a month still in progress is compared with the same share of the average."} Cells before February 2012 come from MODIS Aqua converted with ${factorText}; cells from February 2012 come from VIIRS. A dot marks a month with a week or more of missing satellite data, which reads lower than it was.</p>

```js
const byCount = colourBy === "Number of hotspots";
function calendar(width) {
  return quiet(Plot.plot({
    width,
    height: 40 + years.length * 18,
    ariaLabel: `Burning activity calendar for ${areaTitle}, ${lo} to ${hi}`,
    ariaDescription: `One cell per month, years as rows and months as columns, coloured by ${byCount ? "the number of hotspots on the VIIRS scale" : "the difference from the average for that month"}. Download the monthly analytics CSV below for the numbers.`,
    marginLeft: 56,
    padding: 0.06,
    x: {domain: d3.range(1, 13), tickFormat: (m) => MONTHS[m - 1], label: null, axis: "top"},
    y: {domain: years, label: null, tickFormat: (y) => (EL_NINO.has(+y) ? `${y} ${NINO_MARK}` : y)},
    color: byCount
      ? {type: "sqrt", scheme: ramp, label: "Hotspots (VIIRS-equivalent)", legend: true, zero: true, ticks: 5, tickFormat: "~s", width: 360}
      : {type: "diverging-sqrt", scheme: "rdbu", reverse: true, pivot: 0, label: "Hotspots above (+) or below (−) the average for that month", legend: true, ticks: 5, tickFormat: "+~s", width: 360},
    marks: [
      Plot.cell(sel, {
        x: "m",
        y: (d) => String(d.year),
        fill: byCount ? "hotspots" : "anomaly",
        inset: 0.5,
        channels: {Month: "month", Hotspots: "hotspots", "Difference from the month's average": "anomaly", Source: "source", "Missing days": "gap_days", "Month in progress": (d) => (d.partial ? "yes, partial" : "")},
        tip: {format: {x: false, y: false, fill: false, Hotspots: (v) => fmt(v), "Difference from the month's average": (v) => d3.format("+,.0f")(v)}}
      }),
      Plot.cell(sel.filter((d) => d.partial), {x: "m", y: (d) => String(d.year), inset: 0.5, stroke: "currentColor", strokeDasharray: "2,2", fill: "none"}),
      Plot.dot(sel.filter((d) => d.gap_days >= 7), {x: "m", y: (d) => String(d.year), r: 2.5, fill: "currentColor"})
    ]
  }));
}
const calendarFigure = display(resize((width) => calendar(width)));
display(ninoLegend());
```

<details class="cal3d">
  <summary>See this calendar in 3D</summary>

```js
// The same calendar as columns on an isometric floor (months × years); column height = hotspots, colour as in the flat calendar.
// Drawn back to front in plain SVG. The flat calendar above and the CSV give the exact values.
const view3dInput = Inputs.radio(new Map([["Oldest year in front", 0], ["Newest year in front", 1]]), {label: "Look", value: 0});
const view3d = Generators.input(view3dInput);
display(view3dInput);
```

```js
function calendar3d(width, view) {
  const yearsAsc = [...new Set(sel.map((d) => d.year))].sort(d3.ascending);
  const nM = 12, nY = yearsAsc.length;
  const cos = Math.cos(Math.PI / 6);
  const u = Math.max(8, Math.min(26, (width - 120) / ((nM + nY) * cos)));
  const H = u * 7;
  const maxV = d3.max(sel, (d) => d.hotspots) || 1;
  const colour = d3.scaleSequentialSqrt(ramp === "viridis" ? d3.interpolateViridis : d3.interpolateYlOrRd).domain([0, maxV]);
  const P = (i, j, z) => [(i - j) * cos * u, (i + j) * 0.5 * u - z];
  const ix = (m) => (view === 0 ? m - 1 : 12 - m);
  const jx = (y) => (view === 0 ? nY - 1 - yearsAsc.indexOf(y) : yearsAsc.indexOf(y));
  const cells = sel.map((d) => ({...d, i: ix(d.m), j: jx(d.year)})).sort((a, b) => a.i + a.j - (b.i + b.j) || a.j - b.j);
  const x0 = -nY * cos * u - 70, x1 = nM * cos * u + 50, y1 = (nM + nY) * 0.5 * u + 40;
  const y0 = Math.min(-10, d3.min(cells, (d) => P(d.i, d.j, (H * d.hotspots) / maxV)[1]) ?? 0) - 12;
  const svg = d3.create("svg").attr("width", width).attr("height", y1 - y0).attr("viewBox", [x0, y0, x1 - x0, y1 - y0]).attr("role", "img")
    .attr("aria-label", `The calendar for ${areaTitle} in 3D, ${lo} to ${hi}`)
    .attr("aria-description", "Each month is a column on a floor of months and years; taller means more hotspots, and the colour follows the flat calendar's count ramp. The flat calendar above shows the same values.")
    .style("max-width", "100%").style("height", "auto").style("font", "11px var(--sans-serif)");
  const floor = [P(0, 0, 0), P(nM, 0, 0), P(nM, nY, 0), P(0, nY, 0)];
  svg.append("polygon").attr("points", floor.join(" ")).attr("fill", "var(--theme-foreground-faintest)");
  const poly = (pts, fill) => svg.append("polygon").attr("points", pts.map((p) => p.join(",")).join(" ")).attr("fill", fill).attr("stroke", "var(--theme-background)").attr("stroke-width", 0.4);
  const e = 0.12;
  for (const d of cells) {
    const h = (H * d.hotspots) / maxV, c = d3.color(colour(d.hotspots));
    const [a, b] = [d.i + e, d.i + 1 - e], [p, q] = [d.j + e, d.j + 1 - e];
    const g = svg.append("g");
    g.append("title").text(`${MONTHS[d.m - 1]} ${d.year}: ${fmt(d.hotspots)} hotspots${EL_NINO.has(d.year) ? " (El Niño year)" : ""}`);
    if (h > 0.5) {
      poly([P(b, p, 0), P(b, q, 0), P(b, q, h), P(b, p, h)], c.darker(0.9).formatHex());
      poly([P(a, q, 0), P(b, q, 0), P(b, q, h), P(a, q, h)], c.darker(0.4).formatHex());
    }
    poly([P(a, p, h), P(b, p, h), P(b, q, h), P(a, q, h)], c.formatHex());
  }
  // Month labels along the front-right edge, year labels along the front-left edge (El Niño years with a diamond).
  for (let m = 1; m <= 12; m++) { const [x, y] = P(ix(m) + 0.5, nY + 0.3, 0); svg.append("text").attr("x", x).attr("y", y + 10).attr("text-anchor", "middle").attr("fill", "currentColor").text(MONTHS[m - 1]); }
  for (const y of yearsAsc) { if (nY > 12 && y % 2 && !EL_NINO.has(y)) continue; const [x, yy] = P(nM + 0.3, jx(y) + 0.5, 0); svg.append("text").attr("x", x + 6).attr("y", yy + 4).attr("fill", "currentColor").text(`${y}${EL_NINO.has(y) ? ` ${NINO_MARK}` : ""}`); }
  return svg.node();
}
display(resize((width) => calendar3d(width, view3d)));
```

  <p class="hint">Column height and colour: hotspots in the month (VIIRS scale), height on a straight scale, colour on the flat calendar's count ramp. ${NINO_MARK}: El Niño year. Columns can hide the ones behind them, so turn the view, or read the exact numbers in the flat calendar above or the monthly CSV.</p>
</details>

```js
// "How does the latest month compare?" — the selected end month against the same month in every other year of the record.
const endRow = series.find((d) => d.month === hi);
const sameMonth = series.filter((d) => d.m === endRow.m && d.year !== endRow.year && isFullMonth(d));
// A month still in progress holds only the days so far; compare it with the same share of a typical month.
const daysInMonth = new Date(Date.UTC(endRow.year, endRow.m, 0)).getUTCDate();
const share = endRow.days / daysInMonth;
const partial = share < 1;
const med = d3.median(sameMonth, (d) => d.hotspots) * share;
const avg = d3.mean(sameMonth, (d) => d.hotspots) * share;
const rank = 1 + sameMonth.filter((d) => d.hotspots * share > endRow.hotspots).length;
// Years with the same count share the rank; a month with no hotspots is not called the busiest.
const tied = sameMonth.filter((d) => Math.abs(d.hotspots * share - endRow.hotspots) < 0.05).length;
const noneOthers = sameMonth.filter((d) => d.hotspots === 0).length;
const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th");
const rankCard = endRow.hotspots === 0
  ? html`<span class="big">None</span><p>no hotspots${partial ? " so far" : ""}; ${noneOthers} of the ${sameMonth.length} other years had none in ${MONTHS[endRow.m - 1]} either</p>`
  : html`<span class="big">${tied ? "joint " : ""}${ordinal(rank)}</span><p>busiest ${MONTHS[endRow.m - 1]} of ${sameMonth.length + 1} since ${series[0].year}${tied ? `, tied with ${tied} other year${tied > 1 ? "s" : ""}` : ""}${partial ? ", at the same point in the month" : ""}</p>`;
```

<div class="grid grid-cols-3">
  <div class="card">
    <h2>${MONTHS[endRow.m - 1]} ${endRow.year}${partial ? `, 1–${endRow.days} only` : ""}</h2>
    <span class="big">${fmt(endRow.hotspots)}</span>
    <p>hotspots (VIIRS-equivalent) in ${areaTitle}${partial ? " so far this month" : ""}</p>
    ${hi < meta.viirsStart ? html`<p class="hint">Converted from MODIS; a single month is typically off by about a third (${Math.round(validation.T1_leaveOneYearOut_2012_2020.harmonised.monthlyMedianAbsPctError)}% in the held-out test).</p>` : ""}
  </div>
  <div class="card">
    <h2>Against the historical median</h2>
    <span class="big">${med > 0 ? d3.format("+.0%")(endRow.hotspots / med - 1) : d3.format("+,.0f")(endRow.hotspots - med)}</span>
    <p>${partial ? `median for the first ${endRow.days} days of` : "median"} ${MONTHS[endRow.m - 1]}: ${fmt(med)} · mean: ${fmt(avg)} (${sameMonth.length} other years)</p>
  </div>
  <div class="card">
    <h2>Rank</h2>
    ${rankCard}
  </div>
</div>

<p class="hint">${partial ? `${MONTHS[endRow.m - 1]} ${endRow.year} is still in progress: the comparison scales other years' ${MONTHS[endRow.m - 1]} to its first ${endRow.days} days, assuming hotspots spread evenly through the month. ` : ""}${endRow.gap_days > 0 ? `Warning: ${endRow.gap_days} day(s) of ${MONTHS[endRow.m - 1]} ${endRow.year} have no satellite data, so this month reads low.` : ""} Change "To" to compare any other month.</p>

## Where it burned, and where El Niño matters most

```js
// Province map of the selection. Areas are in km² on the sphere (d3.geoArea × Earth's radius²).
const EARTH_RADIUS_KM = 6371.0088;
const provinceKm2 = new Map(provinceShapes.features.map((f) => [f.properties.id, d3.geoArea(f) * EARTH_RADIUS_KM ** 2]));
// The map has its own control (the page's "Colour by" colours the calendar); a view link restores it.
const MAP_MODES = new Map([["Hotspots per 100 km²", "density"], ["End month (To) against its average", "month"], ["El Niño response (January–May)", "elnino"]]);
const mapInput = Inputs.radio(MAP_MODES, {label: "Map shows", value: [...MAP_MODES.values()].includes(startParams.get("map")) ? startParams.get("map") : "elnino"});
const mapMode = Generators.input(mapInput);
```

```js
// Per province: hotspots over the period (and per 100 km², so large and small provinces compare fairly),
// the end month against that province's average for the same calendar month (as in the calendar),
// and the El Niño response of its January–May season (from the pipeline, elnino.json).
const provinceStats = provinceShapes.features.map((f) => {
  const id = f.properties.id;
  const rows = byArea.get(id) ?? [];
  const total = d3.sum(rows, (d) => (d.month >= lo && d.month <= hi ? d.hotspots : 0));
  const end = rows.find((d) => d.month === hi);
  const average = d3.mean(rows.filter((d) => d.m === end.m && isFullMonth(d)), (d) => d.hotspots) * (end.days / daysIn(end));
  return {id, name: f.properties.name, parent: f.properties.parent, total, density: (100 * total) / provinceKm2.get(id), end: end.hotspots, average, diff: end.hotspots - average, nino: elnino.areas[id]};
});
// Metro Manila's hotspots are mostly industrial and other static heat sources, and its factor rests on few detections (method page, Limits).
const ncrStaticPct = Math.round((100 * meta.stats.pointsNcrStaticSource) / meta.stats.pointsNcr);
const ncrNote = `Metro Manila's four districts are not ranked here: ${ncrStaticPct}% of their hotspots are industrial or other static heat sources (FIRMS type 2), not vegetation fires. They are on the map and in the table`;
const statById = new Map(provinceStats.map((d) => [d.id, d]));
const mapValue = (id) => (mapMode === "density" ? statById.get(id).density : mapMode === "month" ? statById.get(id).diff : statById.get(id).nino.ratio);
const NO_TEST_GREY = "#b4b4b4";
const untestedCount = provinceStats.filter((d) => !d.nino.testable).length;
const ratioText = (r) => `${r.toFixed(1)}×`;
const pText = d3.format(".2~g");
const seasonLabel = `${MONTH_NAMES[elnino.seasonMonths[0] - 1]}–${MONTH_NAMES[elnino.seasonMonths[elnino.seasonMonths.length - 1] - 1]}`;
function provinceMap(width) {
  const features = provinceShapes.features;
  const chosen = features.filter((f) => (area.level === "province" ? f.properties.id === area.id : area.level === "region" ? f.properties.parent === area.id : false));
  const tipText = (f) => {
    const s = statById.get(f.properties.id);
    const caution = s.parent === "r-ncr" ? `\nAbout ${ncrStaticPct}% are industrial heat sources, not vegetation fires` : "";
    if (mapMode === "elnino") return s.nino.testable
      ? `${s.name}\nEl Niño seasons: ${ratioText(s.nino.ratio)} the other seasons (${seasonLabel})\nMedian ${fmt(s.nino.ninoMedian)} against ${fmt(s.nino.otherMedian)} hotspots\nChance probability ${pText(s.nino.p)}${caution}\nClick to see its calendar`
      : `${s.name}\nToo few fires to tell: other seasons' median ${fmt(s.nino.otherMedian)} hotspots (a test needs ${elnino.minOtherMedian})${caution}\nClick to see its calendar`;
    return mapMode === "density"
      ? `${s.name}\n${fmt(s.total)} hotspots, ${lo} to ${hi}\n${s.density.toFixed(1)} per 100 km²${caution}\nClick to see its calendar`
      : `${s.name}\n${MONTHS[endRow.m - 1]} ${endRow.year}: ${fmt(s.end)} hotspots\nAverage of every complete ${MONTHS[endRow.m - 1]}${partial ? " (same days)" : ""}: ${fmt(s.average)}${caution}\nClick to see its calendar`;
  };
  // Height from the islands' own shape at this width (Mercator), capped so the map fits a screen.
  const [[, y0], [, y1]] = d3.geoPath(d3.geoMercator().fitWidth(width - 20, provinceShapes)).bounds(provinceShapes);
  const plot = Plot.plot({
    width,
    height: Math.round(Math.min(y1 - y0 + 20, 720)),
    projection: {type: "mercator", domain: provinceShapes, inset: 10},
    ariaLabel: `Map of Philippine provinces, ${mapMode === "density" ? `hotspots per 100 km² from ${lo} to ${hi}` : mapMode === "month" ? `${MONTHS[endRow.m - 1]} ${endRow.year} against each province's average` : `El Niño seasons against other seasons, ${seasonLabel}, ${elnino.years[0]}–${elnino.years[1]}`}`,
    ariaDescription: "Each province is coloured by its value. The list next to the map names the top provinces with their values; choose one there to open its calendar. The table below the map lists every province.",
    color: mapMode === "density"
      ? {type: "sqrt", scheme: ramp, zero: true, legend: true, label: "Hotspots per 100 km²", width: 300}
      : mapMode === "month"
        ? {type: "diverging-sqrt", scheme: "rdbu", reverse: true, pivot: 0, legend: true, label: `${MONTHS[endRow.m - 1]} ${endRow.year}: above (+) or below (−) the average`, tickFormat: "+~s", width: 300}
        : {type: "diverging-log", scheme: "rdbu", reverse: true, pivot: 1, domain: [0.5, 8], unknown: NO_TEST_GREY, legend: true, label: "El Niño seasons ÷ other seasons", ticks: [0.5, 1, 2, 4, 8], tickFormat: (d) => `${d}×`, width: 300},
    marks: [
      Plot.geo(features, {fill: (f) => mapValue(f.properties.id), stroke: "var(--theme-background)", strokeWidth: 0.4}),
      Plot.geo(chosen, {stroke: "currentColor", strokeWidth: 2}),
      area.id === "custom" && box ? Plot.line([[box.w, box.s], [box.e, box.s], [box.e, box.n], [box.w, box.n], [box.w, box.s]], {stroke: "currentColor", strokeWidth: 2}) : null,
      Plot.tip(features, Plot.pointer(Plot.geoCentroid({title: tipText})))
    ]
  });
  // A click opens the province named in the tip (the pointer's current value), so what the tip says is what opens.
  plot.style.cursor = "pointer";
  plot.addEventListener("click", () => { if (plot.value) selectArea(plot.value.properties.id); });
  return quiet(plot);
}
const mapFigure = resize((width) => provinceMap(width));
const ranking = provinceStats
  .filter((d) => d.parent !== "r-ncr" && (mapMode === "density" ? d.total > 0 : mapMode === "month" ? d.diff > 0 : d.nino.testable))
  .sort((a, b) => mapValue(b.id) - mapValue(a.id))
  .slice(0, 10);
const rankMax = d3.max(ranking, (d) => mapValue(d.id)) || 1;
const rankedList = html`<div class="ranked">
  <h3>${mapMode === "density" ? "Most hotspots for their size (per 100 km²)" : mapMode === "month" ? `Most above their average, ${MONTHS[endRow.m - 1]} ${endRow.year} (hotspots)` : `Strongest El Niño response (${seasonLabel})`}</h3>
  ${ranking.length
    ? html`<ol>${ranking.map((d) => html`<li><div class="row">
        <span><button type="button" onclick=${() => selectArea(d.id)}>${d.name}</button></span>
        <span class="num">${mapMode === "density" ? d.density.toFixed(1) : mapMode === "month" ? `+${fmt(d.diff)}` : ratioText(d.nino.ratio)}</span>
        <span class="bar" style=${`width: ${(100 * mapValue(d.id)) / rankMax}%`}></span>
      </div></li>`)}</ol>`
    : html`<p class="hint">No province is above its average in ${MONTHS[endRow.m - 1]} ${endRow.year}.</p>`}
  <p class="hint">${ncrNote}; see <a href="./method#limits">Limits</a>.</p>
</div>`;
// Every province's value as a sortable table: the keyboard and screen-reader route to what the map shows by colour.
const NINO_COL = `El Niño response, ${seasonLabel}`;
const provinceTable = Inputs.table(
  provinceStats.map((d) => ({Province: d.name, Region: regionName.get(d.parent), [`Hotspots, ${lo} to ${hi}`]: Math.round(d.total), "Per 100 km²": +d.density.toFixed(1), [`${MONTHS[endRow.m - 1]} ${endRow.year}`]: Math.round(d.end), [`Average ${MONTHS[endRow.m - 1]}${partial ? " (same days)" : ""}`]: Math.round(d.average), [NINO_COL]: d.nino.testable ? +d.nino.ratio.toFixed(1) : null, "Chance probability": d.nino.p})),
  {sort: mapMode === "density" ? "Per 100 km²" : mapMode === "month" ? `${MONTHS[endRow.m - 1]} ${endRow.year}` : NINO_COL, reverse: true, rows: 12, select: false, format: {[NINO_COL]: (v) => (v == null ? "too few fires to tell" : `${v.toFixed(1)}×`), "Chance probability": (v) => (v == null ? "" : pText(v))}}
);
```

```js
// El Niño panel for the selected area: its January–May seasons, El Niño years against the others.
const SEASON_YEARS = d3.range(elnino.years[0], elnino.years[1] + 1);
const seasons = SEASON_YEARS.map((year) => ({year, nino: EL_NINO.has(year), total: d3.sum(series, (d) => (d.year === year && elnino.seasonMonths.includes(d.m) ? d.hotspots : 0))}));
const ninoSeasons = seasons.filter((d) => d.nino), otherSeasons = seasons.filter((d) => !d.nino);
// Named areas use the pipeline's numbers and its chance test; a drawn box is computed here from its own monthly record, without a test.
const boxOther = d3.median(otherSeasons, (d) => d.total);
const nino = area.id === "custom"
  ? {ninoMedian: d3.median(ninoSeasons, (d) => d.total), otherMedian: boxOther, ninoMin: d3.min(ninoSeasons, (d) => d.total), ninoMax: d3.max(ninoSeasons, (d) => d.total), testable: boxOther >= elnino.minOtherMedian, ratio: boxOther >= elnino.minOtherMedian ? d3.median(ninoSeasons, (d) => d.total) / boxOther : null}
  : elnino.areas[area.id];
const word = (n) => WORDS[n] ?? String(n);
const ninoPlace = area.level === "country" ? "the Philippines" : area.id === "custom" ? "your box" : area.name;
const ninoStrip = (width) => quiet(Plot.plot({
  width,
  height: 112,
  marginLeft: 70,
  marginBottom: 34,
  x: {label: `${seasonLabel} hotspots`, grid: true, tickFormat: "~s", ticks: 4},
  y: {domain: ["El Niño", "Other"], label: null},
  symbol: {domain: ["El Niño", "Other"], range: ["diamond", "circle"]},
  ariaLabel: `${seasonLabel} hotspots in ${ninoPlace} each year from ${SEASON_YEARS[0]} to ${SEASON_YEARS[SEASON_YEARS.length - 1]}, El Niño years against the others`,
  ariaDescription: `Diamonds: the ${ninoSeasons.length} El Niño seasons. Circles: the ${otherSeasons.length} other seasons. A vertical stroke marks each group's median.`,
  marks: [
    Plot.dot(seasons, {x: "total", y: (d) => (d.nino ? "El Niño" : "Other"), symbol: (d) => (d.nino ? "El Niño" : "Other"), fill: (d) => (d.nino ? "#d7301f" : "#fdae61"), stroke: "var(--theme-background)", strokeWidth: 0.5, r: 4.5, channels: {Year: "year"}, tip: {format: {x: (v) => fmt(v), y: false, symbol: false, fill: false}}}),
    Plot.tickX([{g: "El Niño", v: nino.ninoMedian}, {g: "Other", v: nino.otherMedian}], {x: "v", y: "g", stroke: "currentColor", strokeWidth: 2.5})
  ]
}));
const ninoPanel = html`<div class="nino-panel">
  <h3>El Niño seasons in ${ninoPlace}</h3>
  <p class="hint">${seasonLabel} hotspots in each year from ${SEASON_YEARS[0]} to ${SEASON_YEARS[SEASON_YEARS.length - 1]}.</p>
  ${nino.testable
    ? html`<p><span class="big">${ratioText(nino.ratio)}</span> El Niño seasons against the others (median against median)</p>`
    : html`<p><span class="big too-few">Too few fires to tell</span></p>`}
  <p>The ${word(ninoSeasons.length)} El Niño seasons: median <b>${fmt(nino.ninoMedian)}</b> hotspots, from ${fmt(nino.ninoMin)} to ${fmt(nino.ninoMax)}. The other ${word(otherSeasons.length)}: median <b>${fmt(nino.otherMedian)}</b>.</p>
  ${!nino.testable ? html`<p>The other seasons' median is below ${elnino.minOtherMedian} hotspots, too few for a fair comparison, so no ratio is given.</p>` : ""}
  ${nino.testable && area.id !== "custom" ? html`<p>Could it be luck? We picked ${word(ninoSeasons.length)} of the ${SEASON_YEARS.length} years at random, ${fmt(elnino.shuffles)} times. ${fmt(nino.hits)} of those picks gave a ratio this high or higher (chance probability ${pText(nino.p)}), ${nino.p < 0.05 ? "so a gap this large is unlikely to be chance alone." : "so El Niño seasons here are not clearly different from the others."}</p>` : ""}
  ${area.id === "custom" && nino.testable ? html`<p class="hint">Computed from the box's own monthly record. The chance test is run for the country, regions and provinces only.</p>` : ""}
  ${resize((width) => ninoStrip(width))}
</div>`;
```

<div class="grid grid-cols-3 map-grid">
  <div class="card grid-colspan-2">${mapInput}${mapFigure}</div>
  <div class="map-side">
    <div class="card" id="el-nino" tabindex="-1">${ninoPanel}</div>
    <div class="card nino-caution"><p>PAGASA's <a href="https://pubfiles.pagasa.dost.gov.ph/pagasaweb/files/climate/elninolanina/ENSO_Advisory6_OS.pdf" target="_blank" rel="noopener">El Niño Advisory No. 6</a> (3 November 2026) reports a very strong El Niño, expected to last into the first half of 2027. This describes past seasons; it is not a forecast. El Niño years are also less cloudy, so satellites see more of what burns: the ratio mixes more burning with better visibility. The record holds only ${word(elnino.elNinoYears.length)} El Niño seasons.</p></div>
    <div class="card">${rankedList}</div>
  </div>
</div>

<details class="all-provinces">
  <summary>All ${provinceStats.length} provinces as a table</summary>
  ${provinceTable}
</details>

<p class="hint">Each shape is a province, ${mapMode === "density" ? `coloured by hotspots per 100 km² from ${lo} to ${hi}, so large and small provinces can be compared fairly` : mapMode === "month" ? `coloured by how far ${MONTHS[endRow.m - 1]} ${endRow.year} sits above (red) or below (blue) the average of every complete ${MONTHS[endRow.m - 1]} in that province, as in the calendar` : `coloured by how many times more hotspots its ${word(elnino.elNinoYears.length)} El Niño seasons (${seasonLabel}, median) had than its other seasons, ${elnino.years[0]}–${elnino.years[1]}: red above 1×, blue below. Grey: too few fires to tell (${untestedCount} provinces whose other seasons have a median below ${elnino.minOtherMedian} hotspots). This map does not change with From and To`}. Click a province, or a name in the list, to open its calendar. The map shows data up to ${meta.lastDate}, refreshed by hand from NASA FIRMS; it is not live. For today's detections, see NASA's <a href="https://firms.modaps.eosdis.nasa.gov/map/" target="_blank" rel="noopener">FIRMS Fire Map</a> (an external NASA site).</p>

## Outlook: January–May ${outlook.nextYear} if El Niño holds

```js
// Outlook for the next January–May season if it is an El Niño season (pipeline, outlook.json, with its test on past seasons).
// A drawn box is computed here from its own seasons, without the test.
const OUT_YEARS = d3.range(elnino.years[0], outlook.checkYear + 1);
const outSeasons = OUT_YEARS.map((year) => ({year, nino: EL_NINO.has(year), total: d3.sum(series, (d) => (d.year === year && elnino.seasonMonths.includes(d.m) ? d.hotspots : 0))}));
const outArea = area.id === "custom" ? (nino.testable ? {median: nino.ninoMedian, low: nino.ninoMin, high: nino.ninoMax, otherMedian: nino.otherMedian} : null) : outlook.areas[area.id] ?? null;
const checkSeason = outSeasons.find((d) => d.year === outlook.checkYear);
const otherPast = outSeasons.filter((d) => !d.nino && d.year <= elnino.years[1]).map((d) => d.total);
const NEXT = String(outlook.nextYear);
// One decimal: outlook.json stores the errors to 3 decimals, so a whole percent would round twice.
const pct = (x) => `${(100 * x).toFixed(1)}%`;
const outlookChart = (width) => quiet(Plot.plot({
  width,
  height: 250,
  marginLeft: 56,
  x: {domain: [...OUT_YEARS.map(String), NEXT], label: null, ticks: [...OUT_YEARS.filter((y) => y % 5 === 0).map(String), NEXT], tickFormat: (y) => (y === NEXT ? `${NEXT}?` : y)},
  y: {label: `${seasonLabel} hotspots`, grid: true, tickFormat: "~s"},
  ariaLabel: `${seasonLabel} hotspots in ${ninoPlace} each year from ${OUT_YEARS[0]} to ${outlook.checkYear}, and the ${NEXT} outlook if El Niño holds`,
  ariaDescription: outArea ? `Bars: each season; El Niño seasons marked with a diamond. ${NEXT}: a range from ${fmt(outArea.low)} to ${fmt(outArea.high)} with a median of ${fmt(outArea.median)}. Dashed line: the usual season without El Niño, ${fmt(outArea.otherMedian)}.` : "Bars: each season; El Niño seasons marked with a diamond. Too few fires here for an outlook.",
  marks: [
    Plot.barY(outSeasons, {x: (d) => String(d.year), y: "total", fill: (d) => (d.nino ? "#d7301f" : d.year === outlook.checkYear ? "#9a9a9a" : "#fdae61"), channels: {Season: (d) => `${seasonLabel} ${d.year}${d.nino ? ", El Niño" : ""}`}, tip: {format: {x: false, y: (v) => fmt(v), fill: false}}}),
    Plot.text(outSeasons.filter((d) => d.nino), {x: (d) => String(d.year), y: "total", text: () => NINO_MARK, dy: -9, fontSize: 13, fill: "currentColor"}),
    outArea ? Plot.ruleY([outArea.otherMedian], {stroke: "currentColor", strokeDasharray: "4,3"}) : null,
    outArea ? Plot.barY([outArea], {x: () => NEXT, y1: "low", y2: "high", fill: "#d7301f", fillOpacity: 0.28, stroke: "#d7301f", strokeDasharray: "3,2"}) : null,
    outArea ? Plot.tickY([outArea], {x: () => NEXT, y: "median", stroke: "#d7301f", strokeWidth: 3}) : null,
    Plot.ruleY([0])
  ]
}));
```

<div class="grid grid-cols-3 outlook-grid">
  <div class="card grid-colspan-2">${resize((width) => outlookChart(width))}</div>
  <div class="card outlook">
    ${outArea ? html`<p class="outlook-lead">If January–May ${NEXT} is an El Niño season, as PAGASA expects, past El Niño seasons put ${ninoPlace} at about <b>${fmt(outArea.median)} hotspots</b>, between ${fmt(outArea.low)} and ${fmt(outArea.high)}. A season without El Niño has usually had about ${fmt(outArea.otherMedian)}.</p>` : html`<p class="outlook-lead">Too few fires here for an outlook: the seasons without El Niño have a median below ${elnino.minOtherMedian} hotspots.</p>`}
    ${outArea && area.id !== "custom" ? html`<p>Tested on the past: predicting each El Niño season${outArea.ofSeasons < elnino.elNinoYears.length ? ` with hotspots (${word(outArea.ofSeasons)} of ${word(elnino.elNinoYears.length)}; a season with none cannot be scored)` : ""} from the other ${word(elnino.elNinoYears.length - 1)} missed by a median of ${pct(outArea.errorElNinoAnalogues)}, against ${pct(outArea.errorIgnoringElNino)} when El Niño was ignored.</p>` : ""}
    ${outArea && area.id === "custom" ? html`<p class="hint">For a drawn box this comes from the box's own seasons; the test on past seasons is run for the country, regions and provinces only.</p>` : ""}
    ${outArea && checkSeason ? html`<p>A season it never saw: January–May ${outlook.checkYear}, not an El Niño season, had ${fmt(checkSeason.total)} hotspots, ${checkSeason.total > d3.max(otherPast) ? `above every past season without El Niño (highest ${fmt(d3.max(otherPast))})` : checkSeason.total < d3.min(otherPast) ? `below every past season without El Niño (lowest ${fmt(d3.min(otherPast))})` : `inside the range of past seasons without El Niño (${fmt(d3.min(otherPast))} to ${fmt(d3.max(otherPast))})`}${checkSeason.total > 1.5 * outArea.otherMedian ? ", and well above their usual level: a season can run high without El Niño" : ""}.</p>` : ""}
  </div>
</div>

<p class="hint">A range drawn from past seasons, not a forecast model. It assumes El Niño holds into early ${NEXT} (PAGASA's El Niño Advisory No. 6, 3 November 2026, expects it to last into the first half of ${NEXT}), rests on ${word(elnino.elNinoYears.length)} El Niño seasons (so even by chance a new season falls outside their range about 2 times in ${elnino.elNinoYears.length + 1}), and mixes more burning with clearer skies. Weather, land use and fire control in ${NEXT} decide what actually burns. Red bars with ${NINO_MARK}: El Niño seasons; grey: ${outlook.checkYear}; dashed line: the usual season without El Niño; shaded bar: the ${NEXT} range from past El Niño seasons, with a stroke at its median.</p>

## When does the year burn?

```js
const profile = d3.range(1, 13).map((m) => {
  const v = sel.filter((d) => d.m === m).map((d) => d.hotspots);
  return {m, median: d3.median(v), q1: d3.quantile(v, 0.25), q3: d3.quantile(v, 0.75), max: d3.max(v)};
});
const endYearRows = sel.filter((d) => d.year === endRow.year);
const seasonFigure = display(resize((width) => quiet(Plot.plot({
  width,
  height: 260,
  x: {domain: d3.range(1, 13), tickFormat: (m) => MONTHS[m - 1], label: null},
  y: {label: "Hotspots per month", grid: true},
  ariaLabel: `When the year burns in ${areaTitle}`,
  ariaDescription: `Median hotspots for each calendar month from ${lo} to ${hi}, the middle half of years as a band, and ${endRow.year} as a dashed line.`,
  marks: [
    Plot.areaY(profile, {x: "m", y1: "q1", y2: "q3", fill: "#fdae61", fillOpacity: 0.35, curve: "monotone-x"}),
    Plot.lineY(profile, {x: "m", y: "median", stroke: "#d7301f", strokeWidth: 2, curve: "monotone-x", tip: true}),
    Plot.lineY(endYearRows, {x: "m", y: "hotspots", stroke: "currentColor", strokeDasharray: "4,3", marker: "circle"}),
    Plot.ruleY([0])
  ]
}))));
```

<p class="hint">Solid line: median month across ${lo.slice(0, 4)}–${hi.slice(0, 4)}. Band: middle half of years. Dashed: ${endRow.year}.</p>

## Which years burned most?

```js
const yearly = d3.rollups(sel, (v) => ({total: d3.sum(v, (d) => d.hotspots), months: v.length, source: v[0].source.startsWith("MODIS") ? "MODIS Aqua, converted" : "VIIRS"}), (d) => d.year).map(([year, o]) => ({year, ...o}));
const fullYears = yearly.filter((d) => d.months === 12);
const yearMean = d3.mean(fullYears, (d) => d.total);
// Error marks on converted MODIS years (country and regions only), sized by the held-out test's median error of a region's yearly total.
const YEAR_ERR = validation.T1_leaveOneYearOut_2012_2020.harmonised.annualMedianAbsPctError / 100;
const showYearErr = area.level === "country" || area.level === "region";
const modisYears = yearly.filter((d) => d.year < +meta.viirsStart.slice(0, 4) && d.months === 12);
const yearsFigure = display(resize((width) => quiet(Plot.plot({
  width,
  height: 260,
  x: {label: null, tickFormat: "d", interval: 1},
  y: {label: "Hotspots per year", grid: true},
  ariaLabel: `Hotspots per year in ${areaTitle}`,
  ariaDescription: `Yearly totals on the VIIRS scale; years before 2012 are converted MODIS Aqua.${fullYears.length ? ` Dashed line: the average full year, ${fmt(yearMean)}.` : ""}`,
  color: {domain: ["MODIS Aqua, converted", "VIIRS"], range: ["#fdae61", "#d7301f"], legend: true},
  marks: [
    Plot.barY(yearly, {x: "year", y: "total", fill: "source", tip: {format: {y: (v) => fmt(v)}}}),
    showYearErr ? Plot.ruleX(modisYears, {x: "year", y1: (d) => d.total * (1 - YEAR_ERR), y2: (d) => d.total * (1 + YEAR_ERR), stroke: "currentColor", strokeWidth: 1.5}) : null,
    showYearErr ? Plot.tickY(modisYears.flatMap((d) => [{year: d.year, y: d.total * (1 - YEAR_ERR)}, {year: d.year, y: d.total * (1 + YEAR_ERR)}]), {x: "year", y: "y", stroke: "currentColor", strokeWidth: 1.5, inset: 8}) : null,
    Plot.text(yearly.filter((d) => EL_NINO.has(d.year)), {x: "year", y: (d) => (showYearErr && d.year < +meta.viirsStart.slice(0, 4) ? d.total * (1 + YEAR_ERR) : d.total), text: () => NINO_MARK, dy: -9, fontSize: 13, fill: "currentColor"}),
    fullYears.length ? Plot.ruleY([yearMean], {stroke: "currentColor", strokeDasharray: "4,3"}) : null,
    Plot.ruleY([0])
  ]
}))));
display(ninoLegend());
```

<p class="hint">${fullYears.length ? `Dashed line: the average full year (${fmt(yearMean)}). ` : ""}Partial years in the selection are shorter bars, not quieter years. ${modisYears.length ? (showYearErr ? `The thin bars on the converted MODIS years show ±${Math.round(YEAR_ERR * 100)}%: the typical error of a region's yearly total in the held-out test (median); not a confidence interval.` : `Converted MODIS years carry an error: a region's yearly total is typically off by about ${Math.round(YEAR_ERR * 100)}% in the held-out test, and the error is larger for small areas such as a province or a drawn box.`) : ""}</p>

## Fire intensity at the hotspots

```js
// Fire intensity: fire radiative power (FRP, MW) of the VIIRS hotspots in the harmonised record (pipeline, intensity.csv),
// loaded when this section scrolls into view. MODIS FRP is not comparable (larger pixels) and is not converted.
const intensityRaw = visibility().then(() => FileAttachment("data/intensity.csv").csv());
```

```js
// A drawn box: the same sums from its own VIIRS hotspots (each weighted as in the calendar).
function frpFromPoints(points) {
  const viirs = points.filter((p) => p.month >= meta.viirsStart && /VIIRS/.test(p.satellite) && p.frp !== "");
  return d3.rollups(viirs, (v) => ({n: d3.sum(v, (p) => p.w), frp: d3.sum(v, (p) => +p.frp * p.w), median: d3.median(v, (p) => +p.frp)}), (p) => p.month).map(([month, o]) => ({month, ...o}));
}
const frpMonthly = (area.id === "custom" ? (customPoints ? frpFromPoints(customPoints) : []) : intensityRaw.filter((d) => d.area_id === area.id).map((d) => ({month: d.month, n: +d.viirs_hotspots, frp: +d.frp_total_mw, median: +d.frp_median_mw})))
  .filter((d) => d.month >= lo && d.month <= hi)
  .map((d) => ({...d, date: new Date(d.month + "-15"), year: +d.month.slice(0, 4)}))
  .sort((a, b) => d3.ascending(a.month, b.month));
// A year is full when the selection and the VIIRS record cover all twelve months (months without hotspots have no row in intensity.csv).
const fullFrpYear = (y) => `${y}-01` >= meta.viirsStart && lo <= `${y}-01` && hi >= `${y}-12` && `${y}-12-31` <= meta.lastDate;
const frpYearly = d3.rollups(frpMonthly, (v) => ({frp: d3.sum(v, (d) => d.frp), n: d3.sum(v, (d) => d.n)}), (d) => d.year).map(([year, o]) => ({year, ...o, full: fullFrpYear(year), perHotspot: o.n > 0 ? o.frp / o.n : NaN}));
const partialFrpYears = frpYearly.filter((d) => !d.full).map((d) => d.year);
const frpPeak = d3.greatest(frpMonthly, (d) => d.frp);
const MW = d3.format(",.0f");
const intensityCharts = frpMonthly.length
  ? html`<div class="grid grid-cols-2">
      <div class="card">${resize((width) => quiet(Plot.plot({
        width, height: 230, marginLeft: 60,
        x: {label: null, type: "utc"},
        y: {label: "Fire radiative power, MW (sum)", grid: true, tickFormat: "~s"},
        ariaLabel: `Total fire radiative power per month in ${areaTitle}, VIIRS, ${frpMonthly[0].month} to ${frpMonthly[frpMonthly.length - 1].month}`,
        ariaDescription: `One bar per month: the fire radiative power of every VIIRS hotspot added up.${frpPeak ? ` The highest is ${frpPeak.month}, ${MW(frpPeak.frp)} MW.` : ""}`,
        marks: [Plot.rectY(frpMonthly, {x: "date", interval: "month", y: "frp", fill: "#d7301f", tip: {format: {x: (d) => d3.utcFormat("%b %Y")(d), y: (v) => `${MW(v)} MW`}}}), Plot.ruleY([0])]
      })))}<p class="hint">Fire radiative power of every VIIRS hotspot in the month, added up: it grows with both the number of fires and the power each gives off.</p></div>
      <div class="card">${resize((width) => quiet(Plot.plot({
        width, height: 230, marginLeft: 50,
        x: {label: null, tickFormat: "d", interval: 1},
        y: {label: "MW per hotspot (average)", grid: true, zero: true},
        ariaLabel: `Average fire radiative power per hotspot, each year, ${areaTitle}`,
        ariaDescription: "One bar per year: total fire radiative power divided by the number of VIIRS hotspots. El Niño years are marked with a diamond.",
        marks: [
          Plot.barY(frpYearly, {x: "year", y: "perHotspot", fill: (d) => (d.full ? "#fdae61" : "#d9d9d9"), tip: {format: {y: (v) => `${v.toFixed(1)} MW`, fill: false}}}),
          Plot.text(frpYearly.filter((d) => EL_NINO.has(d.year)), {x: "year", y: "perHotspot", text: () => NINO_MARK, dy: -9, fontSize: 13, fill: "currentColor"}),
          Plot.ruleY([0])
        ]
      })))}<p class="hint">How much radiant power a typical detection gave off: total fire radiative power ÷ hotspots, per year. ${NINO_MARK}: El Niño year.${partialFrpYears.length ? ` Pale bars, years only partly in the selection or the record: ${partialFrpYears.join(", ")}.` : ""}</p></div>
    </div>`
  : html`<p class="hint">No VIIRS hotspots in this selection (VIIRS starts in February 2012).</p>`;
display(intensityCharts);
```

<p class="hint">Fire radiative power (FRP) is the power a fire radiates, as heat and light, at the moment the satellite passes, in megawatts, as reported by NASA FIRMS for each hotspot. Shown for VIIRS only, from February 2012: MODIS measures it over pixels several times larger, so its values are not comparable and are not converted here. NOAA-20 hotspots that stand in for Suomi NPP are weighted as in the calendar. A satellite sees each fire for a moment, twice a day, so this is a snapshot of intensity, not the energy a fire released.</p>

## Day by day

```js
// Daily harmonised hotspots (pipeline, daily.csv: days with hotspots; other days are 0), loaded when this section scrolls into view.
const dailyRaw = visibility().then(() => FileAttachment("data/daily.csv").csv());
```

```js
// Window: the To month and the two months before it, up to the last day of data.
const dayEndIso = hi === allMonths[allMonths.length - 1] ? meta.lastDate : new Date(Date.UTC(+hi.slice(0, 4), +hi.slice(5, 7), 0)).toISOString().slice(0, 10);
const dayStartDate = new Date(Date.UTC(+hi.slice(0, 4), +hi.slice(5, 7) - 3, 1));
const windowDays = d3.utcDay.range(dayStartDate, new Date(new Date(dayEndIso + "T00:00:00Z").getTime() + 864e5)).map((d) => d.toISOString().slice(0, 10)).filter((d) => d >= `${meta.recordStart}-01`);
const dayMap = area.id === "custom"
  ? d3.rollup(customPoints ?? [], (v) => d3.sum(v, (p) => p.w), (p) => p.date)
  : new Map(dailyRaw.filter((d) => d.area_id === area.id).map((d) => [d.date, +d.hotspots_harmonised]));
const gapSet = new Set(meta.gapDates);
// "A usual day": the median of the same calendar day over the full years of the record (the window's own year left out), smoothed over 7 days.
const isRealDay = (x) => !Number.isNaN(Date.parse(x + "T00:00:00Z")) && new Date(x + "T00:00:00Z").toISOString().slice(0, 10) === x;
const usualRaw = windowDays.map((d) => d3.median(d3.range(elnino.years[0], elnino.years[1] + 1).filter((y) => y !== +d.slice(0, 4)).map((y) => `${y}${d.slice(4)}`).filter((x) => isRealDay(x) && !gapSet.has(x)), (x) => dayMap.get(x) ?? 0));
const dayRows = windowDays.map((d, i) => ({date: new Date(d + "T00:00:00Z"), iso: d, hotspots: Math.round((dayMap.get(d) ?? 0) * 10) / 10, gap: gapSet.has(d), usual: d3.mean(usualRaw.slice(Math.max(0, i - 3), i + 4))}));
const dayPeak = d3.greatest(dayRows, (d) => d.hotspots);
display(windowDays.length ? html`<div class="card">${resize((width) => quiet(Plot.plot({
  width, height: 240, marginLeft: 50,
  x: {type: "utc", label: null},
  y: {label: "Hotspots per day (VIIRS-equivalent)", grid: true},
  ariaLabel: `Hotspots per day in ${areaTitle}, ${windowDays[0]} to ${windowDays[windowDays.length - 1]}`,
  ariaDescription: `One bar per day; the dashed line is a usual day: the median of the same day in ${elnino.years[0]}–${elnino.years[1]}, smoothed over a week.${dayPeak && dayPeak.hotspots > 0 ? ` The busiest day was ${dayPeak.iso}, ${fmt(dayPeak.hotspots)} hotspots.` : ""}`,
  marks: [
    Plot.rectY(dayRows, {x: "date", interval: "day", y: "hotspots", fill: "#d7301f", tip: {format: {x: (d) => d3.utcFormat("%a %d %b %Y")(d), y: (v) => fmt(v)}}}),
    Plot.lineY(dayRows, {x: "date", y: "usual", stroke: "currentColor", strokeDasharray: "4,3", strokeWidth: 1.5}),
    Plot.text(dayRows.filter((d) => d.gap), {x: "date", y: 0, text: () => "×", dy: -6, fill: "currentColor"}),
    Plot.ruleY([0])
  ]
})))}</div>` : html`<p class="hint">No days in this window.</p>`);
```

<p class="hint">Each bar is one day, on the same VIIRS scale as the calendar (a month's bars add up to its calendar cell). Dashed line: a usual day, the median of the same calendar day over ${elnino.years[0]}–${elnino.years[1]}, smoothed over a week. × marks a day with no satellite data. Days are FIRMS acquisition dates in UTC. Change "To" to move the window; single days are noisy, so read the run of days, not one day.</p>

## What harmonisation changes

```js
if (area.id === "custom") display(html`<p class="hint">For a custom area the raw counts of each sensor are not kept; choose a region or province to see this chart.</p>`);
const overlap = area.id === "custom" ? [] : sel.filter((d) => d.year >= 2010);
// For the whole country, convert each region with its own k and add them up, as the calendar does.
const nationalAquaK = area.id === "ph" ? d3.rollup(areas.filter((a) => a.level === "region").flatMap((r) => byArea.get(r.id).map((d) => ({month: d.month, v: d.modis_aqua * r.k}))), (v) => d3.sum(v, (d) => d.v), (d) => d.month) : null;
const cmp = overlap.flatMap((d) => [
  {month: new Date(d.month + "-15"), value: d.modis_aqua, series: "MODIS Aqua, raw count"},
  {month: new Date(d.month + "-15"), value: nationalAquaK ? nationalAquaK.get(d.month) : d.modis_aqua * area.k, series: "MODIS Aqua × k (on the VIIRS scale)"},
  ...(d.year >= 2012 ? [{month: new Date(d.month + "-15"), value: d.viirs_snpp, series: "VIIRS Suomi NPP, raw count"}] : [])
]);
const harmonisationFigure = display(resize((width) => quiet(Plot.plot({
  width,
  height: 260,
  x: {label: null},
  y: {label: "Hotspots per month", grid: true},
  ariaLabel: `Raw and converted counts in ${areaTitle} since 2010`,
  ariaDescription: "Monthly MODIS Aqua raw counts, MODIS Aqua multiplied by the conversion factor, and VIIRS Suomi NPP raw counts.",
  color: {legend: true, domain: ["MODIS Aqua, raw count", "MODIS Aqua × k (on the VIIRS scale)", "VIIRS Suomi NPP, raw count"], range: ["#999999", "#fdae61", "#d7301f"]},
  marks: [Plot.lineY(cmp, {x: "month", y: "value", stroke: "series", tip: true}), Plot.ruleY([0])]
}))));
```

<p class="hint">Raw MODIS counts sit far below VIIRS because VIIRS pixels are smaller and catch smaller fires. Scaled by k, the MODIS line tracks VIIRS in the years both flew. How closely it tracks is measured on the <a href="./method">method page</a>.</p>

## Download

```js
function downloadButton(text, filename, makeBlob) {
  const b = html`<button class="dl">${text}</button>`;
  b.onclick = async () => {
    const old = b.textContent;
    b.disabled = true;
    b.textContent = "Preparing…";
    try {
      const blob = await makeBlob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } finally {
      b.disabled = false;
      b.textContent = old;
    }
  };
  return b;
}
const stem = area.id === "custom" && box ? `custom_${box.w}_${box.s}_${box.e}_${box.n}_${lo}_${hi}` : `${area.id}_${lo}_${hi}`;
const custom = area.id === "custom";
const analyticsCsv = () => new Blob([d3.csvFormat(sel.map((d) => ({area: areaTitle, month: d.month, hotspots_viirs_equivalent: d.hotspots, difference_from_month_average: d.anomaly, source: d.source, missing_days: d.gap_days, month_in_progress: d.partial ? "yes" : "", modis_aqua_raw: custom ? "" : d.modis_aqua, modis_terra_raw: custom ? "" : d.modis_terra, viirs_snpp_raw: custom ? "" : d.viirs_snpp, viirs_noaa20_raw: custom ? "" : d.viirs_noaa20, factor_k: custom || area.level === "country" ? "per region" : area.k})))], {type: "text/csv"});
const HOTSPOT_COLUMNS = ["date", "time_utc", "latitude", "longitude", "satellite", "confidence", "frp", "firms_type", "province_id", "region_id", "weight_viirs_equivalent"];
async function hotspotCsv() {
  let rows;
  if (custom) rows = customPoints ?? [];
  else {
    const ids = area.level === "country" ? Object.keys(pointFiles) : [area.level === "region" ? area.id : area.parent];
    rows = (await Promise.all(ids.map(regionRows))).flat();
    if (area.level === "province") rows = rows.filter((r) => r.province_id === area.id);
  }
  const parts = rows.filter((r) => r.month >= lo && r.month <= hi);
  return new Blob([d3.csvFormat(parts, HOTSPOT_COLUMNS)], {type: "text/csv"});
}
const svgBlob = (figure) => () => {
  // A figure may hold a colour legend and the chart; the chart is the tallest SVG.
  const svg = [...figure.querySelectorAll("svg")].sort((x, y) => +y.getAttribute("height") - +x.getAttribute("height"))[0];
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new Blob([new XMLSerializer().serializeToString(clone)], {type: "image/svg+xml"});
};
display(html`<div class="downloads">
  ${downloadButton("Monthly analytics (CSV)", `monthly_${stem}.csv`, analyticsCsv)}
  ${downloadButton("Hotspots in this search (CSV)", `hotspots_${stem}.csv`, hotspotCsv)}
  ${downloadButton("Calendar image (SVG)", `calendar_${stem}.svg`, svgBlob(calendarFigure))}
  ${downloadButton("Season chart (SVG)", `season_${stem}.svg`, svgBlob(seasonFigure))}
  ${downloadButton("Yearly totals chart (SVG)", `years_${stem}.svg`, svgBlob(yearsFigure))}
  ${custom ? "" : downloadButton("Harmonisation chart (SVG)", `harmonisation_${stem}.svg`, svgBlob(harmonisationFigure))}
  ${downloadButton("Province map (SVG)", `map_${stem}.svg`, svgBlob(mapFigure))}
</div>`);
```

<p class="hint">The hotspot file lists every detection that makes up the harmonised record for this area and period, with a weight that puts it on the VIIRS scale (1 for Suomi NPP, k for MODIS Aqua, f for NOAA-20 on the days it stands in for Suomi NPP). Summing the weights by month gives the calendar. ${area.level === "country" ? "For the whole country this file is large (up to about 30 MB)." : ""}</p>

<p class="hint">Data run from ${meta.recordStart} to ${meta.lastDate}. Designed for provincial fire officers (Bureau of Fire Protection), DENR forestry offices and local disaster risk reduction and management offices. The calendar describes the past; the El Niño outlook is a range from past seasons, not a forecast model.</p>

## Tell us what to fix

<p class="hint">Found a mistake, something unclear, or something you need? Send it to the team as an issue on GitHub. It opens a short form that already links to the view you are looking at. You need a free GitHub account, and what you write is public, so leave out personal details.</p>

```js
// Feedback goes to the public repository as a GitHub issue, pre-filled with a link to the current view (read at click time).
const ISSUES = "https://github.com/RVBCosme/siklab-hotspot-calendar/issues/new";
const feedbackLink = html`<a class="feedback" href=${ISSUES} target="_blank" rel="noopener">Send feedback on GitHub (opens in a new tab)</a>`;
feedbackLink.onclick = () => {
  const body = `View I was looking at: ${location.href}

What were you trying to do?


What was wrong, unclear or missing?


What would you use this for?
`;
  feedbackLink.href = `${ISSUES}?${new URLSearchParams({title: "Feedback: ", body})}`;
};
display(feedbackLink);
```

<style>
.band { margin: 0.2rem 0 1rem; }
.band h1 { font-size: 2.7rem; line-height: 1.05; margin: 0; max-width: none; letter-spacing: -0.01em; }
.tagline { font-size: 1.25rem; line-height: 1.4; margin: 0.4rem 0 1rem; max-width: 46rem; color: var(--theme-foreground-muted); }
.band-figures { list-style: none; padding: 0; margin: 0 0 1rem; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.6rem 2rem; max-width: 72rem; }
.band-figures li { display: flex; align-items: baseline; gap: 0.6rem; margin: 0; }
.band-figures b { font-size: 2.1rem; line-height: 1; color: #d7301f; font-variant-numeric: tabular-nums; white-space: nowrap; }
.band-figures span { font-size: 0.9rem; line-height: 1.35; }
.ribbon { margin: 0; max-width: 72rem; }
.ribbon .cells, .ribbon .months { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 2px; }
.ribbon .cells span { height: 12px; }
.ribbon .cells span:first-child { border-radius: 3px 0 0 3px; }
.ribbon .cells span:last-child { border-radius: 0 3px 3px 0; }
.ribbon .months span { font-size: 0.72rem; line-height: 1.5; text-align: center; color: var(--theme-foreground-muted); }
.ribbon figcaption { font-size: 0.8rem; color: var(--theme-foreground-muted); }
.strip { margin: 0.2rem 0 1.4rem; max-width: 72rem; }
.strip h2 { font-size: 1rem; margin: 0 0 0.5rem; }
.strip-items { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.6rem 2rem; }
.strip-item { display: flex; align-items: baseline; gap: 0.6rem; color: inherit; }
#observablehq-main a.strip-item { text-decoration: none; }
a.strip-item span { text-decoration: underline; text-underline-offset: 2px; text-decoration-color: var(--theme-foreground-faint); }
.strip-item b { font-size: 1.6rem; line-height: 1; white-space: nowrap; font-variant-numeric: tabular-nums; }
.strip-item span { font-size: 0.88rem; line-height: 1.35; }
#el-nino:focus { outline: none; }
#el-nino:focus-visible { outline: 2px solid var(--theme-foreground-focus); outline-offset: 2px; }
@media (max-width: 640px) { .band h1 { font-size: 2.1rem; } .band-figures, .strip-items { grid-template-columns: 1fr; } }
.hint { color: var(--theme-foreground-muted); font-size: 0.9rem; max-width: 60rem; }
.big { font-size: 2.2rem; font-weight: 700; }
.controls form { margin-bottom: 0.4rem; }
@media (min-width: 1280px) { .controls > .observablehq { display: grid; grid-template-rows: repeat(3, auto); grid-auto-flow: column; column-gap: 2rem; align-items: start; } .controls .share { justify-self: start; } }
.controls input[type="radio"], .map-grid input[type="radio"] { width: 20px; height: 20px; margin: 2px 0.4rem 2px 0; vertical-align: middle; }
.controls form label { margin-right: 0.6rem; }
.downloads { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.dl { padding: 0.5rem 0.9rem; font: inherit; cursor: pointer; }
.picker .map { height: 420px; border-radius: 6px; margin-bottom: 0.6rem; }
.picker .coords { display: flex; flex-wrap: wrap; gap: 0.5rem 0.9rem; align-items: center; }
.picker .coords input { width: 6.5rem; font: inherit; }
.picker .coords button { font: inherit; padding: 0.35rem 0.7rem; cursor: pointer; }
@media (max-width: 640px) { .picker .map { height: 320px; } .big { font-size: 1.8rem; } }
.how-to-read { max-width: 60rem; padding-left: 1.4rem; line-height: 1.55; }
.how-to-read li { margin: 0.2rem 0; }
.explain { max-width: 60rem; margin: 0.6rem 0 1.2rem; border-left: 3px solid #fdae61; padding: 0.3rem 0 0.3rem 0.9rem; }
.explain summary { cursor: pointer; font-weight: 600; }
.explain p { line-height: 1.6; }
.plain { max-width: 60rem; font-size: 1.08rem; line-height: 1.6; border-left: 3px solid #d7301f; padding: 0.1rem 0 0.1rem 1rem; }
.plain p { margin: 0.45rem 0; max-width: none; }
.feedback { display: inline-block; margin: 0.2rem 0 1rem; font-weight: 600; }
.share { margin-top: 0.5rem; padding: 0.35rem 0.8rem; font: inherit; cursor: pointer; }
.map-grid { grid-auto-rows: auto; }
.map-grid .card { margin: 0; }
.map-grid > .card { min-height: 420px; }
.map-side { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
.nino-panel h3 { margin: 0 0 0.2rem; }
.nino-panel p { margin: 0.4rem 0; }
.nino-panel .big { color: #d7301f; margin-right: 0.3rem; }
.nino-panel .too-few { font-size: 1.5rem; color: inherit; }
.nino-caution { font-size: 0.9rem; border-left: 3px solid #fdae61; }
.nino-caution p { margin: 0; }
.outlook-grid { grid-auto-rows: auto; }
.outlook-grid .card { margin: 0; }
.outlook p { margin: 0.45rem 0; }
.outlook-lead { font-size: 1.05rem; }
.cal3d { margin: 0.4rem 0 1rem; }
.cal3d summary { cursor: pointer; font-weight: 600; }
.cal3d input[type="radio"] { width: 20px; height: 20px; margin: 2px 0.4rem 2px 0; vertical-align: middle; }
.nino-legend { font-size: 0.85rem; color: var(--theme-foreground-muted); margin: 0.2rem 0 0.8rem; max-width: 60rem; }
.all-provinces { margin: 0.8rem 0; }
.all-provinces summary { cursor: pointer; font-weight: 600; margin-bottom: 0.5rem; }
#calendar:focus { outline: none; }
#calendar:focus-visible { outline: 2px solid var(--theme-foreground-focus); outline-offset: 4px; }
.hint a, .plain a, .explain a { text-decoration: underline; text-underline-offset: 2px; }
.ranked h3 { margin-top: 0; }
.ranked ol { padding-left: 1.4rem; margin: 0; }
.ranked li { margin: 0.25rem 0; }
.ranked .row { position: relative; display: flex; justify-content: space-between; align-items: baseline; gap: 0.6rem; padding: 0.1rem 0 0.45rem; }
.ranked button { font: inherit; text-align: left; background: none; border: 0; padding: 0; color: var(--theme-foreground-focus); text-decoration: underline; text-underline-offset: 2px; cursor: pointer; min-height: 1.6rem; }
.ranked .num { white-space: nowrap; color: var(--theme-foreground-muted); font-size: 0.9rem; font-variant-numeric: tabular-nums; }
.ranked .bar { position: absolute; left: 0; bottom: 0; height: 3px; background: #fdae61; border-radius: 2px; }
button:focus-visible, summary:focus-visible { outline: 2px solid var(--theme-foreground-focus); outline-offset: 2px; }
</style>
