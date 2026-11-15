// Written with an AI assistant (Claude Code) during the hackathon, 15 Nov 2026; see README.
// Build-time data loader: the git commit the site is built from (GitHub Actions sets GITHUB_SHA; locally, git is asked).
// Shown in "How to cite and reproduce" on the method page. It holds no data from the analysis.
import {execFileSync} from "node:child_process";

let commit = process.env.GITHUB_SHA || null;
if (!commit) {
  try {
    commit = execFileSync("git", ["rev-parse", "HEAD"], {encoding: "utf8"}).trim();
  } catch {
    commit = null;
  }
}
process.stdout.write(JSON.stringify({
  aiAssistance: "Generated at build time by src/build-info.json.js, which was written with AI assistance (Claude Code, Anthropic) during NASA Space Apps 2026; see README.",
  commit
}));
