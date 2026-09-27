// Refreshes everything derived from GitHub activity in one API pass:
//   - src/calendar.json      daily contribution counts (feeds the 3D skyline)
//   - src/github-stats.json  yearly totals, headline stats, language split
//   - README.md              the Stats block (see readme-stats.mjs)
// Usage: GITHUB_TOKEN=<token> node scripts/refresh-data.mjs

import { writeFileSync } from "node:fs";
import { updateReadme } from "./readme-stats.mjs";

const LOGIN = "smgsankar";
const FIRST_YEAR = 2019;
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error("GITHUB_TOKEN is required");
  process.exit(1);
}

async function graphql(query) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function rest(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

/* ---------------- fetch ---------------- */
const currentYear = new Date().getUTCFullYear();
const years = [];
const calendar = [];
let total = 0;
let activeDays = 0;
let peakDay = 0;
let commits = 0;
let prsOpened = 0;
let prsReviewed = 0;

for (let y = FIRST_YEAR; y <= currentYear; y++) {
  const data = await graphql(`query {
    user(login: "${LOGIN}") {
      contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") {
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount } }
        }
      }
    }
  }`);
  const cc = data.user.contributionsCollection;
  years.push({ year: y, total: cc.contributionCalendar.totalContributions });
  total += cc.contributionCalendar.totalContributions;
  commits += cc.totalCommitContributions;
  prsOpened += cc.totalPullRequestContributions;
  prsReviewed += cc.totalPullRequestReviewContributions;
  for (const w of cc.contributionCalendar.weeks) {
    for (const d of w.contributionDays) {
      if (d.contributionCount > 0) {
        calendar.push({ d: d.date, c: d.contributionCount });
        activeDays++;
        if (d.contributionCount > peakDay) peakDay = d.contributionCount;
      }
    }
  }
}

const repos = (await rest(`/users/${LOGIN}/repos?per_page=100`)).filter(
  (r) => !r.fork
);
const bytes = {};
for (const r of repos) {
  try {
    const langs = await rest(`/repos/${LOGIN}/${r.name}/languages`);
    for (const [lang, b] of Object.entries(langs)) {
      bytes[lang] = (bytes[lang] || 0) + b;
    }
  } catch (e) {
    console.warn(`skipping languages for ${r.name}: ${e.message}`);
  }
}
// Config/markup formats aren't "languages" for this card's purposes.
for (const skip of ["Makefile", "Procfile", "Shell", "HTML"]) delete bytes[skip];
const totalBytes = Object.values(bytes).reduce((a, b) => a + b, 0);
const ranked = Object.entries(bytes)
  .map(([name, b]) => ({ name, pct: +((b / totalBytes) * 100).toFixed(1) }))
  .sort((a, b) => b.pct - a.pct);
const top = ranked.slice(0, 5);
const otherPct = ranked.slice(5).reduce((a, l) => a + l.pct, 0);
if (otherPct > 0.05) top.push({ name: "Other", pct: +otherPct.toFixed(1) });

const fmt = (n) => n.toLocaleString("en-US");

/* ---------------- site data ---------------- */
calendar.sort((a, b) => (a.d < b.d ? -1 : 1));
writeFileSync("src/calendar.json", JSON.stringify(calendar));
const generatedAt = new Date().toISOString().slice(0, 10);
const siteData = {
  generatedAt,
  firstYear: FIRST_YEAR,
  years,
  stats: { total, activeDays, peakDay, commits, prsOpened, prsReviewed },
  languages: top,
};

writeFileSync("src/github-stats.json", JSON.stringify(siteData, null, 2));

/* ---------------- README ---------------- */
updateReadme(siteData);
console.log(
  `refreshed: ${fmt(total)} contributions, ${activeDays} active days, ${top.length} languages`
);
