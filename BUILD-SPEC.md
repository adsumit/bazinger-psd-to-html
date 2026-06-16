# Bazinger — BUILD-SPEC

**The single source of truth for the rebuild.** Supersedes `psd-fixes.md`, `psd-fixes-2.md`, and `DESIGN-SPEC.md` — where any older document disagrees with this one, this one wins; where this one disagrees with the design PNG, **the PNG wins** (see §2).

**Build order (chronological, on branches off the non-responsive parent):** non-responsive (fixed-width, desktop-only, pixel-exact) → Bootstrap (responsive) → raw-responsive (modern CSS — pixel-exact *and* responsive; the primary deliverable, deployed) → Tailwind (built off the finished raw-responsive). This spec defines the **PSD-exact desktop target shared by all four builds**; responsive behavior is per-build (the non-responsive build has none by design).

Generated 2026-06-10 · Maintainer: adsumit

---

## 1. Provenance — how this spec was generated

The pipeline:

1. **`bazinger_UPDATED.psd`** (canvas 1404 × 4364) was parsed with **psd-tools** via `extract_psd_spec.py`, producing **`psd-spec.json`** — all 223 layers machine-extracted: geometry (psd + true px), fills, layer effects (color / opacity / distance / size / blend mode), text runs (font / size / color / tracking), and fill-opacity tagged blocks.
2. **`bazinger.png`** — the flattened export of the same canvas, 1:1 with PSD pixels — was sampled pixel-by-pixel with **Pillow** to capture *rendered* values: effective colors under blend modes and tints, real shadow extents, true element positions and insets.
3. Values were cross-checked by eye against cropped PNG regions, and on the build side are verified with the **Playwright** style audit (`style-audit.mjs` + `checks.json`, 112 computed-style checks) and `visual-diff.mjs` (pixel-diff heatmap vs the PNG).

| Tool | What it is | Official |
|---|---|---|
| **psd-tools** | Python library that reads Adobe Photoshop PSD/PSB files per Adobe's published file-format specification — layer tree, geometry, layer effects, text-engine data. Install: `pip install psd-tools` | https://psd-tools.readthedocs.io · https://github.com/psd-tools/psd-tools |
| **Pillow** | The actively-maintained fork of PIL, Python's imaging library — used here to crop and sample the flattened PNG for rendered-pixel truth. Install: `pip install Pillow` | https://python-pillow.org · https://pillow.readthedocs.io |
| **Playwright** | Browser automation by Microsoft — drives headless Chromium to read computed styles for the fidelity audit. | https://playwright.dev |

**Unit conversion:** the PSD canvas is a 0.9489× export of the 1480px design → `true_px = psd_px × 1.054`. All values below are **true px** unless marked `psd-px`.

---

## 2. ⚠️ Eyeballing caveat — read before trusting any number

This spec mixes **machine-extracted layer data** with **human-verified rendered values** — and in this project the two repeatedly disagreed. Raw layer values that were wrong as CSS until corrected against the PNG:

- **Nav active bar:** layer box is 40×5, but it straddles the navbar's top edge → renders ~1px, not 5px (eyeballed from the PNG).
- **Hexagon shadow:** Photoshop's distance-3 / size-8 does **not** translate to a CSS blur — any blur halos the shape. Final value is zero-blur, and the measured color is light grey (`#EAEAEA` on `#F9F9F9`), not black. Four wrong attempts before measuring.
- **Section titles:** positionally centered in the PSD while their text justification reads "left" — `text-align` checks only apply to multi-line paragraphs.
- **Opacity is stored in layers, not in the obvious field:** contact panel fill-opacity 80% and footer text 25% live in tagged blocks / layer opacity, separate from the fill color.
- **Hex drift between extraction passes:** e.g. `#91C46B` vs `#92C46B`, `#FD7C00` vs `#FD7B00` — ±1 channel step. Confirm on screen.
- **Nav link size (eyeballed 2026-06-16):** psd-spec is 12px (≈ true 13×0.9489=12.34), but **12.4px** + `transform: scaleY(0.9)` reads truest against the PNG — menu-band heatmap red dropped 3130→1560. (`checks.json` `.header .menu .active` updated 12→12.4.)
- **Logo image height (eyeballed 2026-06-16):** psd-spec is 50px (130×50 psd-px), but the raster `logo.png` matches best at **48.5px** + `transform: scale(1.01)` — logo-band heatmap red 667→117. (`checks.json` `.header .logoimg` updated 50→48.5; `scale(1.01)` is visual-only, doesn't change computed height.)

**Authority order: (1) `bazinger.png` rendered pixels → (2) `psd-spec.json` layer data → (3) this document.** Any value here may still mismatch the rendered website against the pixel-accurate PSD/PNG — **every applied value must be eye-verified on screen against the PNG.** The automated audit reads computed styles only; it cannot see positioning, clipping, shadows, or transitions — those remain visual checks.

Items **not** listed in this spec (e.g. download-band height/background, exact inter-section paddings) were not measured. **Measure them from the PNG at build time — never guess.**

---

## 3. Canvas, container & units

- Design canvas **1404px** full-bleed; content container **1110px centered** (psd x 147–1257, center x 702). Hero background ~1404×760.
- Full-bleed sections: banner, video, download band, contact/map, footer (plus the features/testimonials background tints). Inner content always capped at 1110.
- **Section heights (desktop):** banner **760px** (from absolute top), video **524px**.
- **Units policy:** **px** for the PSD-exact desktop layer (≥1110px) — most faithful to a fixed-px design. Fluid units (`max-width` + `%`, flex/grid, media queries; `rem` only if user-scalable type is wanted) strictly **below** 1110px.
- **Decimal precision (font-sizes):** values may carry **up to 2 decimal places** (e.g. `12.4px`); plain integers stay valid (`34` ≡ `34.00`). This **relaxes** the earlier 0-dp standardization (commit `29ad428`). Audit px tolerance stays **0.1** (`style-audit.mjs:66`), so a 2nd-decimal value is *permitted but not strictly enforced* — when you tune a font-size, update the matching `checks.json` `expect` so the two stay within 0.1.
- **Coordinate space:** all px above are the PSD's **rendered** pixels — the 1404 canvas you see in `bazinger.png`. The PSD is a 0.9489 scale of a 1480px master; we build to the rendered sizes so 1px CSS = 1px PNG, no scale factor anywhere.

The per-section px values further down (§6 shadows, §7 header, §8 hero, etc.) are still master-space — rescale **font-sizes, dimensions and positions** by 0.9489 as you rework each section; **leave non-spatial / sub-pixel values as-is** (hairlines, small borders, shadow offsets, opacities, transitions, colors). The PNG outranks the spec anyway, so treat the rescaled numbers as guidance and the pixels as truth.

## 4. Color palette (exact)

| Token | Value | Used for |
|---|---|---|
| Brand blue | `#4BCAFF` | links, active nav, accents, LEARN MORE, pro pricing, labels, hexagon, dots |
| Charcoal | `#414042` | dark headings, feature item 3 circle, dark buttons, footer base, Send button |
| Body gray | `#838383` | feature/gallery card paragraphs |
| Muted gray | `#D7D7D7` | pricing lists + basic/advanced labels |
| Pricing green | `#91C46B` | basic band + button |
| Pricing orange | `#FD7C00` | advanced band + button |
| Send text | `#72B3CC` | "Send" label |
| Placeholder | `#D3D3D3` | form placeholders |
| Gallery grey base | `#555657` | gallery items 2–4 base |
| Gallery featured base | `#4E9ABA` | gallery item 1 base |
| Label bars (effective) | `#5F6B70` / featured `#597886` | gallery label bars (sampled) |
| Video overlay (effective) | `#5E8DA0` | flat overlay approximation — sampled range `#48788D`–`#74A6BB` (eyeball) |
| Navbar bg | `rgba(7,7,7,0.30)` | header bar over hero |
| Navbar bottom line | `box-shadow: 0 1px 0 rgba(255,255,255,0.06)` | hairline alpha eyeballed 0.20 → 0.1 → 0.06 |
| Contact panel fill | `rgba(75,202,255,0.8)` | measured fill-opacity 204/255 = 80% |
| Footer text | `rgba(254,254,254,0.25)` | white @ 25% layer opacity — NOT solid grey |

Do **not** use `#FCB733` (old gold nav hover — removed; hover is brand blue).

## 5. Fonts

`@font-face` from the original files in `/font` — **never Google Fonts**: Lato Light 300 / Regular 400 / Bold 700 / Black 900 / Bold-Italic; DroidSans Regular / Bold; FontAwesome (glyphs: +, apple, android, play, chevrons); Arial for form placeholders only. Letter-spacing from PSD tracking: `ls(px) ≈ size × tracking / 1000`.

## 6. Global text shadows (exact)

| Element | text-shadow |
|---|---|
| Hero heading | `0 1px 3px rgba(25,22,24,0.36)` |
| Gallery "+" | `0 1px 3px rgba(25,22,24,0.44)` |
| Video heading | `0 1px 3px rgba(25,22,24,0.36)` |
| Price numbers | `0 1px 2px rgba(25,22,24,0.30)` |
| "Do you Like this app?" | `0 1px 3px rgba(25,22,24,0.36)` |
| Contact "Send" | `0 1px 0 rgba(0,0,0,0.40)` |

(Hexagon shadow in §13 — it's a filter, not a text-shadow.)

---

## 7. Section 1 — Header / nav

- Bar: `background: rgba(7,7,7,0.30); box-shadow: 0 1px 0 rgba(255,255,255,0.06);` over the hero (hairline opacity eyeballed from the PNG: 0.20 → 0.1 → 0.06). Fixed nav `z-index:2` to sit above the banner's `.banner_bg`/content layers.
- **Logo:** one wordmark, two spans — "ba" `#FFFFFF` + "zinger" `#4BCAFF`, DroidSans-Bold 36px, ls −1.44px; wifi arc (SVG) above. **Vertically center the WORDMARK** in the navbar, not the whole logo box (the arc drags the box center down). In the non-responsive build the wordmark is a **raster `logo.png`**, rendered at height **48.5px psd-px** (eyeball-corrected from 50; + `transform: scale(1.01)`, visual-only — see §2).
- **Nav links:** DroidSans 13px true `#FFFFFF` → rendered **12.4px psd-px** (eyeball-corrected, + `transform: scaleY(0.9) translateY(-2px)` squash — see §2), each `<a>` fills the navbar height.
  - Hover: color → `#4BCAFF` **only** (no bold).
  - Active (clicked): `#4BCAFF` + DroidSans-**Bold**.
  - **Bar:** 1px `#4BCAFF` lifted to **`top:-3px`** above the navbar's top edge (eyeballed from the PNG), width = the link (`left:0; right:0`), lives in the base state at `opacity:0`, revealed on hover/active — `transition: opacity 300ms ease` matching the link's `color 300ms ease` so they animate together.

## 8. Section 2 — Hero / banner slider (3 slides, vanilla JS)

- Height **800px**. Background lives on a **`.banner_bg` child div** (absolute, fills the banner; separated so the image can be `transform`ed independently of the content), NOT on `.banner` itself. Image **`hero_bg.png`** (natively 1404 wide = the canvas width), `background: center top / cover no-repeat` (cover fills the full width with no contain-letterbox; top-aligned shows the hero's top slice). `.banner { position:relative; overflow:hidden }` and `.banner .center { position:relative; z-index:1 }` keep the text above the image.
- **Heading: ONE LINE** — one `<h1>`, two inline spans: "Simple, Beautiful " Lato-Light + "and Amazing" Lato-Bold, both 48px `#FFFFFF`, shadow per §6. Paragraph Lato-Light 18px `#FFFFFF`, no shadow. Blue underline accent 4px `#4BCAFF`. "Aavailable on :" Lato-Light 18px — **the typo is in the PSD; keep it**. Store circles at 35% opacity.
- Buttons ~198×67: DOWNLOAD = transparent + 2px `#FFFFFF` border, Lato-Bold 15 `#FFFFFF`; LEARN MORE = `#4BCAFF`, Lato-Bold 15 `#FEFEFE`, drop shadow `#277697` (params: eyeball vs PNG).
- **Dots (slide indicators):** circles, flex row `align-items:center; justify-content:center; gap:9px`. Active = 17px solid `#4BCAFF` (1px border same); inactive ×2 = 13px transparent + 1px `#FFFFFF` border.
- **Arrows (prev/next):** 56px circles, vertically centered. Default `rgba(255,255,255,0.2)` + white chevron; hover solid `#4BCAFF` + dark chevron `#143C4A` (measured ~`#005877`-family; reads near-black). `transition: background 300ms ease, color 300ms ease`. **Horizontal: anchored to the content, not the viewport** — `.prev{left:calc(50% - 670px)}` / `.next{right:calc(50% - 670px)}` (670 = 585 half-container + 85 gutter; design gap paragraph→arrow ≈36px). Known: clips below ~1340px viewport → handled in the responsive pass (§17).

## 9. Section 3 — Features

4 icon circles ~173px across the 1170 container, glyph ~50–74px inside. **Item 3 ("multipurpose") circle is charcoal `#414042`; the other three brand blue.** Card title Lato-Bold 15 `#414042` (active `#4BCAFF`); body Lato-Regular 13 `#838383`, **text-align center**. Section title Lato-Black 36 `#414042` + subtitle Lato-Light 20 `#414042` (titles are positionally centered — see §2).

## 10. Section 4 — Gallery

- Box **273×202**, `border-radius:10px`, `overflow:hidden`, base `#555657` (items 2–4).
- Image = background on a child `.photo`: `background: url() center / 160% no-repeat` — the PSD renders images at **1.6× the box**, center-cropped. `object-fit: cover` is wrong (downscales). **Keep the extracted blurry JPGs as-is — do not replace.**
- Featured item 1: base `#4E9ABA`, `.photo` at `opacity:.4`, white "+" (FontAwesome 24px) ~11px above box vertical center, shadow per §6.
- Label bar 54px tall, dark translucent (`#5F6B70` / featured `#597886`), "SCREEN SHOT #n" Lato-Bold 15 `#4BCAFF`. Card body Lato-Regular 13 `#838383` center.

## 11. Section 5 — Video

Height **550px**, full-bleed background + flat overlay `#5E8DA0` (eyeball — sampled range in §4), content vertically centered. Heading "Watch the best Technology in Action" Lato-Light/Bold 48 `#FFFFFF` + shadow; paragraph Lato-Light 18; centered play icon.

## 12. Section 6 — Prices

- Side cards **302×418**; **pro (center) card 373×458** — 71px wider, 40px taller, protrudes ~20px top and bottom. Card bg `#F9F9F9`, border 1px `#DAD7D7`.
- Bands 119px full-card-width: basic `#91C46B`, pro `#4BCAFF`, advanced `#FD7C00`; matching PURCHASE buttons ~175×53, Lato-Bold 15 `#FEFEFE`.
- Price numbers DroidSans-Bold **85px** `#FFFFFF`, ls −4.25px, shadow per §6. Labels: basic/advanced Lato-Bold 17 `#D7D7D7` ls −0.51px; **pro Lato-Bold 22 `#4BCAFF`** ls −0.66px. Lists Lato-Bold 18 `#D7D7D7` (pro `#4BCAFF`).

## 13. Section 7 — Testimonials (3 quotes, vanilla JS)

- Layout: hexagon (143×161) + ~38px gap + quote box **333px** = one **~514px group, centered** in the container (center x 740); hexagon and text vertically centered to each other. **Not** `space-between`.
- Quote: Lato-Bold 14 `#4BCAFF`, ls −0.14px, 4 lines, **text-align left**. Author "John Doe" / "from some company": Lato-BoldItalic 14 `#4BCAFF`, **text-align right**. Slide 1's sentence order matches slides 2–3 so all quotes run 4 lines and center identically.
- **Hexagon:** `base.svg` (blue hexagon + 7px white ring) + `icon.svg` (white avatar 94×93) absolutely centered inside a 143×161 wrapper. **Shadow:** `filter: drop-shadow(0 3px 0 rgba(0,0,0,0.1));` — **zero blur** (any blur halos the shape), **light grey** (measured `#EAEAEA` on `#F9F9F9`; 0.06 exact, 0.08–0.1 acceptable). Traces the lower contour ("V"); bake into base.svg only if tighter is ever needed.
- Dots: three **53×9px** `#4BCAFF` bars — active 100%, inactive 32% opacity. (These are bars; the hero dots in §8 are circles — don't mix them up.)

## 14. Section 8 — Download band

"Do you Like this app?" Lato-Bold **55px** `#FFFFFF`, ls −2.75px, shadow per §6; DOWNLOAD NOW button Lato-Bold 15 `#414042` on white. Band background/height: **measure from the PNG at build time** (§2).

## 15. Section 9 — Contact

- Full-bleed map background; panel **327px** wide, `background: rgba(75,202,255,0.8)` — **fill only at 80%** (map shows through faintly); drop-shadow/outer-glow stay full.
- Title "Contact" Lato-Bold 36 `#FFFFFF`, **horizontally centered** (100/99px side gaps).
- Fields **274px** wide, centered (insets left 27 / right 26). Heights: Name 38, Email 37, Subject 38, Message 148. White fill, faint shadow. Placeholders Arial 14 `#D3D3D3`.
- **Vertical rhythm:** title → first field **27px**; between fields **15px** (PSD measures 11; +4 approved by eye — a live example of §2); Message → Send **20px**.
- Send button **193×48** `#414042`, Lato-Bold 15 `#72B3CC`, text shadow per §6.

## 16. Section 10 — Footer

Base `#414042`. Text Lato-Regular 12px, color `rgba(254,254,254,0.25)` (white @ 25% — not solid grey). Copyright positioned left; terms/links positioned right.

---

## 17. Responsive requirements (below 1170px)

- **Identical-at-desktop rule:** at ≥1170px nothing may change — fidelity is judged there.
- Fluid container (`max-width:1170px; width:100%` + side padding); features/gallery reflow 4 → 2 → 1; pricing 3 → 1 (pro card keeps visual priority); nav collapses to hamburger (no mobile frames in the PSD — design it, keeping the palette and type scale); content images `max-width:100%; height:auto`.
- Arrows: guard with `max(15px, calc(50% - 670px))` (mirror for right) or hide ≤768px and let the dots carry the slider.
- Test at 375 / 591 / 768 / 992 / 1199 / 1280 / 1920.
- Below 1170 the layout decisions are the developer's craft — the PSD defines desktop only.

## 18. Verification workflow (every section, before every commit)

1. Build the section from this spec → 2. `node style-audit.mjs checks.json` — all checks pass → 3. eye-check the section against the cropped PNG → 4. (full page) `visual-diff.mjs` heatmap → 5. one commit per section.

Claude Code reports **measured changes** and never claims "matches the PSD" — the human verifies against the PNG. That gate is the project.
