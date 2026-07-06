// GitHub activity for @smgsankar, pulled from the REST + GraphQL APIs (2026-07-07).
import calendar from "./calendar.json";

export { calendar };

export const YEARS = [
  { year: 2019, total: 1 },
  { year: 2020, total: 1 },
  { year: 2021, total: 28 },
  { year: 2022, total: 178 },
  { year: 2023, total: 2540 },
  { year: 2024, total: 3021 },
  { year: 2025, total: 2554 },
  { year: 2026, total: 2698 },
];

export const STATS = [
  { value: "11,021", label: "contributions since 2019" },
  { value: "1,100", label: "days with at least one commit" },
  { value: "66", label: "contributions on the wildest day" },
  { value: "1,059", label: "pull requests opened" },
  { value: "697", label: "pull requests reviewed" },
  { value: "29", label: "repositories, public + private" },
];

export const LANGUAGES = [
  { name: "TypeScript", pct: 67.5, color: "#46f27a" },
  { name: "Swift", pct: 12.3, color: "#ffb347" },
  { name: "JavaScript", pct: 9.1, color: "#9dffbe" },
  { name: "Python", pct: 6.4, color: "#6ee7ff" },
  { name: "CSS", pct: 3.6, color: "#ff8fa3" },
  { name: "Other", pct: 1.1, color: "#7fa88b" },
];

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

export const TIMELINE = {
  start: "2019-01-01",
  end: "2026-12-31",
};
