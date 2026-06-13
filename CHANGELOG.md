# Changelog

All notable changes to the **Bazinger PSD → HTML/CSS** project.
Format based on [Keep a Changelog](https://keepachangelog.com); versioning follows [SemVer](https://semver.org) (`0.x` = pre-release).

**Project goal:** convert the "Bazinger" app landing-page PSD into four builds — **non-responsive, Bootstrap, raw-responsive, Tailwind** — built in chronological order to show how the implementation evolves, each pixel-accurate to the PSD at desktop. Builds live on branches off the non-responsive parent (`main`); the raw-responsive build is the one deployed.

---

## [Unreleased]

### In progress — non-responsive build (`main`)
**Baseline commit:** the existing static, fixed-width HTML/CSS build, plus the shared source of truth (`BUILD-SPEC.md`, `psd-spec.json`, `bazinger.png`) and the verification toolkit (psd-tools extractor, Playwright style audit, visual diff). The build is being brought to pixel-perfect against the PSD **section by section** — one commit per fix, verified by the audit and an eye-check against the PNG — with each section's JavaScript completed (slider, testimonials, etc.).

### Roadmap
- **v0.1.0** — non-responsive build pixel-perfect + all section JS done → tagged on `main` (the shared parent for all branches)
- **v0.2.0** — `bootstrap` branch: the Bootstrap 4.5.3 build completed, pixel-accurate and responsive across its breakpoints
- **v0.3.0** — `raw-responsive` branch: hand-written modern CSS, pixel-exact at desktop then fully responsive with modern custom breakpoints (no legacy Bootstrap breakpoints)
- **v0.4.0** — `tailwind` branch (off raw-responsive): rebuilt to professional Tailwind standard
- **v1.0.0** — the raw-responsive build deployed (portfolio)

### Tooling & authorship
AI assistance (Claude Code) and the measurement toolkit are used throughout to work faster, under the verification gate in `CLAUDE.md` — measured changes only; fidelity is verified against the design PNG, never asserted. The design measurement, the spec, the gate, and the corrections when output drifts are the engineering. See the README's *Tooling & authorship* section.

---

> History starts at the baseline commit. Earlier builds (the fixed-width and Bootstrap versions) are completed *within* this repo's history as real commits, not backfilled — so the version entries above fill in as each build reaches its milestone.

[Unreleased]: https://github.com/adsumit/bazinger-psd-to-html
