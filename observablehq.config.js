// Observable Framework configuration (https://github.com/observablehq/framework, ISC licence).
// Written with AI assistance (Claude Code, Anthropic) during NASA Space Apps 2026, 14 Nov 2026; see README.

// The site's three pages, as shown in the footer: what each one holds, in a few words.
const PAGES = [
  ["/", "Calendar", "When and where the Philippines burns: any region, province or drawn box, month by month since 2003, the El Niño map and the 2027 outlook"],
  ["/method", "How it works and how well", "Data, conversion, tests and results, limits, data dictionary and how to reproduce it"],
  ["/sources", "Sources and credits", "NASA data products, other sources, licences, and how AI was used"]
];
const REPO = "https://github.com/RVBCosme/siklab-hotspot-calendar";

export default {
  root: "src",
  title: "Siklab hotspot calendar",
  pages: [
    {name: "Calendar", path: "/"},
    {name: "How it works and how well", path: "/method"},
    {name: "Sources and credits", path: "/sources"}
  ],
  // One stylesheet for every page: Framework's default styles and light and dark themes, then the site's own
  // (band, type, colours, tables that wrap on a phone, muted text dark enough for 4.5:1 contrast).
  style: "custom-style.css",
  // A small inline icon (so browsers do not ask for a missing /favicon.ico), and the page description and AI note.
  head: '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 16 16%27%3E%3Cpath d=%27M8 1c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-2 1-3.5 2-4.5 0 2 .8 3 2 3.2C7.2 5.5 7.5 3.5 8 1z%27 fill=%27%23d7301f%27/%3E%3C/svg%3E"><meta name="description" content="A harmonised MODIS + VIIRS burning activity calendar and province map for the Philippines, built from NASA FIRMS hotspots, explained in plain words."><meta name="ai-assistance" content="Code, data pipeline, text and screenshots made with AI assistance (Claude Code, Anthropic); details on the Sources page. No AI-generated images.">',
  // One footer for every page: the three pages (the current one marked), the demo, code and feedback, then the credits.
  footer: ({path}) => {
    const here = path === "/index" ? "/" : path;
    const pages = PAGES.map(([p, name, what]) => `<a href="${p === "/" ? "./" : `.${p}`}"${p === here ? ' aria-current="page"' : ""}><b>${name}</b><span>${what}</span></a>`).join("");
    return `<nav class="site-pages" aria-label="Pages of this site">${pages}</nav>`
      + `<p class="site-more"><a href="./demo">The 7-slide demo</a><a href="${REPO}/blob/main/src/siklab-demo-slides.pdf">Demo as a PDF</a><a href="${REPO}">Source code and data on GitHub</a><a href="${REPO}/issues/new">Send feedback or a correction (GitHub issue)</a></p>`
      + `<p class="site-credits">Hotspots: NASA FIRMS (MODIS Collection 6.1, VIIRS 375 m). Boundaries: geoBoundaries (CC BY 3.0 IGO). Built during NASA Space Apps Challenge 2026 by team Siklab, with AI assistance disclosed on the Sources page. Code: Apache License 2.0.</p>`;
  },
  pager: false,
  toc: false,
  search: false
};
