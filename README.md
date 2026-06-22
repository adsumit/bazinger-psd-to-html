# Bazinger — PSD → HTML/CSS (four builds)

Four builds of one app landing-page design (PSD), built in **chronological order** to trace how front-end practice evolved — from a fixed-width, desktop-only layout (the 2013 approach) to hand-written modern responsive CSS and Tailwind:

1. **non-responsive** — static, fixed-width, desktop-only. Pixel-accurate to the PSD; no responsive behavior (faithful to how the original was built).
2. **bootstrap** — Bootstrap 4.5.3 rebuild, responsive across its breakpoints.
3. **raw-responsive** — hand-written modern CSS (Flexbox/Grid + custom, eyeballed breakpoints). Pixel-accurate *and* fully responsive — the primary deliverable, deployed live.
4. **tailwind** — rebuilt to professional Tailwind standard.

Each build lives on its own branch (see **Branches**). The point isn't only the page — it's the **process**: the design file is the source of truth, and fidelity is verified by **measurement**, not by eye.

## Goal & fidelity standard

- Every build is **visually identical to the PSD at desktop width (≥1170px)** — same fonts, sizes, weights, spacing, colors, and dimensions, taken from measured design values, not "looks close."
- The **non-responsive** build stops there (fixed-width, desktop-only). The **Bootstrap**, **raw-responsive**, and **Tailwind** builds add responsive behavior down to mobile; below 1170px the layout is the developer's design (the PSD specifies desktop only).
- Each section is checked against the design export pixel by pixel before it's accepted.

## Workflow

A measured pipeline, run section by section:

1. **Extract** — [psd-tools](https://github.com/psd-tools/psd-tools) parses the PSD into `tools/psd-spec.json` (223 layers: geometry, fills, layer effects, type runs). [Pillow](https://python-pillow.org) samples the flattened PNG for *rendered* truth — effective colors under blend modes, real shadow extents, true positions and insets.
2. **Specify** — values are consolidated into `BUILD-SPEC.md`, the single source of truth. Where a raw layer value disagrees with the rendered pixels — which it often does — the rendered value wins, and that decision is recorded in the spec.
3. **Build** — the section is implemented from the spec. Every CSS rule carries a comment explaining *why* that value exists.
4. **Audit** — [Playwright](https://playwright.dev) reads the live computed styles and checks them against the spec (computed-style checks: typography, color, alignment).
5. **Verify** — I compare the rendered section against the PNG, pixel by pixel, and correct any drift the audit can't see: positioning, clipping, shadows, transitions.

Steps 4–5 are the gate. Nothing is "done" until it is both measured *and* eye-verified against the design.

**Tooling & authorship.** I use AI assistance (Claude Code) and the measurement toolkit throughout, as productivity tools — to apply already-specified changes quickly and save time, the way most developers now work. They do not make the design or architecture decisions: every value applied comes from the measured spec, and the AI is bound by one rule written into `CLAUDE.md` — report measured changes only, never claim the output matches the design. That judgment is mine, made against the PNG. The engineering lives in the parts that aren't generation — measuring the design, writing the spec, building the verification gate, and correcting the output when it drifts (a shadow rendered too dark, a Photoshop layer value that doesn't map cleanly to CSS). The project's history is largely a record of those corrections.

## Branches

```
main                 # non-responsive build — the shared parent (spec + toolkit live here)
 ├─ bootstrap        # Bootstrap 4.5.3 rebuild
 └─ raw-responsive   # modern hand-written CSS — primary deliverable, deployed
      └─ tailwind    # Tailwind rebuild, off raw-responsive
```

Each branch holds that build at the repo root. The shared source of truth — `BUILD-SPEC.md`, `tools/psd-spec.json`, `bazinger.png`, and the audit toolkit — lives on `main` and is inherited by every branch. Branches are created once the non-responsive build is pixel-perfect with every section's JS complete.

## Verification toolkit

| File | What it does |
|---|---|
| `tools/extract_psd_spec.py` → `tools/psd-spec.json` | Dumps every PSD layer's properties (geometry, type, fill, effects) to JSON — the machine-readable source of truth. |
| `tools/style-audit.mjs` + `checks.json` | Renders the page and compares each element's **computed CSS** to the spec. Exact, no image alignment — the workhorse. |
| `tools/visual-diff.mjs` | Pixel-diffs a screenshot against `bazinger.png` → a red heatmap (`tools/diff/diff.png`). The catch-all net. |

**Install / run**
```
npm install
npx playwright install chromium
pip install psd-tools pillow            # only needed to regenerate the spec
node tools/style-audit.mjs                     # computed-style audit -> PASS/FAIL per property
node tools/visual-diff.mjs index.html bazinger.png   # pixel-diff -> tools/diff/diff.png
```

> `checks.json` selectors are per-build (class names differ); the **expected values are correct** (straight from `tools/psd-spec.json`). Point the selectors at the current branch's markup. Each entry accepts any property `getComputedStyle` returns, and `"state":"hover"` hovers first for hover-state colors.

## Status

Active — see [`CHANGELOG.md`](CHANGELOG.md). The **non-responsive** build is the current baseline on `main`, being brought to pixel-perfect section by section. Builds proceed in order; the **raw-responsive** build is the one that goes live.
