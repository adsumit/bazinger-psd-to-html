# Project: Bazinger — PSD-accurate landing page (four builds)

> Project-scoped rules for this repo only (non-global).

## Build plan & branches
- Four builds of ONE PSD, built chronologically on branches off `main`:
  **non-responsive (main) → bootstrap → raw-responsive → tailwind**.
- Each branch holds its build at the repo ROOT (`index.html`, `css/`, ...). The shared
  source-of-truth and toolkit live on `main` and are inherited by every branch.
- **Currently building: the non-responsive build** — fixed-width, desktop-only, with
  NO responsive behavior (faithful to the 2013 original). Responsiveness applies ONLY
  to the bootstrap / raw-responsive / tailwind builds, never this one.

## How I work / comments
- I'm learning raw responsive CSS and JavaScript. In any CSS or JS you write, comment
  generously and explain the *reasoning* — what a property does and why, why a
  breakpoint, flex vs grid — not just restate the code. Keep comments on trivial lines
  short so the important explanations stand out.

## Source of truth — AUTHORITY ORDER (this matters)
1. **bazinger.png** — the flattened PSD export = the rendered design. The ULTIMATE
   truth. Where layer data disagrees with the rendered pixels, the PIXELS WIN. (Proven
   repeatedly: a layer box can straddle an edge, a Photoshop shadow ≠ a CSS blur, fill
   opacity hides in tagged blocks, etc.)
2. **psd-spec.json** — every PSD layer machine-extracted. The values source for #3.
3. **BUILD-SPEC.md** — the consolidated, human-readable spec (measured values +
   provenance + the layer-vs-rendered caveats). The day-to-day working reference.
- The PSD/PNG is the design. The original `style.css` and earlier hand-tweaks are NOT
  fidelity references. (`DESIGN-SPEC.md` is retired — superseded by `BUILD-SPEC.md`.)

## Fidelity (desktop = content width ≥ 1110px)
- At ≥1110px every build matches the PSD exactly: font family + weight, font-size,
  line-height, letter-spacing, color, margin/padding, element dimensions, radius,
  shadow, and per-state (hover/active) styles — MEASURED, not re-derived.
- **Non-responsive build:** desktop-only, NO media queries. Other builds: you may
  change the layout MECHANISM (float → flex/grid) and add breakpoints BELOW 1110px;
  never restyle, resize, recolor, or respace at desktop.
- Fonts: original `.ttf` from `/font` via `@font-face` — never Google/system.
- Icons: **PSD-extracted inline SVGs** (`img/icons/`, `fill="currentColor"`). Font
  Awesome has been removed — do NOT reintroduce it or any icon-font dependency.

## Never assume — measure
- Do NOT infer any visual value (color, size, radius, shadow, alignment, spacing,
  opacity, per-state). Read it from `psd-spec.json` or sample `bazinger.png`; if it
  isn't there, extract it or ask — never guess a "reasonable" or "modern" value. Where
  the spec and the rendered PNG disagree, trust the PNG.
- Transcribe text content character-for-character (every list item, every line break,
  every typo that's in the PSD). Do not regenerate copy from sense — lines go missing.

## Verification gate — RUN AUTOMATICALLY (do not skip)
After ANY fidelity edit to the build's HTML/CSS, before reporting done:
1. Ensure `checks.json` `"page"` points at the build you edited (the current branch's
   root `index.html`) and its selectors match that markup (map any that report MISSING).
2. Run the computed-style audit; fix every FAIL with the exact value from
   `psd-spec.json` / the PNG; re-run until it prints `0 failed`:
   - non-responsive / raw-responsive (no build step):  `node tools/style-audit.mjs`
   - tailwind (builds then audits):  `npm run verify`  (from the `tailwind/` folder)
3. Run the visual net: `node tools/visual-diff.mjs index.html bazinger.png`; open `tools/diff/diff.png`;
   inspect any flagged region; add a `checks.json` entry for anything new it surfaces.
- "It matches" / "consistent" / "done" is a CLAIM that is ONLY valid after the audit
  prints `0 failed`. Never assert it from a glance or a screenshot. Report the audit
  summary (`N passed, M failed`) when handing the task back.
- (Pure refactors that don't change visual values — e.g. swapping an icon font for the
  equivalent SVG — are verified by eye-check against the PNG + no console errors, since
  the computed-style values are unchanged.)

## Toolkit (in `tools/`)
- `tools/extract_psd_spec.py` → regenerates `psd-spec.json` if the PSD changes (Python; deps
  in `requirements.txt`).
- `tools/style-audit.mjs` + `checks.json` → exact computed-style check (the gate).
- `tools/visual-diff.mjs` → pixel-diff heatmap vs `bazinger.png` (the net).
