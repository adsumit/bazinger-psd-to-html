#!/usr/bin/env node
/**
 * banner-diff.mjs — hero/banner-only variant of visual-diff.mjs.
 *
 * Same engine as visual-diff.mjs / nav-diff.mjs (render at the PSD PNG's width,
 * pixelmatch the overlap, red = divergence), but it crops to the HERO BANNER
 * strip — y = 0..BANNER_H — and writes to a caller-named file so it never
 * overwrites diff.png / _nav_diff.png / a prior banner heatmap.
 *
 *   node tools/banner-diff.mjs <page.html> <psd.png> [outFile] [bannerHeight]
 *   node tools/banner-diff.mjs index.html bazinger.png _banner_2026-06-18_diff.png 760
 *
 * Defaults: page=index.html, psd=bazinger.png, out=tools/diff/_banner_diff.png, bannerHeight=760
 * (760 = the rendered psd-px banner height; the navbar overlays its top 95px,
 * so this strip is the full hero region including the nav chrome.)
 *
 * Mirrors nav-diff.mjs exactly — the only difference is the default crop height
 * (760 vs 95). Keeping a fresh out-name per run lets the user compare hero tuning
 * passes side by side; *diff.png names are gitignored.
 */
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve, dirname } from "node:path";

const pagePath = process.argv[2] || "index.html";
const psdPng   = process.argv[3] || "bazinger.png";
const outArg   = process.argv[4] || "_banner_diff.png";   // caller picks → no clobber
// outputs live in tools/diff/ (gitignored); a bare name lands there, an explicit path is kept
const outFile  = outArg.includes("/") ? outArg : `tools/diff/${outArg}`;
const BANNER_H = Number(process.argv[5] || 760);          // rendered psd-px banner height

const ref = PNG.sync.read(readFileSync(psdPng));
const W = ref.width;                       // render at the PSD PNG's width (1404)

const pageUrl = /^https?:\/\//.test(pagePath)
  ? pagePath
  : pathToFileURL(resolve(pagePath)).href;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: 1000 } });
await page.goto(pageUrl, { waitUntil: "networkidle" });
const shotBuf = await page.screenshot({ fullPage: true });
await browser.close();

const shot = PNG.sync.read(shotBuf);
// Crop to the banner strip: y = 0..BANNER_H, but never past either image's height.
const H = Math.min(BANNER_H, ref.height, shot.height);

// Copy a W x H top-strip out of a source image (y starts at 0 = page top).
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
  threshold: 0.12,            // same AA/sub-pixel tolerance as visual-diff.mjs
  includeAA: false,
});
mkdirSync(dirname(outFile), { recursive: true });   // ensure tools/diff/ exists
writeFileSync(outFile, PNG.sync.write(diff));

const pct = ((changed / (W * H)) * 100).toFixed(2);
console.log(`Banner ${W}x${H}. ${changed} differing px (${pct}%). Heatmap -> ${outFile}`);
console.log("Red = divergence. Open the heatmap and inspect the hero region.");
