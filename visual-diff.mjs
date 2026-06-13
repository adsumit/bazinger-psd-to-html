#!/usr/bin/env node
/**
 * visual-diff.mjs — Screenshot the rendered page and pixel-diff it against the
 * PSD PNG, writing a red heatmap (diff.png) of where they diverge plus a % score.
 * This is the catch-all for things not in checks.json (radii, shadows, bar tints).
 *
 *   npm i -D playwright pixelmatch pngjs && npx playwright install chromium
 *   node visual-diff.mjs raw-responsive/index.html bazinger.png
 *
 * NOTE on alignment: the PSD PNG (1404px wide) and a live full-page render never
 * line up perfectly — full-bleed sections scale with viewport width and total
 * heights differ. This renders at the PNG's width and compares the overlapping
 * area, so treat the heatmap as "where to LOOK", not a precise score. The
 * computed-style audit (style-audit.mjs) is the exact check; this is the net.
 */
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const pagePath = process.argv[2] || "raw-responsive/index.html";
const psdPng = process.argv[3] || "bazinger.png";

const ref = PNG.sync.read(readFileSync(psdPng));
const W = ref.width;                       // render at the PSD PNG's width

const pageUrl = /^https?:\/\//.test(pagePath)
  ? pagePath
  : pathToFileURL(resolve(pagePath)).href;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: 1000 } });
await page.goto(pageUrl, { waitUntil: "networkidle" });
const shotBuf = await page.screenshot({ fullPage: true });
await browser.close();

const shot = PNG.sync.read(shotBuf);
const H = Math.min(ref.height, shot.height);   // compare the overlapping height

// crop both to W x H so pixelmatch gets equal dimensions
const crop = (src) => {
  const out = new PNG({ width: W, height: H });
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const s = (src.width * y + x) << 2, d = (W * y + x) << 2;
      out.data[d] = src.data[s]; out.data[d + 1] = src.data[s + 1];
      out.data[d + 2] = src.data[s + 2]; out.data[d + 3] = src.data[s + 3];
    }
  return out;
};
const a = crop(ref), b = crop(shot);
const diff = new PNG({ width: W, height: H });

const changed = pixelmatch(a.data, b.data, diff.data, W, H, {
  threshold: 0.12,            // tolerance for AA/sub-pixel noise; raise to ignore more
  includeAA: false,
});
writeFileSync("diff.png", PNG.sync.write(diff));

const pct = ((changed / (W * H)) * 100).toFixed(2);
console.log(`Compared ${W}x${H}. ${changed} differing px (${pct}%). Heatmap -> diff.png`);
console.log("Red = divergence. Open diff.png and inspect the flagged regions.");
