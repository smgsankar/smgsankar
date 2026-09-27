// Re-renders assets/*.svg from the cached src/github-stats.json — no API calls.
// Use this when iterating on the card design: node scripts/render-cards.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { renderCards } from "./cards.mjs";

const data = JSON.parse(readFileSync("src/github-stats.json", "utf8"));
mkdirSync("assets", { recursive: true });
for (const [name, svg] of Object.entries(renderCards(data))) {
  writeFileSync(`assets/${name}`, svg);
}
console.log(`rendered ${Object.keys(renderCards(data)).length} cards from cached data`);
