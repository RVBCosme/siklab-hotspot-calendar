---
title: Demo (7 slides)
toc: false
sidebar: false
header: false
footer: false
pager: false
---

<!-- Written with AI assistance (Claude Code, Anthropic) during NASA Space Apps 2026, 14 Nov 2026; see README and logs/. -->

```js
const monthlyRaw = FileAttachment("data/monthly.csv").csv();
const v = FileAttachment("data/validation.json").json();
const meta = FileAttachment("data/meta.json").json();
```

```js
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const rows = monthlyRaw.map((d) => ({id: d.area_id, month: d.month, year: +d.month.slice(0, 4), m: +d.month.slice(5, 7), h: +d.hotspots_harmonised, aqua: +d.modis_aqua, snpp: +d.viirs_snpp}));
const benguet = rows.filter((d) => d.id === "p-benguet");
const ph = rows.filter((d) => d.id === "ph");
const lastYear = d3.max(ph, (d) => d.year);
const fmt = d3.format(",.0f");
const T1 = v.T1_leaveOneYearOut_2012_2020;
```

<p class="deck-help"><a href="./siklab-demo-slides.pdf" download>Download these 7 slides as a PDF</a> · Arrow keys move between slides.</p>

<div class="slide title-slide">
  <p class="kicker">NASA Space Apps Challenge 2026 · Harmonization of MODIS and VIIRS Hot Spots · Manila</p>
  <h1>One fire calendar for the Philippines, whichever satellite saw the fire</h1>
  <p class="who">Team Siklab: Rene Vincent Cosme, Prince Zablan, Charles Derick Yu and Gerardo Razon</p>
  <p class="slide-no">1 / 7</p>
</div>

<div class="slide">
  <h2>The problem: the record breaks in 2012</h2>

```js
const raw = ph.filter((d) => d.year >= 2008 && d.year <= 2016).flatMap((d) => [
  {t: new Date(d.month + "-15"), v: d.aqua, s: "MODIS Aqua (since 2002)"},
  ...(d.year >= 2012 ? [{t: new Date(d.month + "-15"), v: d.snpp, s: "VIIRS Suomi NPP (since 2012)"}] : [])
]);
display(Plot.plot({width: 900, height: 285, marginLeft: 56, style: {fontSize: "14px"}, y: {label: "Hotspots per month, raw", grid: true}, x: {label: null}, color: {legend: true, range: ["#888", "#d7301f"]}, marks: [Plot.lineY(raw, {x: "t", y: "v", stroke: "s", strokeWidth: 2}), Plot.ruleY([0])]}));
```

  <p class="say">Same fires, two sensors: VIIRS counts about ${Math.round(meta.factors.ph.k)} hotspots for every one MODIS Aqua counts over the Philippines. Laid end to end, the record jumps in 2012 because the instrument changed, not the burning.</p>
  <p class="slide-no">2 / 7</p>
</div>

<div class="slide">
  <h2>What we built: a harmonised burning activity calendar</h2>

```js
const cal = benguet.filter((d) => d.year <= 2025);
display(Plot.plot({width: 900, height: 272, padding: 0.04, marginLeft: 40, style: {fontSize: "10px"}, x: {domain: d3.range(1, 13), tickFormat: (m) => MONTHS[m - 1], axis: "top", label: null}, y: {domain: [...new Set(cal.map((d) => String(d.year)))].reverse(), label: null}, color: {type: "sqrt", scheme: "YlOrRd", legend: true, label: "Hotspots (VIIRS scale)"}, marks: [Plot.cell(cal, {x: "m", y: (d) => String(d.year), fill: "h", inset: 0.5})]}));
```

  <p class="say">Benguet, 2003–2025, one cell per month. Pick any of 17 regions or 87 province-level areas, or draw a box on a NASA map, and any period; download the numbers, the hotspots and the image.</p>
  <p class="slide-no">3 / 7</p>
</div>

<div class="slide">
  <h2>How: put MODIS on the VIIRS scale, region by region</h2>
  <div class="steps">
    <div><b>1</b> NASA FIRMS hotspots, MODIS and VIIRS, filtered the same way: no volcanoes, no offshore, no low confidence</div>
    <div><b>2</b> Each hotspot placed in its region and province</div>
    <div><b>3</b> k = VIIRS ÷ MODIS Aqua over 2012–2020, when both flew, for each region (k ≈ ${meta.factors.ph.k.toFixed(1)} nationally)</div>
    <div><b>4</b> Before 2012: MODIS × k. From 2012: VIIRS, gaps filled from NOAA-20</div>
  </div>
  <p class="say">VIIRS is the reference because it continues on NOAA-20 and NOAA-21 after MODIS ends.</p>
  <p class="slide-no">4 / 7</p>
</div>

<div class="slide">
  <h2>Does it work? Tested on years it never saw</h2>
  <div class="bignums">
    <div><span>${T1.harmonised.annualMedianAbsPctError}%</span>typical error on a region's yearly total after conversion</div>
    <div><span>${T1.baselineRawAqua.annualMedianAbsPctError}%</span>without conversion</div>
    <div><span>1st, 2nd, 3rd</span>Benguet's worst fire seasons since 2003 are 2010, 2024 and 2019, the surges reported in local news</div>
  </div>
  <p class="say">Single months are less certain (about ${Math.round(T1.harmonised.monthlyMedianAbsPctError)}% error), so read seasons and years. Every test and limit is on the method page.</p>
  <p class="slide-no">5 / 7</p>
</div>

<div class="slide">
  <h2>Is this month unusual? Compare it with every year since 2003</h2>

```js
const mar = benguet.filter((d) => d.m === 3 && d.year <= 2025);
display(Plot.plot({width: 900, height: 320, style: {fontSize: "13px"}, x: {label: null, tickFormat: "d", interval: 1}, y: {label: "Hotspots in March, Benguet", grid: true}, marks: [Plot.barY(mar, {x: "year", y: "h", fill: (d) => (d.year === 2024 ? "#d7301f" : "#fdae61")}), Plot.ruleY([d3.median(mar, (d) => d.h)], {stroke: "currentColor", strokeDasharray: "5,4"}), Plot.ruleY([0])]}));
```

  <p class="say">March 2024 in Benguet against the historical median (dashed): the question an emergency manager asks first. Designed for fire officers, land managers, responders and researchers.</p>
  <p class="slide-no">6 / 7</p>
</div>

<div class="slide title-slide">
  <h2>What it can become</h2>
  <ul class="future">
    <li>The record keeps growing on NOAA-20 and NOAA-21 after MODIS ends (NASA expects 2027)</li>
    <li>Open code: any country can rebuild it from FIRMS files</li>
    <li>Next: a check with fire officers on the ground</li>
  </ul>
  <p class="who">Try it: rvbcosme.github.io/siklab-hotspot-calendar · Data: NASA FIRMS · Team Siklab</p>
  <p class="ai-note">Code, charts and text made with AI assistance (Claude Code) and checked by the team; details on the Sources page. No AI-generated images.</p>
  <p class="slide-no">7 / 7</p>
</div>

```js
// Arrow keys and Page Up/Down move between slides.
const slides = [...document.querySelectorAll(".slide")];
addEventListener("keydown", (e) => {
  const i = slides.findIndex((s) => s.getBoundingClientRect().top > -10);
  if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); slides[Math.min(slides.length - 1, i + 1)]?.scrollIntoView({behavior: "smooth"}); }
  if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); slides[Math.max(0, i - 1)]?.scrollIntoView({behavior: "smooth"}); }
});
```

<style>
#observablehq-main { max-width: none; }
.slide { box-sizing: border-box; width: min(100%, 1000px); aspect-ratio: 16 / 9; margin: 0 auto 2.5rem; padding: 2rem 2.5rem; border: 1px solid var(--theme-foreground-faintest); border-radius: 10px; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: center; background: var(--theme-background-alt); }
.slide h1 { font-size: 2.6rem; line-height: 1.15; max-width: none; margin: 0.5rem 0; }
.slide h2 { font-size: 1.7rem; margin: 0 0 0.8rem; max-width: none; }
.title-slide { justify-content: center; }
.kicker { font-size: 1rem; color: var(--theme-foreground-muted); max-width: none; }
.who { font-size: 1.15rem; max-width: none; margin-top: 1.2rem; }
.say { font-size: 1.15rem; max-width: none; margin: 0.6rem 0 0; }
.slide-no { position: absolute; right: 1.2rem; bottom: 0.6rem; font-size: 0.85rem; color: var(--theme-foreground-muted); }
.steps { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 1.2rem; }
.steps > div { background: var(--theme-background); border-radius: 8px; padding: 1rem; }
.steps b { display: block; font-size: 1.8rem; color: #d7301f; }
.bignums { display: grid; grid-template-columns: 1fr 1fr 1.4fr; gap: 1rem; font-size: 1.1rem; }
.bignums span { display: block; font-size: 2.6rem; font-weight: 700; color: #d7301f; }
.future { font-size: 1.4rem; line-height: 1.8; }
.deck-help { width: min(100%, 1000px); margin: 0 auto 1rem; font-size: 0.95rem; max-width: none; }
.ai-note { position: absolute; left: 2.5rem; bottom: 0.6rem; font-size: 0.8rem; color: var(--theme-foreground-muted); max-width: 80%; }
/* Print or "Save as PDF": one slide per 16:9 page. */
@page { size: 1000px 563px; margin: 0; }
@media print {
  #observablehq-main, #observablehq-center { margin: 0 !important; padding: 0 !important; max-width: none !important; }
  #observablehq-main > :not(.slide) { display: none !important; }
  .slide { width: 1000px; height: 563px; aspect-ratio: auto; margin: 0; border: 0; border-radius: 0; break-after: auto; page-break-after: auto; }
  .slide ~ .slide { break-before: page; page-break-before: always; }
}
</style>
