---
title: Sources and credits
---

# Sources, licences and AI use

## NASA data

| Data | What we used | Access |
|---|---|---|
| NASA FIRMS, MODIS Collection 6.1 active fire hotspots (Terra and Aqua) | Yearly standard-quality files for the Philippines, 2000–2025. Aqua 2003 onward enters the calendar; Terra is used only in a comparison test | https://firms.modaps.eosdis.nasa.gov/country/ |
| NASA FIRMS, VIIRS 375 m active fire hotspots (Suomi NPP and NOAA-20) | Yearly standard-quality files for the Philippines: Suomi NPP 2012–2025, NOAA-20 2018–2025 | https://firms.modaps.eosdis.nasa.gov/country/ |
| NASA FIRMS missing-data table | Days each satellite delivered no data | https://firms.modaps.eosdis.nasa.gov/api/missing_data/ |
| NASA GIBS (Global Imagery Browse Services): Blue Marble shaded relief and bathymetry, and 15 m coastlines | Base map for the custom-area map | https://gibs.earthdata.nasa.gov/ |

We acknowledge the use of data and imagery from NASA's Fire Information for Resource Management System (FIRMS), https://www.earthdata.nasa.gov/data/tools/firms, part of NASA's Earth Science Data and Information System (ESDIS).

## Other data and references

| Source | Use | Licence |
|---|---|---|
| geoBoundaries, Philippines ADM1 and ADM2 (2020), from NAMRIA, PSA and OCHA Philippines. Runfola, D. et al. (2020) geoBoundaries: A global database of political administrative boundaries. PLoS ONE 15(4): e0231866 | Placing hotspots in regions and provinces | CC BY 3.0 IGO, https://www.geoboundaries.org/ |
| Chen, Y. and others (2026). GFED5 near-real-time. Earth System Science Data 18, 7535 | The family of method we follow (factors from the overlap years) | Open access, https://essd.copernicus.org/articles/18/7535/2026/ |
| NASA FIRMS FAQ and attribute descriptions | Meaning of the type and confidence fields; satellite pass times | https://www.earthdata.nasa.gov/data/tools/firms/faq |

## Software

| Software | Use | Licence |
|---|---|---|
| Observable Framework 1.13.4 | Static site generator for this app | ISC |
| Observable Plot, Observable Inputs, D3 (bundled with Framework) | Charts, controls, CSV handling | ISC |
| Leaflet (bundled with Framework) | The custom-area map | BSD-2-Clause |
| OpenStreetMap tiles (optional base map with place names) | Orientation on the custom-area map | Data © OpenStreetMap contributors, ODbL; tiles under the OSM tile usage policy |
| Node.js | Runs the data pipeline | MIT |

## Use of AI (Super Intelligence) tools

| Tool | What it did | What a person checked |
|---|---|---|
| Claude Code (Anthropic, Claude Opus 5.5) | Before the hackathon: research and fact-checking on the challenge, the data and the rules. During the hackathon: read the guides and the forum, downloaded the FIRMS files, wrote the data pipeline (pipeline/build-data.mjs), the validation tests and this web application's code, and drafted text on these pages | To be completed by the team |

The code and the data files in this repository were written or generated with AI assistance, as stated above and in the repository's README. No AI-generated images, video or audio are used.

## Licence of this project

Code: Apache License 2.0. Derived data files: the same terms as their sources (NASA FIRMS, geoBoundaries CC BY 3.0 IGO).
