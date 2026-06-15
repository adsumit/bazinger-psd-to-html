#!/usr/bin/env node
/**
 * style-audit.mjs — Render the page and compare each element's COMPUTED styles
 * against the PSD-truth values in checks.json. Prints a pass/fail table and
 * exits non-zero if anything drifts. This is the "computed-style diff" — it
 * needs no image alignment and catches the micro-detail misses precisely
 * (e.g. a 30px grey "+" where the PSD says 24px white).
 *
 *   npm i -D playwright && npx playwright install chromium
 *   node style-audit.mjs            # uses checks.json
 *   node style-audit.mjs my.json    # custom checks file
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve, dirname } from "node:path";

const cfgPath = process.argv[2] || "checks.json";
const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));

const hexToRgb = (h) => {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const parseRgb = (s) => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// Normalize the page path into a URL (accepts a file path or an http URL).
// Resolve the page relative to the checks file's folder (not the CWD), so the
// `verify` npm script can call this from tailwind/ with ../checks.json and still
// find the page path correctly.
const cfgDir = dirname(resolve(cfgPath));
const pageUrl = /^https?:\/\//.test(cfg.page)
  ? cfg.page
  : pathToFileURL(resolve(cfgDir, cfg.page)).href;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: cfg.viewport_width || 1280, height: 1000 } });
await page.goto(pageUrl, { waitUntil: "networkidle" });

let pass = 0, fail = 0;
const rows = [];

for (const chk of cfg.checks) {
  const el = page.locator(chk.selector).first();
  if ((await el.count()) === 0) {
    rows.push(["? MISSING", chk.label, chk.selector, "selector matched nothing", ""]);
    fail++; continue;
  }
  if (chk.state === "hover") await el.hover();

  const computed = await el.evaluate((node, opts) => {
    const cs = getComputedStyle(node, opts.pseudo || null);
    const out = {};
    for (const p of opts.props) out[p] = cs.getPropertyValue(p);
    return out;
  }, { props: Object.keys(chk.expect), pseudo: chk.pseudo });

  for (const [prop, want] of Object.entries(chk.expect)) {
    const got = computed[prop];
    let ok;
    if (prop === "color" || prop.includes("color")) {
      const [r, g, b] = hexToRgb(want), [R, G, B] = parseRgb(got);
      ok = near(r, R, 4) && near(g, G, 4) && near(b, B, 4);
    } else if (/px$/.test(want)) {
      ok = near(parseFloat(want), parseFloat(got), 0.0);
    } else {
      ok = String(want).trim() === String(got).trim();
    }
    rows.push([ok ? "ok PASS" : "X FAIL", chk.label, prop, `want ${want}`, `got ${got}`]);
    ok ? pass++ : fail++;
  }
}

await browser.close();

const w = rows.reduce((m, r) => r.map((c, i) => Math.max(m[i] || 0, String(c).length)), []);
for (const r of rows) console.log(r.map((c, i) => String(c).padEnd(w[i])).join("  "));
console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
