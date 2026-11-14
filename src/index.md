---
title: Calendar
---

<!-- Written with AI assistance (Claude Code, Anthropic) during NASA Space Apps 2026, 14 Nov 2026; see README and logs/. -->

# Philippine burning activity calendar

<p class="lede">How many fire hotspots did satellites see, month by month since 2003, in a Philippine region or province? MODIS and VIIRS count fire very differently, so this calendar puts both on one scale: the sensor that saw a fire no longer changes the number you read.</p>

```js
const areas = FileAttachment("data/areas.json").json();
const monthlyRaw = FileAttachment("data/monthly.csv").csv();
const meta = FileAttachment("data/meta.json").json();
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
const area = view(Inputs.select(areaOptions, {label: "Area", format: label, value: areaOptions[0]}));
const fromMonth = view(Inputs.select(allMonths, {label: "From", value: allMonths[0]}));
const toMonth = view(Inputs.select(allMonths, {label: "To", value: allMonths[allMonths.length - 1]}));
const colourBy = view(Inputs.radio(["Number of hotspots", "Difference from the average for that month"], {label: "Colour by", value: "Number of hotspots"}));
const ramp = view(Inputs.select(new Map([["Yellow–orange–red (ColorBrewer, colour-blind safe)", "ylorrd"], ["Viridis (colour-blind safe)", "viridis"]]), {label: "Colour ramp"}));
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
const picker = area.id === "custom" ? areaPicker({w: 120.4, s: 16.2, e: 121.0, n: 16.8}) : null;
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
  display(html`<p class="hint">${fmt(inRange.length)} hotspots in this box from ${lo} to ${hi}${inRange.length > shown.length ? `; the map shows a random ${fmt(shown.length)} of them` : ""}. Light orange: MODIS Aqua (before February 2012); red: VIIRS.</p>`);
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
```

## Burning activity calendar: ${areaTitle}, ${lo} to ${hi}

<p class="hint">Each cell is one month. ${colourBy === "Number of hotspots" ? "Colour shows the number of hotspots on the VIIRS scale." : "Colour shows how far each month is above (red) or below (blue) the average for that calendar month over every complete month of the record; a month still in progress is compared with the same share of the average."} Cells before February 2012 come from MODIS Aqua converted with ${area.id === "custom" ? "the factor of the region each hotspot is in" : `this area's factor (k = ${area.k.toFixed(2)})`}; cells from February 2012 come from VIIRS. A dot marks a month with a week or more of missing satellite data, which reads lower than it was.</p>

```js
const byCount = colourBy === "Number of hotspots";
function calendar(width) {
  return Plot.plot({
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
  });
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
const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th");
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
    <span class="big">${ordinal(rank)}</span>
    <p>busiest ${MONTHS[endRow.m - 1]} of ${sameMonth.length + 1} since ${series[0].year}${partial ? ", at the same point in the month" : ""}</p>
  </div>
</div>

<p class="hint">${partial ? `${MONTHS[endRow.m - 1]} ${endRow.year} is still in progress: the comparison scales other years' ${MONTHS[endRow.m - 1]} to its first ${endRow.days} days, assuming hotspots spread evenly through the month. ` : ""}${endRow.gap_days > 0 ? `Warning: ${endRow.gap_days} day(s) of ${MONTHS[endRow.m - 1]} ${endRow.year} have no satellite data, so this month reads low.` : ""} Change "To" to compare any other month.</p>

## When does the year burn?

```js
const profile = d3.range(1, 13).map((m) => {
  const v = sel.filter((d) => d.m === m).map((d) => d.hotspots);
  return {m, median: d3.median(v), q1: d3.quantile(v, 0.25), q3: d3.quantile(v, 0.75), max: d3.max(v)};
});
const endYearRows = sel.filter((d) => d.year === endRow.year);
const seasonFigure = display(resize((width) => Plot.plot({
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
})));
```

<p class="hint">Solid line: median month across ${lo.slice(0, 4)}–${hi.slice(0, 4)}. Band: middle half of years. Dashed: ${endRow.year}.</p>

## Which years burned most?

```js
const yearly = d3.rollups(sel, (v) => ({total: d3.sum(v, (d) => d.hotspots), months: v.length, source: v[0].source.startsWith("MODIS") ? "MODIS Aqua, converted" : "VIIRS"}), (d) => d.year).map(([year, o]) => ({year, ...o}));
const fullYears = yearly.filter((d) => d.months === 12);
const yearMean = d3.mean(fullYears, (d) => d.total);
const yearsFigure = display(resize((width) => Plot.plot({
  width,
  height: 260,
  x: {label: null, tickFormat: "d", interval: 1},
  y: {label: "Hotspots per year", grid: true},
  ariaLabel: `Hotspots per year in ${areaTitle}`,
  ariaDescription: `Yearly totals on the VIIRS scale; years before 2012 are converted MODIS Aqua. Dashed line: the average full year, ${fmt(yearMean)}.`,
  color: {domain: ["MODIS Aqua, converted", "VIIRS"], range: ["#fdae61", "#d7301f"], legend: true},
  marks: [
    Plot.barY(yearly, {x: "year", y: "total", fill: "source", tip: {format: {y: (v) => fmt(v)}}}),
    Plot.ruleY([yearMean], {stroke: "currentColor", strokeDasharray: "4,3"}),
    Plot.ruleY([0])
  ]
})));
```

<p class="hint">Dashed line: the average full year (${fmt(yearMean)}). Partial years in the selection are shorter bars, not quieter years.</p>

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
const harmonisationFigure = display(resize((width) => Plot.plot({
  width,
  height: 260,
  x: {label: null},
  y: {label: "Hotspots per month", grid: true},
  ariaLabel: `Raw and converted counts in ${areaTitle} since 2010`,
  ariaDescription: "Monthly MODIS Aqua raw counts, MODIS Aqua multiplied by the conversion factor, and VIIRS Suomi NPP raw counts.",
  color: {legend: true, domain: ["MODIS Aqua, raw count", "MODIS Aqua × k (on the VIIRS scale)", "VIIRS Suomi NPP, raw count"], range: ["#999999", "#fdae61", "#d7301f"]},
  marks: [Plot.lineY(cmp, {x: "month", y: "value", stroke: "series", tip: true}), Plot.ruleY([0])]
})));
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
const analyticsCsv = () => new Blob([d3.csvFormat(sel.map((d) => ({area: areaTitle, month: d.month, hotspots_viirs_equivalent: d.hotspots, difference_from_month_average: d.anomaly, source: d.source, missing_days: d.gap_days, month_in_progress: d.partial ? "yes" : "", modis_aqua_raw: custom ? "" : d.modis_aqua, modis_terra_raw: custom ? "" : d.modis_terra, viirs_snpp_raw: custom ? "" : d.viirs_snpp, viirs_noaa20_raw: custom ? "" : d.viirs_noaa20, factor_k: custom ? "per region" : area.k})))], {type: "text/csv"});
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
</div>`);
```

<p class="hint">The hotspot file lists every detection that makes up the harmonised record for this area and period, with a weight that puts it on the VIIRS scale (1 for VIIRS, k for MODIS Aqua). Summing the weights by month gives the calendar. ${area.level === "country" ? "For the whole country this file is large (up to about 30 MB)." : ""}</p>

<p class="hint">Data run from ${meta.recordStart} to ${meta.lastDate}. Designed for fire officers, land managers, emergency responders and researchers. It describes the past and does not forecast.</p>

<style>
.lede { font-size: 1.1rem; max-width: 60rem; }
.hint { color: var(--theme-foreground-muted); font-size: 0.9rem; max-width: 60rem; }
.big { font-size: 2.2rem; font-weight: 700; }
.controls form { margin-bottom: 0.4rem; }
.downloads { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.dl { padding: 0.5rem 0.9rem; font: inherit; cursor: pointer; }
.picker .map { height: 420px; border-radius: 6px; margin-bottom: 0.6rem; }
.picker .coords { display: flex; flex-wrap: wrap; gap: 0.5rem 0.9rem; align-items: center; }
.picker .coords input { width: 6.5rem; font: inherit; }
.picker .coords button { font: inherit; padding: 0.35rem 0.7rem; cursor: pointer; }
@media (max-width: 640px) { .picker .map { height: 320px; } .big { font-size: 1.8rem; } }
</style>
