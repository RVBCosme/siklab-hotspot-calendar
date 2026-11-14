---
title: Sources and credits
---

<!-- Written with AI assistance (Claude Code, Anthropic) during NASA Space Apps 2026, 14 Nov 2026; see README. -->

# Sources, licences and AI use

## NASA data

| Data | What we used | Access |
|---|---|---|
| NASA FIRMS, MODIS Collection 6.1 active fire hotspots (Terra and Aqua) | Yearly standard-quality files for the Philippines, 2000–2025. Aqua 2003 onward enters the calendar; Terra is used only in a comparison test | https://firms.modaps.eosdis.nasa.gov/country/ |
| NASA FIRMS, VIIRS 375 m active fire hotspots (Suomi NPP and NOAA-20) | Yearly standard-quality files for the Philippines: Suomi NPP 2012–2025, NOAA-20 2018–2025 | https://firms.modaps.eosdis.nasa.gov/country/ |
| NASA FIRMS area API, 2026 | MODIS (MODIS_SP, MODIS_NRT) and VIIRS Suomi NPP and NOAA-20 (VIIRS_SNPP_SP/NRT, VIIRS_NOAA20_SP/NRT) for a rectangle around the Philippines, 1 January 2026 to the latest day; standard quality where available, near real time after | https://firms.modaps.eosdis.nasa.gov/api/area/ (free map key) |
| NASA FIRMS missing-data table | Days each satellite delivered no data | https://firms.modaps.eosdis.nasa.gov/api/missing_data/ |
| NASA GIBS (Global Imagery Browse Services): Blue Marble shaded relief and bathymetry, and 15 m coastlines | Base map for the custom-area map | https://gibs.earthdata.nasa.gov/ |
| NASA FIRMS Fire Map | Linked from the calendar page for today's detections; no data taken from it | https://firms.modaps.eosdis.nasa.gov/map/ |

We acknowledge the use of data and imagery from NASA's Fire Information for Resource Management System (FIRMS), https://www.earthdata.nasa.gov/data/tools/firms, part of NASA's Earth Science Data and Information System (ESDIS).

## Other data and references

| Source | Use | Licence |
|---|---|---|
| geoBoundaries, Philippines ADM1 and ADM2 (2020), from NAMRIA, PSA and OCHA Philippines. Runfola, D. et al. (2020) geoBoundaries: A global database of political administrative boundaries. PLoS ONE 15(4): e0231866 | Placing hotspots in regions and provinces; the province outlines on the calendar page's map (simplified to about 450 m) | CC BY 3.0 IGO, https://www.geoboundaries.org/ |
| Chen, Y. and others (2026). GFED5 near-real-time. Earth System Science Data 18, 7535 | The family of method we follow (factors from the overlap years) | Open access, https://essd.copernicus.org/articles/18/7535/2026/ |
| NASA FIRMS FAQ and attribute descriptions | Meaning of the type and confidence fields; satellite pass times | https://www.earthdata.nasa.gov/data/tools/firms/faq |
| NASA Earthdata (2026). Suomi NPP Observations to Cease on November 2, 2026; and NASA Earthdata blog, Transitioning from Suomi NPP VIIRS & OMPS: What FIRMS Users Need to Know | The date and time Suomi NPP data stopped (13:00 UTC, 2 November 2026) | https://www.earthdata.nasa.gov/data/alerts-outages/suomi-npp-observations-cease-november-2-2026 ; https://www.earthdata.nasa.gov/news/blog/transitioning-from-suomi-npp-viirs-omps-what-firms-users-need-know |
| Twedt, K., Xiong, X., Geng, X., Wilson, T. and Mu, Q. (2023). Impact of satellite orbit drift on MODIS Earth scene observations used in calibration of the reflective solar bands. SPIE conference paper (NASA NTRS 20240001409) | Why the conversion factor is fitted on 2012–2020 and the drift years are held out | https://ntrs.nasa.gov/citations/20240001409 |
| NASA Science. Terra: The End of an Era; and the Aqua mission page | Terra and Aqua no longer hold their orbits; projected end of science: Terra February 2027, Aqua September 2027 | https://science.nasa.gov/science-research/earth-science/terra-the-end-of-an-era ; https://science.nasa.gov/mission/aqua |
| News reports used in the check against reported fire seasons: Northern Philippine Times (Sept 2010), PTV News (March 2019), Rappler and Inquirer (2024) | Linked from the method page; cited, not reproduced | Each publisher's terms |

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
| Claude Code (Anthropic) | Before the hackathon: research and fact-checking on the challenge, the data and the rules; on 10 November it also wrote a text outline of a possible approach and a list of options, set aside on 11 November; on 11 November it read the first and last few hundred bytes of three 2025 Philippine FIRMS files to learn their column format (see "Before the event" below). During the hackathon: read the guides and the forum, downloaded the FIRMS files, wrote the data pipeline (pipeline/build-data.mjs), the validation tests and this web application's code, drafted text on these pages, and took the screenshots of this application used in the demo (screenshots of the real pages, not generated images) | The Team Owner made each open decision (which MODIS satellite to convert, Metro Manila's factor, how the data is kept current, the project name, the disclosure below) and pushed the changes to the public repository. The numbers were checked with recounts run by the AI assistant; the tests and their results are on the method page |

The code and the data files in this repository were written or generated with AI assistance, as stated above and in the repository's README. No AI-generated images, video or audio are used.

**Built during the hackathon.** Everything in this project was made within the hackathon, between the 09:00 start on 14 November and the deadline on 15 November 2026 (Manila time): the data downloads, the pipeline, the validation tests, the web application, the demo and this page. The repository's first commit is at 13:07 on 14 November.

**Before the event.** Before the start our work was research and logistics: we read the challenge, the rules, the forum and the documentation of NASA's FIRMS files. Two things from that period should be known. On 10 November, before we had read the organisers' guidance on planning (discussion 1872), our AI assistant wrote a text outline of a possible approach and a list of build options, with no code, no design assets, no interface sketches and no data; we set both aside on 11 November and planned the build after the start. On 11 November a forum Navigator had written that NASA's data is public and there is no need to wait for the hackathon to access it (discussion 1925), and the assistant read the first and last few hundred bytes of three 2025 Philippine FIRMS files to learn their column format; nothing was saved or processed. On 14 November the organisers said that downloading data before the start is not permitted (discussion 2011), so we state both here and on our project page.

## Licence of this project

Code: Apache License 2.0. Derived data files: the same terms as their sources (NASA FIRMS, geoBoundaries CC BY 3.0 IGO).
