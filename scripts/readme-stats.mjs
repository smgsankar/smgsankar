// Renders the README "Stats" block as plain Markdown (fenced text, no images)
// and splices it into README.md between the stats markers.

import { readFileSync, writeFileSync } from "node:fs";

const START = "<!-- stats:start -->";
const END = "<!-- stats:end -->";
const EIGHTHS = ["", "▏", "▎", "▍", "▌", "▋", "▊", "▉"];

// Same bar style as the skyline chart: full blocks plus a fractional eighth.
function bar(value, max, width) {
  const cells = (value / max) * width;
  const full = Math.floor(cells);
  const frac = Math.round((cells - full) * 8);
  if (frac === 8) return "█".repeat(full + 1);
  return "█".repeat(full) + (value > 0 && full === 0 && frac === 0 ? "▏" : EIGHTHS[frac]);
}

const fmt = (n) => n.toLocaleString("en-US");

export function renderStatsBlock(data) {
  const { stats, firstYear, languages, generatedAt } = data;
  const { total, activeDays, peakDay } = stats;
  const perActiveDay = activeDays ? total / activeDays : 0;

  const figures = [
    [fmt(total), `contributions since ${firstYear}`],
    [fmt(activeDays), "days with commits"],
    [fmt(peakDay), "best single day"],
    [perActiveDay.toFixed(1), "contributions per active day"],
  ];
  const numW = Math.max(...figures.map(([v]) => v.length));
  const lines = figures.map(([v, l]) => `${v.padStart(numW)}  ${l}`);

  lines.push("");

  const nameW = Math.max(...languages.map((l) => l.name.length)) + 2;
  const maxPct = Math.max(...languages.map((l) => l.pct));
  const barW = 28;
  for (const { name, pct } of languages) {
    lines.push(
      `${name.padEnd(nameW)}${bar(pct, maxPct, barW).padEnd(barW)}  ${pct.toFixed(1).padStart(4)}%`
    );
  }

  return [
    START,
    "```",
    ...lines,
    "```",
    "",
    `<sub>Refreshed weekly from the GitHub API by <a href="scripts/refresh-data.mjs">a script in this repo</a> — last run ${generatedAt}. The same job re-bakes the 3D skyline's data and redeploys the portfolio.</sub>`,
    END,
  ].join("\n");
}

export function updateReadme(data, path = "README.md") {
  const readme = readFileSync(path, "utf8");
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (start === -1 || end === -1) {
    throw new Error(`README.md is missing the ${START} / ${END} markers`);
  }
  const next =
    readme.slice(0, start) + renderStatsBlock(data) + readme.slice(end + END.length);
  writeFileSync(path, next);
  return next !== readme;
}
