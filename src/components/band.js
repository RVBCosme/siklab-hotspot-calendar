// Written with an AI assistant (Claude Code) during the hackathon, 15 Nov 2026; see README.
// The header band shared by the calendar, method and sources pages: title, one-line purpose, three computed figures,
// the country's fire-season ribbon and a row of jump links. Every number passed in is computed by the page from the data files.
import {html} from "npm:htl";
import * as d3 from "npm:d3";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// The country's median month over the full years of the El Niño analysis, coloured like the calendar.
// rows: monthly.csv rows (untyped), years: [first, last].
export function seasonRibbon(rows, years) {
  const ph = rows.filter((d) => d.area_id === "ph").map((d) => ({year: +d.month.slice(0, 4), m: +d.month.slice(5, 7), h: +d.hotspots_harmonised}));
  const med = d3.range(1, 13).map((m) => d3.median(ph.filter((d) => d.m === m && d.year >= years[0] && d.year <= years[1]), (d) => d.h));
  const colour = d3.scaleSequentialSqrt(d3.interpolateYlOrRd).domain([0, d3.max(med)]);
  const peak = med.indexOf(d3.max(med));
  return html`<figure class="ribbon" role="img" aria-label=${`The country's median month, ${years[0]} to ${years[1]}, coloured from light (few hotspots) to dark red (many). The peak is ${MONTH_NAMES[peak]}.`}>
  <div class="cells">${med.map((v) => html`<span style=${`background: ${colour(v)}`}></span>`)}</div>
  <div class="months" aria-hidden="true">${MONTHS.map((m) => html`<span>${m}</span>`)}</div>
  <figcaption aria-hidden="true">The country's median month, ${years[0]}–${years[1]}: the fire season peaks in ${MONTH_NAMES[peak]}</figcaption>
</figure>`;
}

// Jump links to sections of the same page: [[label, id], ...]. They scroll and move focus without changing the address,
// so the calendar page's view link (#area=...) stays in the address bar.
export function jumpTo(event, id) {
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start"});
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({preventScroll: true});
}
export function jumpBar(links, label = "On this page") {
  return html`<nav class="jump" aria-label=${label}><span class="jump-label">${label}:</span> ${links.map(([text, id]) => html`<a href=${`#${id}`} onclick=${(e) => jumpTo(e, id)}>${text}</a>`)}</nav>`;
}
