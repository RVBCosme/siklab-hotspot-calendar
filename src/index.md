---
title: Calendar
---

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
const areaOptions = [
  ...areas.filter((a) => a.level === "country"),
  ...areas.filter((a) => a.level === "region").sort((a, b) => d3.ascending(a.name, b.name)),
  ...areas.filter((a) => a.level === "province").sort((a, b) => d3.ascending(a.name, b.name))
];
const label = (a) => (a.level === "province" ? `${a.name} (province, ${regionName.get(a.parent)})` : a.level === "region" ? `${a.name} (region)` : a.name);
```

<div class="card controls">

```js
const area = view(Inputs.select(areaOptions, {label: "Area", format: label, value: areaOptions[0]}));
const fromMonth = view(Inputs.select(allMonths, {label: "From", value: allMonths[0]}));
const toMonth = view(Inputs.select(allMonths, {label: "To", value: allMonths[allMonths.length - 1]}));
```

</div>

```js
const lo = fromMonth <= toMonth ? fromMonth : toMonth;
const hi = fromMonth <= toMonth ? toMonth : fromMonth;
const series = byArea.get(area.id) ?? [];
const sel = series.filter((d) => d.month >= lo && d.month <= hi);
const years = [...new Set(sel.map((d) => d.year))].sort((a, b) => b - a).map(String);
const fmt = d3.format(",.0f");
```

## Burning activity calendar: ${area.name}, ${lo} to ${hi}

<p class="hint">Each cell is one month. Colour shows the number of hotspots on the VIIRS scale. Cells before February 2012 come from MODIS Aqua converted with this area's factor (k = ${area.k.toFixed(2)}); cells from February 2012 come from VIIRS. A dot marks a month with a week or more of missing satellite data, which reads lower than it was.</p>

```js
function calendar(width) {
  return Plot.plot({
    width,
    height: 40 + years.length * 18,
    marginLeft: 44,
    padding: 0.06,
    x: {domain: d3.range(1, 13), tickFormat: (m) => MONTHS[m - 1], label: null, axis: "top"},
    y: {domain: years, label: null},
    color: {type: "sqrt", scheme: "YlOrRd", label: "Hotspots (VIIRS-equivalent)", legend: true, zero: true, ticks: 5, tickFormat: "~s", width: 360},
    marks: [
      Plot.cell(sel, {
        x: "m",
        y: (d) => String(d.year),
        fill: "hotspots",
        inset: 0.5,
        channels: {Month: "month", Source: "source", "Missing days": "gap_days"},
        tip: {format: {x: false, y: false, fill: (v) => fmt(v)}}
      }),
      Plot.dot(sel.filter((d) => d.gap_days >= 7), {x: "m", y: (d) => String(d.year), r: 2.5, fill: "currentColor"})
    ]
  });
}
const calendarFigure = display(resize((width) => calendar(width)));
```

```js
// "How does the latest month compare?" — the selected end month against the same month in every other year of the record.
const endRow = series.find((d) => d.month === hi);
const sameMonth = series.filter((d) => d.m === endRow.m && d.year !== endRow.year);
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
    <p>hotspots (VIIRS-equivalent) in ${area.name}${partial ? " so far this month" : ""}</p>
  </div>
  <div class="card">
    <h2>Against the historical median</h2>
    <span class="big">${med > 0 ? d3.format("+.0%")(endRow.hotspots / med - 1) : "n/a"}</span>
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
display(resize((width) => Plot.plot({
  width,
  height: 260,
  x: {domain: d3.range(1, 13), tickFormat: (m) => MONTHS[m - 1], label: null},
  y: {label: "Hotspots per month", grid: true},
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
display(resize((width) => Plot.plot({
  width,
  height: 260,
  x: {label: null, tickFormat: "d", interval: 1},
  y: {label: "Hotspots per year", grid: true},
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
const overlap = sel.filter((d) => d.year >= 2010);
const cmp = overlap.flatMap((d) => [
  {month: new Date(d.month + "-15"), value: d.modis_aqua, series: "MODIS Aqua, raw count"},
  {month: new Date(d.month + "-15"), value: d.modis_aqua * area.k, series: "MODIS Aqua × k (on the VIIRS scale)"},
  ...(d.year >= 2012 ? [{month: new Date(d.month + "-15"), value: d.viirs_snpp, series: "VIIRS Suomi NPP, raw count"}] : [])
]);
display(resize((width) => Plot.plot({
  width,
  height: 260,
  x: {label: null},
  y: {label: "Hotspots per month", grid: true},
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
const stem = `${area.id}_${lo}_${hi}`;
const analyticsCsv = () => new Blob([d3.csvFormat(sel.map((d) => ({area: area.name, month: d.month, hotspots_viirs_equivalent: d.hotspots, source: d.source, missing_days: d.gap_days, modis_aqua_raw: d.modis_aqua, modis_terra_raw: d.modis_terra, viirs_snpp_raw: d.viirs_snpp, viirs_noaa20_raw: d.viirs_noaa20, factor_k: area.k})))], {type: "text/csv"});
async function hotspotCsv() {
  const ids = area.level === "country" ? Object.keys(pointFiles) : [area.level === "region" ? area.id : area.parent];
  const parts = [];
  for (const id of ids) {
    const rows = await pointFiles[id].csv();
    for (const r of rows) {
      if (r.date.slice(0, 7) < lo || r.date.slice(0, 7) > hi) continue;
      if (area.level === "province" && r.province_id !== area.id) continue;
      parts.push({...r, region_id: id});
    }
  }
  return new Blob([d3.csvFormat(parts)], {type: "text/csv"});
}
const svgBlob = () => {
  // The figure holds the colour legend and the calendar; the calendar is the tallest SVG.
  const svg = [...calendarFigure.querySelectorAll("svg")].sort((x, y) => +y.getAttribute("height") - +x.getAttribute("height"))[0];
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new Blob([new XMLSerializer().serializeToString(clone)], {type: "image/svg+xml"});
};
display(html`<div class="downloads">
  ${downloadButton("Monthly analytics (CSV)", `monthly_${stem}.csv`, analyticsCsv)}
  ${downloadButton("Hotspots in this search (CSV)", `hotspots_${stem}.csv`, hotspotCsv)}
  ${downloadButton("Calendar image (SVG)", `calendar_${stem}.svg`, svgBlob)}
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
</style>
