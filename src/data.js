// Activity numbers come from src/github-stats.json + src/calendar.json,
// regenerated weekly by scripts/refresh-data.mjs. Curated content
// (labels, colors, project blurbs) lives here.
import calendar from "./calendar.json";
import gh from "./github-stats.json";

export { calendar };

export const GENERATED_AT = gh.generatedAt;

export const YEARS = gh.years;

const fmt = (n) => n.toLocaleString("en-US");

export const STATS = [
  { value: fmt(gh.stats.total), label: `contributions since ${gh.firstYear}` },
  { value: fmt(gh.stats.activeDays), label: "days with at least one commit" },
  { value: fmt(gh.stats.peakDay), label: "contributions on the wildest day" },
  { value: fmt(gh.stats.prsOpened), label: "pull requests opened" },
  { value: fmt(gh.stats.prsReviewed), label: "pull requests reviewed" },
  { value: fmt(gh.stats.commits), label: "commits pushed" },
];

const LANG_COLORS = {
  TypeScript: "#46f27a",
  Swift: "#ffb347",
  JavaScript: "#9dffbe",
  Python: "#6ee7ff",
  CSS: "#ff8fa3",
};

export const LANGUAGES = gh.languages.map(({ name, pct }) => ({
  name,
  pct,
  color: LANG_COLORS[name] || "#7fa88b",
}));

export const PROJECTS = [
  {
    name: "beyond-boundary",
    desc: "Fantasy cricket platform — build custom squads of your favourite players and compete with fanatics worldwide.",
    lang: "TypeScript",
    year: "2026",
    url: "https://github.com/smgsankar/beyond-boundary",
  },
  {
    name: "fifa-wc-2026",
    desc: "World Cup 2026 companion app with a TypeScript front and a Python back.",
    lang: "TS + Python",
    year: "2026",
    url: "https://github.com/smgsankar/fifa-wc-2026",
  },
  {
    name: "clipboard-manager-macos",
    desc: "Native macOS clipboard manager, written in Swift — because ⌘V deserves a memory.",
    lang: "Swift",
    year: "2026",
    url: "https://github.com/smgsankar/clipboard-manager-macos",
  },
  {
    name: "website-design-match-evaluator",
    desc: "Utility that scores a built website against its design reference image.",
    lang: "TypeScript",
    year: "2026",
    url: "https://github.com/smgsankar/website-design-match-evaluator",
  },
  {
    name: "json-array-table-editor",
    desc: "VS Code extension to view and edit JSON arrays as tables, right in the editor.",
    lang: "TypeScript",
    year: "2024",
    url: "https://github.com/smgsankar/json-array-table-editor",
  },
  {
    name: "frontend-mentor-challenges",
    desc: "Monorepo of UI challenges from Frontend Mentor — the sharpening stone.",
    lang: "TypeScript",
    year: "2023 →",
    url: "https://github.com/smgsankar/frontend-mentor-challenges",
  },
];

const lastYear = gh.years[gh.years.length - 1].year;

export const TIMELINE = {
  start: `${gh.firstYear}-01-01`,
  end: `${lastYear}-12-31`,
  today: gh.generatedAt,
};
