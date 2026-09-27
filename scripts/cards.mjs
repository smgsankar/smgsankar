// Renders the README stat cards (light + dark variants) as self-contained SVGs.
// Fonts are subsetted woff2 files in assets/fonts, inlined as data URIs so the
// cards render identically inside GitHub's <img> sandbox — no external requests.

import { readFileSync } from "node:fs";

const FONT_DIR = new URL("../assets/fonts/", import.meta.url);
const font = (file) =>
  `data:font/woff2;base64,${readFileSync(new URL(file, FONT_DIR)).toString("base64")}`;

const FONTS = `
  @font-face { font-family: "Fraunces"; font-weight: 600; font-style: normal; src: url(${font("fraunces-600.woff2")}) format("woff2"); }
  @font-face { font-family: "Fraunces"; font-weight: 400; font-style: italic; src: url(${font("fraunces-italic.woff2")}) format("woff2"); }
  @font-face { font-family: "Instrument Sans"; font-weight: 500; src: url(${font("instrument-sans-500.woff2")}) format("woff2"); }
  .display { font-family: "Fraunces", Georgia, "Times New Roman", serif; font-weight: 600; letter-spacing: -0.02em; }
  .aside   { font-family: "Fraunces", Georgia, "Times New Roman", serif; font-weight: 400; font-style: italic; }
  .label   { font-family: "Instrument Sans", "Helvetica Neue", Arial, sans-serif; font-weight: 500; }
  .caps    { font-family: "Instrument Sans", "Helvetica Neue", Arial, sans-serif; font-weight: 500; text-transform: uppercase; letter-spacing: 0.14em; }
`;

export const THEMES = {
  light: {
    surface: "#f6f1e7",
    ink: "#1c1915",
    ink2: "#5f584d",
    ink3: "#9a927f",
    rule: "#ddd5c3",
    accent: "#c8401f",
    accentSoft: "#efd9cf",
    // Validated categorical set for the language bar (dataviz six checks, light surface).
    series: ["#c8401f", "#0b8a74", "#b57a00", "#4d4bb5", "#cc5c8a"],
    other: "#b3ab99",
  },
  dark: {
    surface: "#171512",
    ink: "#f1ebdf",
    ink2: "#a89f8e",
    ink3: "#6f675a",
    rule: "#2e2924",
    accent: "#e85a33",
    accentSoft: "#3a241c",
    // Same hues re-stepped for the dark surface, validated separately.
    series: ["#e85a33", "#22a38a", "#c98500", "#8380e6", "#d35f8a"],
    other: "#6f675a",
  },
};

const W = 846;
const PAD = 40;
const fmt = (n) => n.toLocaleString("en-US");
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function frame(t, h, id, title) {
  return `<defs><style>${FONTS}</style>
  <clipPath id="${id}-clip"><rect x="0" y="0" width="${W}" height="${h}" rx="14"/></clipPath>
  <pattern id="${id}-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect x="0" y="0" width="2.5" height="6" fill="${t.accent}"/>
  </pattern></defs>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${h - 1}" rx="14" fill="${t.surface}" stroke="${t.rule}"/>
  <rect x="${PAD}" y="34" width="8" height="8" rx="2" fill="${t.accent}"/>
  <text x="${PAD + 16}" y="42" class="caps" font-size="11" fill="${t.ink2}">${esc(title)}</text>
  <line x1="${PAD}" y1="60.5" x2="${W - PAD}" y2="60.5" stroke="${t.rule}"/>`;
}

function shortDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  return d
    .toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    .toUpperCase();
}

/* ---------------- card 1: contributions ---------------- */
export function statsCard(data, mode) {
  const t = THEMES[mode];
  const { years, stats, firstYear, generatedAt } = data;
  const { total, activeDays, peakDay } = stats;
  const perActiveDay = activeDays ? total / activeDays : 0;
  const currentYear = years[years.length - 1].year;
  const H = 332;
  const id = `s-${mode}`;

  let svg = frame(t, H, id, `GitHub · smgsankar`);
  svg += `<text x="${W - PAD}" y="42" text-anchor="end" class="caps" font-size="11" fill="${t.ink3}">Updated ${esc(shortDate(generatedAt))}</text>`;

  // Hero number + supporting figures.
  svg += `
  <text x="${PAD - 2}" y="168" class="display" font-size="78" fill="${t.ink}">${esc(fmt(total))}</text>
  <text x="${PAD}" y="194" class="caps" font-size="11.5" fill="${t.ink2}">contributions since ${firstYear}</text>`;

  const small = [
    { v: fmt(activeDays), l: "active days" },
    { v: fmt(peakDay), l: "best day" },
    { v: perActiveDay.toFixed(1), l: "per active day" },
  ];
  const smallX = [PAD, PAD + 118, PAD + 214];
  small.forEach((s, i) => {
    svg += `
  <text x="${smallX[i]}" y="262" class="display" font-size="30" fill="${t.ink}">${esc(s.v)}</text>
  <text x="${smallX[i]}" y="282" class="caps" font-size="10" fill="${t.ink3}">${esc(s.l)}</text>`;
  });

  // Divider between the figures and the chart.
  const divX = 372.5;
  svg += `<line x1="${divX}" y1="88" x2="${divX}" y2="${H - 36}" stroke="${t.rule}"/>`;

  // Year-by-year column chart — the skyline in miniature.
  const chartX = 400;
  const chartW = W - PAD - chartX;
  const n = years.length;
  const gap = 12;
  const colW = (chartW - gap * (n - 1)) / n;
  const top = 128;
  const base = 270;
  const maxYear = Math.max(...years.map((y) => y.total));

  svg += `<text x="${chartX}" y="96" class="caps" font-size="11" fill="${t.ink3}">By year</text>`;
  svg += `<line x1="${chartX}" y1="${base + 0.5}" x2="${W - PAD}" y2="${base + 0.5}" stroke="${t.rule}"/>`;

  years.forEach(({ year, total: v }, i) => {
    const x = chartX + i * (colW + gap);
    const h = Math.max((v / maxYear) * (base - top), 2);
    const r = Math.min(4, h / 2, colW / 2);
    const path = `M${x} ${base} v-${h - r} a${r} ${r} 0 0 1 ${r} -${r} h${colW - 2 * r} a${r} ${r} 0 0 1 ${r} ${r} v${h - r} z`;
    const ytd = year === currentYear;
    if (ytd) {
      svg += `<path d="${path}" fill="${t.accentSoft}"/><path d="${path}" fill="url(#${id}-hatch)"/>`;
    } else {
      svg += `<path d="${path}" fill="${t.accent}"/>`;
    }
    svg += `
  <text x="${x + colW / 2}" y="${base - h - 8}" text-anchor="middle" class="label" font-size="11" fill="${t.ink2}">${esc(fmt(v))}</text>
  <text x="${x + colW / 2}" y="${base + 20}" text-anchor="middle" class="label" font-size="11" fill="${ytd ? t.ink : t.ink3}">${year}${ytd ? "*" : ""}</text>`;
  });
  svg += `<text x="${W - PAD}" y="${H - 22}" text-anchor="end" class="aside" font-size="12" fill="${t.ink3}">* ${currentYear} is year to date</text>`;

  const label = `GitHub contributions for smgsankar: ${fmt(total)} since ${firstYear}, ${fmt(activeDays)} active days, best day ${peakDay}. Per year: ${years.map((y) => `${y.year} ${fmt(y.total)}`).join(", ")}`;
  return wrap(W, H, label, svg);
}

/* ---------------- card 2: languages ---------------- */
export function langsCard(data, mode) {
  const t = THEMES[mode];
  const langs = data.languages;
  const cols = 3;
  const rows = Math.ceil(langs.length / cols);
  const tileH = 52;
  const rowGap = 26;
  const H = 138 + rows * tileH + (rows - 1) * rowGap + 26;
  const id = `l-${mode}`;
  const color = (l, i) => (l.name === "Other" ? t.other : t.series[i % t.series.length]);

  let svg = frame(t, H, id, `GitHub · smgsankar`);
  svg += `<text x="${W - PAD}" y="42" text-anchor="end" class="caps" font-size="11" fill="${t.ink3}">Share of public code, by bytes</text>`;

  // Composition bar: one part-to-whole strip, 2px surface gaps between segments.
  const barY = 92;
  const barH = 14;
  const barW = W - 2 * PAD;
  const sum = langs.reduce((a, l) => a + l.pct, 0);
  svg += `<clipPath id="${id}-bar"><rect x="${PAD}" y="${barY}" width="${barW}" height="${barH}" rx="${barH / 2}"/></clipPath>`;
  svg += `<g clip-path="url(#${id}-bar)">`;
  let cursor = PAD;
  langs.forEach((l, i) => {
    const w = (l.pct / sum) * barW;
    const inset = i === 0 ? 0 : 1;
    svg += `<rect x="${cursor + inset}" y="${barY}" width="${Math.max(w - inset - (i === langs.length - 1 ? 0 : 1), 0.5)}" height="${barH}" fill="${color(l, i)}"/>`;
    cursor += w;
  });
  svg += `</g>`;

  // One tile per language: swatch carries identity, text stays in ink.
  const tileW = barW / cols;
  langs.forEach((l, i) => {
    const x = PAD + (i % cols) * tileW;
    const y0 = 138 + Math.floor(i / cols) * (tileH + rowGap);
    svg += `
  <rect x="${x}" y="${y0 + 1}" width="10" height="10" rx="3" fill="${color(l, i)}"/>
  <text x="${x + 18}" y="${y0 + 10}" class="caps" font-size="11" fill="${t.ink2}">${esc(l.name)}</text>
  <text x="${x}" y="${y0 + 46}" class="display" font-size="30" fill="${t.ink}">${l.pct.toFixed(1)}<tspan class="aside" font-size="20" fill="${t.ink3}" dx="2">%</tspan></text>`;
  });

  const label = `Top languages across public repos: ${langs.map((l) => `${l.name} ${l.pct.toFixed(1)}%`).join(", ")}`;
  return wrap(W, H, label, svg);
}

function wrap(w, h, label, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
  ${body}
</svg>
`;
}

export function renderCards(data) {
  return {
    "stats-card-light.svg": statsCard(data, "light"),
    "stats-card-dark.svg": statsCard(data, "dark"),
    "langs-card-light.svg": langsCard(data, "light"),
    "langs-card-dark.svg": langsCard(data, "dark"),
  };
}
