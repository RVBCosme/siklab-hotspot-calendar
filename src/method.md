---
title: How it works and how well
---

# How it works, and how well it works

```js
const v = FileAttachment("data/validation.json").json();
const meta = FileAttachment("data/meta.json").json();
const areas = FileAttachment("data/areas.json").json();
```

```js
const T1 = v.T1_leaveOneYearOut_2012_2020, T2 = v.T2_driftYears_2021_2025;
const pc = (x) => (x == null ? "n/a" : `${x}%`);
const n = d3.format(",");
```

## The problem

NASA's FIRMS archive holds two families of fire hotspots. MODIS, on the Terra and Aqua satellites, has watched since 2000 with pixels about 1 km wide. VIIRS, on Suomi NPP (2012 to 2 November 2026), NOAA-20 (from 2018) and NOAA-21, uses pixels about 375 m wide and catches smaller fires. Over the Philippines, once both records are filtered the same way, Suomi NPP reports about **${meta.factors.ph.k.toFixed(1)} hotspots for every one** that MODIS Aqua reports. Laid end to end, the two records would show a jump in 2012 that is a change of instrument, not a change in burning.

## What we do

| Step | What happens | Why |
|---|---|---|
| 1. Filter | Keep FIRMS hotspots flagged as vegetation fire or other land heat source; drop those FIRMS flags as active volcano or offshore. Drop low-confidence detections (MODIS confidence below 30, VIIRS "low"). | Not every hotspot is a fire; Mayon and Taal show up in the record. The same filter for both sensors. |
| 2. Place | Assign each hotspot to its region and province (geoBoundaries 2020). Hotspots within about 5 km of the coast are given to the nearest province. | So any region or province can be selected. ${n(meta.stats.outsideRegions)} of ${n(meta.stats.kept + meta.stats.outsideRegions)} hotspots fell outside every region and are left out. |
| 3. Choose one scale | VIIRS is the reference. | MODIS ends in 2027; VIIRS continues on NOAA-20 and NOAA-21, so the record can keep growing on the same scale. |
| 4. Convert MODIS | For each region, k = VIIRS hotspots ÷ MODIS Aqua hotspots over 20 January 2012 to 31 December 2020, counting only days both satellites delivered data. Months before February 2012 are MODIS Aqua × k. Provinces use their region's k. | Aqua crosses the equator at about 13:30, as Suomi NPP does, so k reflects the sensors rather than the time of day. The years from 2021 are left out of the fit because Terra and Aqua drifted from their orbits from 2021. |
| 5. Keep VIIRS continuous | On days Suomi NPP has no data (NASA's missing-data table), NOAA-20 hotspots are used, scaled by f = Suomi NPP ÷ NOAA-20 over 2018–2025 (f = ${meta.factors.ph.f.toFixed(3)} nationally). | A missing day otherwise looks like a quiet day. |
| 6. Count by month | Sum by calendar month, January 2003 onward. | Monthly counts show the fire season clearly; daily counts are too noisy. 2003 is the first full year with Aqua. |

**Custom areas.** Every hotspot in the downloadable files carries a weight that puts it on the VIIRS scale: 1 for a VIIRS hotspot, the region's k for a MODIS Aqua hotspot, and f for a NOAA-20 hotspot used on a day Suomi NPP missed. A box drawn on the map gets its calendar by adding up the weights of the hotspots inside it, month by month, so it matches the region and province calendars exactly where they overlap.

**Difference from the average.** The calendar can also be coloured by how far each month sits above or below the average of the same calendar month over every full year of the record, for the selected area.

The approach follows the same family as the published GFED5 near-real-time method (Chen and others, 2026), which converts VIIRS detections with factors set by region from the years both sensors flew. Ours is simpler: one factor per region, applied to hotspot counts.

## How well it works

The tests and thresholds below were written into the code before the first run, and nothing was tuned after. Each test predicts VIIRS counts from MODIS Aqua, region by region, for years the factor never saw.

| Test | Harmonised (factor per region) | No harmonisation (raw MODIS) | One national factor |
|---|---|---|---|
| **Annual totals, 2012–2020, each year held out in turn** (median error, ${T1.harmonised.regionYears} region-years) | **${pc(T1.harmonised.annualMedianAbsPctError)}** | ${pc(T1.baselineRawAqua.annualMedianAbsPctError)} | ${pc(T1.baselineOneNationalFactor.annualMedianAbsPctError)} |
| Monthly counts, same test (median error, ${n(T1.harmonised.months)} region-months with at least 20 VIIRS hotspots) | ${pc(T1.harmonised.monthlyMedianAbsPctError)} | ${pc(T1.baselineRawAqua.monthlyMedianAbsPctError)} | ${pc(T1.baselineOneNationalFactor.monthlyMedianAbsPctError)} |
| Busiest month of the year is the same month in both records | ${pc(T1.harmonised.peakMonthSame)} (${pc(T1.harmonised.peakMonthWithinOne)} within one month) | | |
| Annual totals, 2021–2025, after the orbit drift (factor from 2012–2020) | ${pc(T2.harmonised.annualMedianAbsPctError)} | ${pc(T2.baselineRawAqua.annualMedianAbsPctError)} | ${pc(T2.baselineOneNationalFactor.annualMedianAbsPctError)} |
| VIIRS continuity: NOAA-20 × f against Suomi NPP, annual totals 2018–2025 | ${pc(v.M4_viirsContinuity_noaa20_vs_snpp_2018_2025.annualMedianAbsPctError)} | | |

**What this means in plain words**

- For a whole year in one region, the converted MODIS count lands within about ${pc(T1.harmonised.annualMedianAbsPctError)} of what VIIRS saw, in a typical case. Without conversion it would be off by about ${pc(T1.baselineRawAqua.annualMedianAbsPctError)}.
- A single month is much less certain: a typical error of about a third. Read the calendar for seasons and years, not for one month's exact number.
- The season's shape survives: in about three region-years out of four the busiest month is the same in both records, and in more than nine out of ten it is within a month.
- After 2021, when the MODIS satellites drifted, the error doubles, and one national factor does slightly better than per-region factors. Before February 2012 the calendar uses MODIS, and those years fall before the drift.
- Pooling Terra with Aqua gave a slightly lower error in the held-out test (${pc(v.comparison_TerraPlusAqua_T1.annualMedianAbsPctError)} against ${pc(T1.harmonised.annualMedianAbsPctError)} for annual totals). We kept Aqua alone, as decided before the run, and record this as an open question.

## Check against fire seasons reported on the ground

A second, independent check: do seasons that local news reported as bad fire seasons stand out in the calendar? The three below are every Cordillera fire surge our research found a published report of, with a place and a period; none was left out. Season totals and ranks are computed live from the calendar's data, over the full years 2003–2025.

```js
const monthly = FileAttachment("data/monthly.csv").csv();
```

```js
function seasonRank(areaId, months, year) {
  const by = d3.rollup(monthly.filter((d) => d.area_id === areaId && months.includes(+d.month.slice(5, 7))), (v) => d3.sum(v, (d) => +d.hotspots_harmonised), (d) => +d.month.slice(0, 4));
  const fullYears = [...by.keys()].filter((y) => y <= 2025);
  const sorted = fullYears.map((y) => by.get(y)).sort((a, b) => b - a);
  const v = by.get(year);
  return {value: v, rank: 1 + sorted.filter((x) => x > v).length, of: sorted.length, ratio: v / d3.median(sorted), sensor: year < 2012 ? "MODIS Aqua, converted" : "VIIRS"};
}
const checks = [
  {report: "At least 2,310 ha burned in Benguet, January–May 2010, most of it in Kabayan in February–March", source: "Northern Philippine Times, Sept 2010", url: "https://northphiltimes.blogspot.com/2010/09/forest-fires-hit-2310-hectares-in.html", area: "p-benguet", areaName: "Benguet", months: [1, 2, 3, 4, 5], label: "Jan–May", year: 2010},
  {report: "165 fire incidents in the Cordillera, 1 January–12 March 2019", source: "PTV News, March 2019", url: "https://ptvnews.ph/cordillera-records-165-fires-in-less-than-3-months/", area: "r-car", areaName: "CAR", months: [1, 2, 3], label: "Jan–Mar", year: 2019},
  {report: "161 fires in the Cordillera, 1 January–29 February 2024 (read once, not re-checked)", source: "Rappler and Inquirer, 2024", url: "https://www.rappler.com/philippines/luzon/cordillera-faces-crisis-alarming-spike-wildfires/", area: "r-car", areaName: "CAR", months: [1, 2], label: "Jan–Feb", year: 2024}
].map((c) => ({...c, ...seasonRank(c.area, c.months, c.year)}));
display(html`<table>
  <thead><tr><th>What was reported</th><th>Area and season in the calendar</th><th>Hotspots (VIIRS scale)</th><th>Rank since 2003</th><th>Against the median season</th><th>Record used</th></tr></thead>
  <tbody>${checks.map((c) => html`<tr><td>${c.report} (<a href=${c.url}>${c.source}</a>)</td><td>${c.areaName}, ${c.label} ${c.year}</td><td>${d3.format(",.0f")(c.value)}</td><td><b>${c.rank} of ${c.of}</b></td><td>${c.ratio.toFixed(1)}×</td><td>${c.sensor}</td></tr>`)}</tbody>
</table>`);
```

In Benguet the three worst January–May seasons since 2003 are 2010, 2024 and 2019, the three surges named in local reports, although 2010 comes from converted MODIS and the other two from VIIRS. This is a check on three events, not a statistical test, and all three were El Niño years, when clearer skies also let satellites see more.

## Limits

- **A hotspot is not a fire.** One fire can make many hotspots, and small or short fires, or fires under cloud, make none. The counts compare like with like across years; they are not a count of fires or of area burned.
- **No detection does not mean no fire.** FIRMS carries no cloud information. The wet season and cloudy years read low.
- **Missing days** are marked with a dot on the calendar when a month lacks a week or more of data.
- **Provinces** use their region's factor; a province's own factor would rest on too few hotspots.
- **2026** is not yet in this version: the yearly country files end on 31 December 2025.
- The record describes the past. It does not forecast.

## Factors by region

```js
display(Inputs.table(areas.filter((a) => a.level !== "province").map((a) => ({Area: a.name, "k (VIIRS per MODIS Aqua hotspot)": +a.k.toFixed(2), "f (Suomi NPP per NOAA-20 hotspot)": +a.f.toFixed(3)})), {sort: "Area", rows: 20}));
```

Built ${meta.builtAt.slice(0, 10)} from NASA FIRMS standard-quality yearly files for the Philippines (MODIS ${meta.recordStart.slice(0, 4)}–2025, VIIRS Suomi NPP 2012–2025, VIIRS NOAA-20 2018–2025).
