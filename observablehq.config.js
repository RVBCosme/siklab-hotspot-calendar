// Observable Framework configuration (https://github.com/observablehq/framework, ISC licence).
// Written with AI assistance (Claude Code, Anthropic) during NASA Space Apps 2026, 14 Nov 2026; see README and logs/.
export default {
  root: "src",
  title: "Siklab hotspot calendar",
  pages: [
    {name: "Calendar", path: "/"},
    {name: "How it works and how well", path: "/method"},
    {name: "Sources and credits", path: "/sources"}
  ],
  head: '<meta name="description" content="A harmonised MODIS + VIIRS burning activity calendar for Philippine regions and provinces, built from NASA FIRMS hotspots."><meta name="ai-assistance" content="Code, data pipeline and text written with AI assistance (Claude Code, Anthropic); details on the Sources page and in the repository logs. No AI-generated images.">',
  footer:
    "Hotspots: NASA FIRMS (MODIS Collection 6.1, VIIRS 375 m). Boundaries: geoBoundaries (CC BY 3.0 IGO). Built during NASA Space Apps Challenge 2026 by team Siklab, with AI assistance disclosed on the Sources page.",
  toc: false,
  search: false
};
