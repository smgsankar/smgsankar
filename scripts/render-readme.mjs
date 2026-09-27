// Re-renders the README stats block from the cached src/github-stats.json — no API calls.
// Use this when iterating on the layout: npm run stats

import { readFileSync } from "node:fs";
import { updateReadme } from "./readme-stats.mjs";

const data = JSON.parse(readFileSync("src/github-stats.json", "utf8"));
console.log(updateReadme(data) ? "README stats block updated" : "README stats block unchanged");
