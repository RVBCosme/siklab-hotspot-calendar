// Observable Framework configuration (https://github.com/observablehq/framework, ISC licence).
// Written with AI assistance (Claude Code, Anthropic) during NASA Space Apps 2026, 14 Nov 2026; see README.
export default {
  root: "src",
  title: "Siklab hotspot calendar",
  pages: [
    {name: "Calendar", path: "/"},
    {name: "How it works and how well", path: "/method"},
    {name: "Sources and credits", path: "/sources"}
  ],
  // A small inline icon (so browsers do not ask for a missing /favicon.ico), muted text dark enough for 4.5:1 contrast,
  // and tables that wrap inside their cells on a phone instead of making the page scroll sideways.
  head: '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 16 16%27%3E%3Cpath d=%27M8 1c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-2 1-3.5 2-4.5 0 2 .8 3 2 3.2C7.2 5.5 7.5 3.5 8 1z%27 fill=%27%23d7301f%27/%3E%3C/svg%3E"><style>:root:root{--theme-foreground-muted:color-mix(in srgb,var(--theme-foreground) 72%,var(--theme-background))}#observablehq-footer{color:var(--theme-foreground-muted)}#observablehq-main a:not(.observablehq-header-anchor),#observablehq-footer a{text-decoration:underline;text-underline-offset:2px}@media (max-width:640px){#observablehq-main table{font-size:13px}#observablehq-main th,#observablehq-main td,#observablehq-main p a{overflow-wrap:anywhere;padding-left:2px;padding-right:2px}}</style><meta name="description" content="A harmonised MODIS + VIIRS burning activity calendar and province map for the Philippines, built from NASA FIRMS hotspots, explained in plain words."><meta name="ai-assistance" content="Code, data pipeline, text and screenshots made with AI assistance (Claude Code, Anthropic); details on the Sources page. No AI-generated images.">',
  footer:
    "Hotspots: NASA FIRMS (MODIS Collection 6.1, VIIRS 375 m). Boundaries: geoBoundaries (CC BY 3.0 IGO). Built during NASA Space Apps Challenge 2026 by team Siklab, with AI assistance disclosed on the Sources page. Feedback or corrections: <a href=\"https://github.com/RVBCosme/siklab-hotspot-calendar/issues/new\">open an issue on GitHub</a>.",
  toc: false,
  search: false
};
