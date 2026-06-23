# Bazinger — PSD → HTML

Pixel-accurate rebuild of a Photoshop landing-page design, built four ways
(non-responsive → bootstrap → raw-responsive → tailwind) as a frontend study.
The point isn't only the page — it's the process: the design file is the source
of truth, and fidelity is verified by measurement, not by eye.

## Builds

Built in chronological order, to trace how frontend practice evolved from a
fixed-width 2013 layout to hand-written responsive CSS and Tailwind:

1. **non-responsive** — static, fixed-width, desktop-only; pixel-accurate to the PSD with no responsive behavior (faithful to how the original was built).
2. **bootstrap** — Bootstrap 4.5.3 rebuild, responsive across its breakpoints.
3. **raw-responsive** — hand-written modern CSS (Flexbox/Grid + eyeballed breakpoints); pixel-accurate *and* fully responsive — the primary deliverable, deployed live.
4. **tailwind** — rebuilt to Tailwind.

At desktop width (≥1110px) every build matches the PSD exactly; below that, the
responsive builds are the developer's design (the PSD specifies desktop only).

## How it's built

Each section is built from the PSD, then verified against the flattened PSD
export (`bazinger.png`) with a computed-style audit and a visual pixel-diff
before commit. Where a raw layer value disagrees with the rendered pixels, the
pixels win. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full toolkit and workflow.

## Setup

```
pip install -r requirements.txt   # PSD extraction tool (psd-tools + Pillow)
npm install                       # audit + visual-diff tools
npx playwright install chromium   # headless browser the two tools drive
```

## Verify

```
npm run audit    # computed-style checks (typography / color) — PASS/FAIL per property
npm run diff     # visual heatmap vs the reference PNG → tools/diff/diff.png
```

## Branches

```
main                 # non-responsive build — shared parent (spec + toolkit live here)
 ├─ bootstrap        # Bootstrap 4.5.3 rebuild
 └─ raw-responsive   # modern hand-written CSS — primary deliverable, deployed
      └─ tailwind    # Tailwind rebuild, off raw-responsive
```

## Tooling & AI use

I use AI assistance (Claude Code) and the measurement toolkit throughout, as
productivity tools — to apply already-specified changes quickly and save time,
the way most developers now work. They do not make the design or architecture
decisions: every value applied comes from the measured spec, and the AI is bound
by one rule written into `CLAUDE.md` — report measured changes only, never claim
the output matches the design. That judgment is mine, made against the PNG. The
engineering lives in the parts that aren't generation — measuring the design,
writing the spec, building the verification gate, and correcting the output when
it drifts (a shadow rendered too dark, a Photoshop layer value that doesn't map
cleanly to CSS). The project's history is largely a record of those corrections.

## Status

Active — see [CHANGELOG.md](CHANGELOG.md). The non-responsive build is the current
baseline on `main`, being brought to pixel-perfect section by section; the
raw-responsive build is the one that goes live.
