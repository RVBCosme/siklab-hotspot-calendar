// Observable Framework configuration (https://github.com/observablehq/framework, ISC licence).
export default {
  root: "src",
  title: "Siklab hotspot calendar",
  pages: [
    {name: "Calendar", path: "/"},
    {name: "How it works and how well", path: "/method"},
    {name: "Sources and credits", path: "/sources"}
  ],
  head: '<meta name="description" content="A harmonised MODIS + VIIRS burning activity calendar for Philippine regions and provinces, built from NASA FIRMS hotspots.">',
  footer:
    "Hotspots: NASA FIRMS (MODIS Collection 6.1, VIIRS 375 m). Boundaries: geoBoundaries (CC BY 3.0 IGO). Built during NASA Space Apps Challenge 2026 by team Siklab, with AI assistance disclosed on the Sources page.",
  toc: false,
  search: false
};
