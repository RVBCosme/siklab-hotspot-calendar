---
title: Calendar
---

<!-- Written with AI assistance (Claude Code, Anthropic) during NASA Space Apps 2026, 14 Nov 2026; see README. -->

# Philippine burning activity calendar

<p class="lede">How many fire hotspots did satellites see, month by month since 2003, in a Philippine region or province? MODIS and VIIRS count fire very differently, so this calendar puts both on one scale: the sensor that saw a fire no longer changes the number you read.</p>

<ol class="how-to-read">
  <li>Pick a place: the whole country, a region, a province, or a box you draw on a map. You can also click a province on the map further down.</li>
  <li>Pick the months to look at with From and To.</li>
  <li>Read the colours. Each square in the calendar is one month; the darker it is, the more fire hotspots the satellites saw.</li>
</ol>

<details class="explain">
  <summary>Explain it simply: what is a hotspot, and why two kinds of satellite?</summary>
  <p><b>What is a hotspot?</b> Satellites circle the Earth carrying cameras that sense heat. When a patch of ground is much hotter than the land around it, usually because something is burning, the satellite marks it. Each mark is a hotspot. One big fire can make many hotspots, and a fire under thick cloud makes none.</p>
  <p><b>Why two kinds of satellite?</b> An older camera called MODIS has marked hotspots since 2000. A newer, sharper one called VIIRS started in 2012. It notices smaller fires, so over the Philippines it marks about ${Math.round(meta.factors.ph.k)} hotspots for every one that MODIS marks. Put end to end, the two records would make it look as if fires jumped in 2012, when only the camera changed.</p>
  <p><b>What did we do about it?</b> For each region we counted how many VIIRS hotspots matched one MODIS hotspot in the years both cameras were watching (2012 to 2020), and used that number to convert the older years. Then we tested it on years the conversion never saw: a region's yearly total came out within about ${validation.T1_leaveOneYearOut_2012_2020.harmonised.annualMedianAbsPctError}% of what VIIRS recorded, in a typical case. That conversion is what "harmonised" means on this site.</p>
  <p><b>What it cannot tell you.</b> A hotspot count is not the number of fires or the area burned. Clouds hide fires, so rainy months read low. The calendar shows the past; it does not forecast.</p>
</details>

```js
const areas = FileAttachment("data/areas.json").json();
const monthlyRaw = FileAttachment("data/monthly.csv").csv();
const meta = FileAttachment("data/meta.json").json();
const validation = FileAttachment("data/validation.json").json();
const provinceShapes = FileAttachment("data/provinces.json").json();
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
    marginLeft: 44,
    padding: 0.06,
    x: {domain: d3.range(1, 13), tickFormat: (m) => MONTHS[m - 1], label: null, axis: "top"},
    y: {domain: years, label: null},
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
```

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

## Where was it burning?

```js
// Province map of the selection. Areas are in km² on the sphere (d3.geoArea × Earth's radius²).
const EARTH_RADIUS_KM = 6371.0088;
const provinceKm2 = new Map(provinceShapes.features.map((f) => [f.properties.id, d3.geoArea(f) * EARTH_RADIUS_KM ** 2]));
```

```js
// Per province: hotspots over the period (and per 100 km², so large and small provinces compare fairly),
// and the end month against that province's average for the same calendar month (as in the calendar).
const provinceStats = provinceShapes.features.map((f) => {
  const id = f.properties.id;
  const rows = byArea.get(id) ?? [];
  const total = d3.sum(rows, (d) => (d.month >= lo && d.month <= hi ? d.hotspots : 0));
  const end = rows.find((d) => d.month === hi);
  const average = d3.mean(rows.filter((d) => d.m === end.m && isFullMonth(d)), (d) => d.hotspots) * (end.days / daysIn(end));
  return {id, name: f.properties.name, parent: f.properties.parent, total, density: (100 * total) / provinceKm2.get(id), end: end.hotspots, average, diff: end.hotspots - average};
});
// Metro Manila's hotspots are mostly industrial and other static heat sources, and its factor rests on few detections (method page, Limits).
const ncrStaticPct = Math.round((100 * meta.stats.pointsNcrStaticSource) / meta.stats.pointsNcr);
const ncrNote = `Metro Manila's four districts are not ranked here: ${ncrStaticPct}% of their hotspots are industrial or other static heat sources (FIRMS type 2), not vegetation fires. They are on the map and in the table`;
const statById = new Map(provinceStats.map((d) => [d.id, d]));
const mapValue = (id) => (byCount ? statById.get(id).density : statById.get(id).diff);
function provinceMap(width) {
  const features = provinceShapes.features;
  const chosen = features.filter((f) => (area.level === "province" ? f.properties.id === area.id : area.level === "region" ? f.properties.parent === area.id : false));
  const tipText = (f) => {
    const s = statById.get(f.properties.id);
    const caution = s.parent === "r-ncr" ? `\nAbout ${ncrStaticPct}% are industrial heat sources, not vegetation fires` : "";
    return byCount
      ? `${s.name}\n${fmt(s.total)} hotspots, ${lo} to ${hi}\n${s.density.toFixed(1)} per 100 km²${caution}\nClick to see its calendar`
      : `${s.name}\n${MONTHS[endRow.m - 1]} ${endRow.year}: ${fmt(s.end)} hotspots\nAverage of every complete ${MONTHS[endRow.m - 1]}${partial ? " (same days)" : ""}: ${fmt(s.average)}${caution}\nClick to see its calendar`;
  };
  // Height from the islands' own shape at this width (Mercator), capped so the map fits a screen.
  const [[, y0], [, y1]] = d3.geoPath(d3.geoMercator().fitWidth(width - 20, provinceShapes)).bounds(provinceShapes);
  const plot = Plot.plot({
    width,
    height: Math.round(Math.min(y1 - y0 + 20, 720)),
    projection: {type: "mercator", domain: provinceShapes, inset: 10},
    ariaLabel: `Map of Philippine provinces, ${byCount ? `hotspots per 100 km² from ${lo} to ${hi}` : `${MONTHS[endRow.m - 1]} ${endRow.year} against each province's average`}`,
    ariaDescription: "Each province is coloured by its value. The list next to the map names the top provinces with their values; choose one there to open its calendar.",
    color: byCount
      ? {type: "sqrt", scheme: ramp, zero: true, legend: true, label: "Hotspots per 100 km²", width: 300}
      : {type: "diverging-sqrt", scheme: "rdbu", reverse: true, pivot: 0, legend: true, label: `${MONTHS[endRow.m - 1]} ${endRow.year}: above (+) or below (−) the average`, tickFormat: "+~s", width: 300},
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
  .filter((d) => d.parent !== "r-ncr" && (byCount ? d.total > 0 : d.diff > 0))
  .sort((a, b) => mapValue(b.id) - mapValue(a.id))
  .slice(0, 10);
const rankMax = d3.max(ranking, (d) => mapValue(d.id)) || 1;
const rankedList = html`<div class="ranked">
  <h3>${byCount ? "Most hotspots for their size (per 100 km²)" : `Most above their average, ${MONTHS[endRow.m - 1]} ${endRow.year} (hotspots)`}</h3>
  ${ranking.length
    ? html`<ol>${ranking.map((d) => html`<li><div class="row">
        <span><button type="button" onclick=${() => selectArea(d.id)}>${d.name}</button></span>
        <span class="num">${byCount ? d.density.toFixed(1) : `+${fmt(d.diff)}`}</span>
        <span class="bar" style=${`width: ${(100 * mapValue(d.id)) / rankMax}%`}></span>
      </div></li>`)}</ol>`
    : html`<p class="hint">No province is above its average in ${MONTHS[endRow.m - 1]} ${endRow.year}.</p>`}
  <p class="hint">${ncrNote}; see <a href="./method#limits">Limits</a>.</p>
</div>`;
// Every province's value as a sortable table: the keyboard and screen-reader route to what the map shows by colour.
const provinceTable = Inputs.table(
  provinceStats.map((d) => ({Province: d.name, Region: regionName.get(d.parent), [`Hotspots, ${lo} to ${hi}`]: Math.round(d.total), "Per 100 km²": +d.density.toFixed(1), [`${MONTHS[endRow.m - 1]} ${endRow.year}`]: Math.round(d.end), [`Average ${MONTHS[endRow.m - 1]}${partial ? " (same days)" : ""}`]: Math.round(d.average)})),
  {sort: byCount ? "Per 100 km²" : `${MONTHS[endRow.m - 1]} ${endRow.year}`, reverse: true, rows: 12, select: false}
);
```

<div class="grid grid-cols-3 map-grid">
  <div class="card grid-colspan-2">${mapFigure}</div>
  <div class="card">${rankedList}</div>
</div>

<details class="all-provinces">
  <summary>All 87 provinces as a table</summary>
  ${provinceTable}
</details>

<p class="hint">Each shape is a province, ${byCount ? `coloured by hotspots per 100 km² from ${lo} to ${hi}, so large and small provinces can be compared fairly` : `coloured by how far ${MONTHS[endRow.m - 1]} ${endRow.year} sits above (red) or below (blue) the average of every complete ${MONTHS[endRow.m - 1]} in that province, as in the calendar`}. Click a province, or a name in the list, to open its calendar. The map shows data up to ${meta.lastDate}, refreshed by hand from NASA FIRMS; it is not live. For today's detections, see NASA's <a href="https://firms.modaps.eosdis.nasa.gov/map/" target="_blank" rel="noopener">FIRMS Fire Map</a> (an external NASA site).</p>

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
    fullYears.length ? Plot.ruleY([yearMean], {stroke: "currentColor", strokeDasharray: "4,3"}) : null,
    Plot.ruleY([0])
  ]
}))));
```

<p class="hint">${fullYears.length ? `Dashed line: the average full year (${fmt(yearMean)}). ` : ""}Partial years in the selection are shorter bars, not quieter years.</p>

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

<p class="hint">Data run from ${meta.recordStart} to ${meta.lastDate}. Designed for fire officers, land managers, emergency responders and researchers. It describes the past and does not forecast.</p>

<style>
.lede { font-size: 1.1rem; max-width: 60rem; }
.hint { color: var(--theme-foreground-muted); font-size: 0.9rem; max-width: 60rem; }
.big { font-size: 2.2rem; font-weight: 700; }
.controls form { margin-bottom: 0.4rem; }
.controls input[type="radio"] { width: 20px; height: 20px; margin: 2px 0.4rem 2px 0; vertical-align: middle; }
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
.share { margin-top: 0.5rem; padding: 0.35rem 0.8rem; font: inherit; cursor: pointer; }
.map-grid { grid-auto-rows: auto; }
.map-grid .card { margin: 0; min-height: 420px; }
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
