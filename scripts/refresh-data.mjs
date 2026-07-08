// Refreshes everything derived from GitHub activity in one API pass:
//   - src/calendar.json      daily contribution counts (feeds the 3D skyline)
//   - src/github-stats.json  yearly totals, headline stats, language split
//   - assets/*.svg           the README stat cards
// Usage: GITHUB_TOKEN=<token> node scripts/refresh-data.mjs

import { writeFileSync, mkdirSync } from "node:fs";

const LOGIN = "smgsankar";
const FIRST_YEAR = 2019;
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error("GITHUB_TOKEN is required");
  process.exit(1);
}

const C = {
  bg: "#04070a",
  border: "#1a3324",
  track: "rgba(70, 242, 122, 0.08)",
  phosphor: "#46f27a",
  ink: "#d8ffe4",
  dim: "#7fa88b",
  amber: "#ffb347",
};
const MONO = "ui-monospace, 'SF Mono', 'Cascadia Mono', Consolas, monospace";
const SERIF = "Georgia, 'Times New Roman', serif";

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
writeFileSync(
  "src/github-stats.json",
  JSON.stringify(
    {
      generatedAt: new Date().toISOString().slice(0, 10),
      firstYear: FIRST_YEAR,
      years,
      stats: { total, activeDays, peakDay, commits, prsOpened, prsReviewed },
      languages: top,
    },
    null,
    2
  )
);

/* ---------------- svg helpers ---------------- */
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function chrome(w, h, title) {
  return `
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="6" fill="${C.bg}" stroke="${C.border}"/>
  <circle cx="22" cy="21" r="4" fill="none" stroke="${C.border}" stroke-width="1.5"/>
  <circle cx="38" cy="21" r="4" fill="none" stroke="${C.border}" stroke-width="1.5"/>
  <circle cx="54" cy="21" r="4" fill="none" stroke="${C.phosphor}" stroke-width="1.5"/>
  <text x="72" y="25" font-family="${MONO}" font-size="11" letter-spacing="2" fill="${C.amber}">${esc(title)}</text>
  <line x1="1" y1="38.5" x2="${w - 1}" y2="38.5" stroke="${C.border}"/>`;
}

// Bar with a flat baseline end and a 4px-rounded data end.
function bar(x, y, w, h, fill) {
  const r = Math.min(4, w);
  return `<path d="M${x} ${y} h${w - r} a${r} ${r} 0 0 1 ${r} ${r} v${h - 2 * r} a${r} ${r} 0 0 1 -${r} ${r} h-${w - r} z" fill="${fill}"/>`;
}

/* ---------------- card 1: stats ---------------- */
const W1 = 846;
const H1 = 318;
const kpis = [
  { v: fmt(total), l: `contributions since ${FIRST_YEAR}` },
  { v: fmt(activeDays), l: "days with commits" },
  { v: fmt(prsOpened), l: "pull requests opened" },
  { v: fmt(prsReviewed), l: "pull requests reviewed" },
];

let svg1 = "";
kpis.forEach((k, i) => {
  const x = 36 + (i % 2) * 190;
  const y = 96 + Math.floor(i / 2) * 92;
  svg1 += `
  <text x="${x}" y="${y}" font-family="${SERIF}" font-style="italic" font-size="40" fill="${C.phosphor}">${esc(k.v)}</text>
  <text x="${x}" y="${y + 22}" font-family="${MONO}" font-size="9.5" letter-spacing="1.8" fill="${C.dim}">${esc(k.l.toUpperCase())}</text>`;
});
svg1 += `
  <text x="36" y="286" font-family="${MONO}" font-size="11" fill="${C.dim}">peak: <tspan fill="${C.ink}">${peakDay} contributions</tspan> in a single day</text>`;

const chartX = 470;
const chartW = W1 - chartX - 96;
const rowH = (H1 - 96) / years.length;
const maxYear = Math.max(...years.map((y) => y.total));
svg1 += `<text x="${chartX}" y="72" font-family="${MONO}" font-size="9.5" letter-spacing="1.8" fill="${C.dim}">CONTRIBUTIONS PER YEAR</text>`;
years.forEach(({ year, total: t }, i) => {
  const y = 88 + i * rowH;
  const w = Math.max((t / maxYear) * chartW, 2);
  svg1 += `
  <text x="${chartX - 12}" y="${y + 9}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${C.dim}">${year}</text>
  <rect x="${chartX}" y="${y}" width="${chartW}" height="12" rx="4" fill="${C.track}"/>
  ${bar(chartX, y, w, 12, C.phosphor)}
  <text x="${chartX + chartW + 12}" y="${y + 10}" font-family="${MONO}" font-size="11" fill="${C.ink}">${fmt(t)}</text>`;
});

const statsCard = `<svg xmlns="http://www.w3.org/2000/svg" width="${W1}" height="${H1}" viewBox="0 0 ${W1} ${H1}" role="img" aria-label="GitHub stats for ${LOGIN}: ${fmt(total)} contributions since ${FIRST_YEAR}, ${fmt(activeDays)} active days, ${fmt(prsOpened)} pull requests opened, ${fmt(prsReviewed)} reviewed">
  ${chrome(W1, H1, `${LOGIN}@github — the numbers`)}
  ${svg1}
</svg>`;

/* ---------------- card 2: languages ---------------- */
const W2 = 846;
const rowH2 = 34;
const H2 = 78 + top.length * rowH2 + 18;
const labelW = 150;
const pctW = 76;
const trackX = 36 + labelW;
const trackW = W2 - trackX - pctW - 36;
const maxPct = Math.max(...top.map((l) => l.pct));

let svg2 = "";
top.forEach(({ name, pct }, i) => {
  const y = 70 + i * rowH2;
  const w = Math.max((pct / maxPct) * trackW, 2);
  svg2 += `
  <text x="36" y="${y + 10}" font-family="${MONO}" font-size="12" fill="${C.ink}">${esc(name)}</text>
  <rect x="${trackX}" y="${y}" width="${trackW}" height="12" rx="4" fill="${C.track}"/>
  ${bar(trackX, y, w, 12, C.phosphor)}
  <text x="${W2 - 36}" y="${y + 10}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${C.amber}">${pct.toFixed(1)}%</text>`;
});

const langsCard = `<svg xmlns="http://www.w3.org/2000/svg" width="${W2}" height="${H2}" viewBox="0 0 ${W2} ${H2}" role="img" aria-label="Top languages across public repos: ${top.map((l) => `${l.name} ${l.pct.toFixed(1)}%`).join(", ")}">
  ${chrome(W2, H2, `${LOGIN}@github — share of public code, by bytes`)}
  ${svg2}
</svg>`;

mkdirSync("assets", { recursive: true });
writeFileSync("assets/stats-card.svg", statsCard);
writeFileSync("assets/langs-card.svg", langsCard);
console.log(
  `refreshed: ${fmt(total)} contributions, ${activeDays} active days, ${top.length} languages`
);
