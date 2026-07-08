import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import {
  calendar,
  YEARS,
  STATS,
  LANGUAGES,
  PROJECTS,
  TIMELINE,
} from "./data.js";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* ================================================================
   Layout math — GitHub-calendar geometry.
   x = week column across all 8 years, z = day of week.
   ================================================================ */
const DAY_MS = 86400000;
const CELL = 1; // world units per week column
const GAP = 0.18;
const start = new Date(TIMELINE.start + "T00:00:00Z");
const end = new Date(TIMELINE.end + "T00:00:00Z");
// Align grid to the Sunday on/before the start date, like GitHub does.
const gridStart = new Date(start.getTime() - start.getUTCDay() * DAY_MS);
const totalDays = Math.round((end - gridStart) / DAY_MS) + 1;
const totalWeeks = Math.ceil(totalDays / 7);

const dayIndex = (dateStr) =>
  Math.round((new Date(dateStr + "T00:00:00Z") - gridStart) / DAY_MS);

const weekOfDate = (dateStr) => Math.floor(dayIndex(dateStr) / 7);

const counts = new Float32Array(totalDays);
let maxCount = 1;
for (const { d, c } of calendar) {
  const i = dayIndex(d);
  if (i >= 0 && i < totalDays) {
    counts[i] = c;
    if (c > maxCount) maxCount = c;
  }
}

/* ================================================================
   Scene
   ================================================================ */
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04070a);
scene.fog = new THREE.FogExp2(0x04070a, 0.016);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  400
);

/* ---------- the skyline: one instanced box per day ---------- */
const MAX_H = 11;
const box = new THREE.BoxGeometry(CELL - GAP, 1, CELL - GAP);
box.translate(0, 0.5, 0); // grow upward from the floor

const material = new THREE.MeshStandardMaterial({
  roughness: 0.35,
  metalness: 0.15,
});

const skyline = new THREE.InstancedMesh(box, material, totalDays);
skyline.instanceMatrix.setUsage(THREE.StaticDrawUsage);

const dummy = new THREE.Object3D();
const color = new THREE.Color();
const phosphor = new THREE.Color(0x1f7a3d);
const bright = new THREE.Color(0x46f27a);
const amber = new THREE.Color(0xffb347);
const dormant = new THREE.Color(0x0a1810);

const ZW = CELL * 7; // depth of one calendar column stack

for (let i = 0; i < totalDays; i++) {
  const week = Math.floor(i / 7);
  const dow = i % 7;
  const c = counts[i];
  const t = c / maxCount;
  const h = c === 0 ? 0.06 : 0.25 + Math.pow(t, 0.72) * MAX_H;

  dummy.position.set(week * CELL, 0, dow * CELL - ZW / 2);
  dummy.scale.set(1, h, 1);
  dummy.updateMatrix();
  skyline.setMatrixAt(i, dummy.matrix);

  if (c === 0) {
    color.copy(dormant);
  } else if (t > 0.6) {
    color.copy(bright).lerp(amber, (t - 0.6) / 0.4);
  } else {
    color.copy(phosphor).lerp(bright, t / 0.6);
  }
  skyline.setColorAt(i, color);
}
skyline.instanceColor.needsUpdate = true;
scene.add(skyline);

/* ---------- floor grid ---------- */
const grid = new THREE.GridHelper(
  totalWeeks * CELL * 2.2,
  Math.round(totalWeeks * 1.1),
  0x0e2c18,
  0x081a0e
);
grid.position.set((totalWeeks * CELL) / 2, -0.02, 0);
scene.add(grid);

/* ---------- year markers: glowing text sprites ---------- */
function makeYearSprite(text) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 192;
  const ctx = c.getContext("2d");
  ctx.font = "italic 300 150px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(70,242,122,0.9)";
  ctx.shadowBlur = 26;
  ctx.fillStyle = "rgba(216,255,228,0.92)";
  ctx.fillText(text, 256, 96);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    })
  );
  sprite.scale.set(14, 5.25, 1);
  return sprite;
}

for (const { year } of YEARS) {
  const sprite = makeYearSprite(String(year));
  const w = weekOfDate(`${year}-01-01`);
  sprite.position.set(w * CELL + 16, 16, -ZW * 2.3);
  scene.add(sprite);
}

/* ---------- dust particles ---------- */
const DUST = 900;
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(DUST * 3);
for (let i = 0; i < DUST; i++) {
  dustPos[i * 3] = Math.random() * totalWeeks * CELL;
  dustPos[i * 3 + 1] = Math.random() * 26;
  dustPos[i * 3 + 2] = (Math.random() - 0.5) * 70;
}
dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(
  dustGeo,
  new THREE.PointsMaterial({
    color: 0x46f27a,
    size: 0.12,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true,
  })
);
scene.add(dust);

/* ---------- lights ---------- */
scene.add(new THREE.AmbientLight(0x1a3324, 1.6));
const key = new THREE.DirectionalLight(0xbfffd4, 1.4);
key.position.set(0.4, 1, 0.6);
scene.add(key);
const rim = new THREE.DirectionalLight(0xffb347, 0.5);
rim.position.set(-0.6, 0.4, -1);
scene.add(rim);
// A roaming point light that travels with the camera for local glow.
const lantern = new THREE.PointLight(0x46f27a, 34, 40, 1.8);
scene.add(lantern);

/* ---------- post-processing: bloom ---------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.55, // strength
  0.85, // radius
  0.12 // threshold
);
composer.addPass(bloom);

/* ================================================================
   Scroll-driven camera flight, 2019 → 2026
   ================================================================ */
const startX = weekOfDate(calendar[0].d) * CELL; // first ever contribution
const endX = weekOfDate(TIMELINE.today) * CELL;

let scrollT = 0; // 0..1 smoothed
let scrollTarget = 0;

function readScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  scrollTarget = max > 0 ? window.scrollY / max : 0;
}
window.addEventListener("scroll", readScroll, { passive: true });
readScroll();

const hudYear = document.getElementById("hud-year");
const hudFill = document.getElementById("hud-fill");

const firstYear = YEARS[0].year;
const lastYear = YEARS[YEARS.length - 1].year;
const daysFlown = Math.round(
  (new Date(TIMELINE.today + "T00:00:00Z") -
    new Date(calendar[0].d + "T00:00:00Z")) /
    DAY_MS
);
document.getElementById("hud-label").textContent =
  `flying over ${daysFlown.toLocaleString("en-US")} days of commits`;

const clock = new THREE.Clock();
let paused = false;

function frame() {
  const t = clock.getElapsedTime();

  // Ease toward the scroll position — cheap inertia.
  scrollT += (scrollTarget - scrollT) * (prefersReducedMotion ? 1 : 0.06);

  const x = startX + (endX - startX) * scrollT;
  // Altitude and lateral drift: swoop low mid-flight, rise at both ends.
  const swoop = Math.sin(scrollT * Math.PI);
  const alt = 16 - swoop * 6.5 + scrollT * 7; // climb out at the end
  const side = 24 - swoop * 7 + scrollT * 4;

  camera.position.set(
    x - 10,
    alt + Math.sin(t * 0.4) * 0.35,
    side + Math.cos(t * 0.31) * 0.4
  );
  camera.lookAt(x + 9, 2.2, -1.5);

  lantern.position.set(x, 10, 6);

  dust.rotation.y = t * 0.006;

  // HUD: current year under the camera + progress bar.
  const date = new Date(gridStart.getTime() + (x / CELL) * 7 * DAY_MS);
  hudYear.textContent = String(
    Math.min(lastYear, Math.max(firstYear, date.getUTCFullYear()))
  );
  hudFill.style.transform = `scaleX(${scrollT})`;

  composer.render();
  if (!paused) requestAnimationFrame(frame);
}

document.addEventListener("visibilitychange", () => {
  paused = document.hidden;
  if (!paused) {
    clock.getDelta();
    requestAnimationFrame(frame);
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

requestAnimationFrame(frame);

/* ================================================================
   UI: populate panels from data
   ================================================================ */
const maxYear = Math.max(...YEARS.map((y) => y.total));
document.getElementById("ramp").innerHTML = YEARS.map(
  ({ year, total }) => `
  <li>
    <span>${year}</span>
    <span class="bar" style="--w:${Math.max(total / maxYear, 0.004)}"></span>
    <span class="n">${total.toLocaleString()}</span>
  </li>`
).join("");

document.getElementById("stats").innerHTML = STATS.map(
  ({ value, label }) => `
  <div class="stat"><b>${value}</b><span>${label}</span></div>`
).join("");

document.getElementById("langs").innerHTML = LANGUAGES.map(
  ({ name, pct, color }) => `
  <li>
    <div class="row"><span>${name}</span><span class="pct">${pct}%</span></div>
    <div class="track"><span class="fill" style="--w:${pct / 100};--lc:${color}"></span></div>
  </li>`
).join("");

document.getElementById("projects").innerHTML = PROJECTS.map(
  ({ name, desc, lang, year, url }) => `
  <a class="project" href="${url}" target="_blank" rel="noreferrer">
    <span class="arrow">↗</span>
    <h3>${name}</h3>
    <p>${desc}</p>
    <span class="meta"><span>${lang}</span><span>${year}</span></span>
  </a>`
).join("");

/* ---------- reveal panels on scroll ---------- */
const observer = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) e.target.classList.add("is-visible");
    }
  },
  { threshold: 0.25 }
);
document.querySelectorAll(".panel").forEach((p) => observer.observe(p));
