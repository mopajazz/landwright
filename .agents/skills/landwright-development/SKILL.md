---
name: landwright-development
description: Use when developing, debugging, reviewing, releasing, or documenting Landwright (worldpainter-studio), including terrain brushes, 2D/3D editing, paths, rivers, Living World atmosphere, Holler Maps assets, or future storytelling.
---

# Landwright development

Preserve a minimalist cartographic editor with complexity behind a small interface. Read the [engineering/product handoff](references/handoff.md) before implementation. In a checkout, inspect the current root `handoff.md`, source, tests, Git status, and instructions: they supersede this portable snapshot.

## Locate and orient

Repository: https://github.com/mopajazz/worldpainter-studio

Live app: https://mopajazz.github.io/worldpainter-studio/

Discover the checkout and remote; cloud paths and remote aliases vary. This is static HTML/CSS/ES modules, without a build step or runtime npm dependencies. `jsdom` is test-only. Baseline: v2.2, cache `2.2.0`, project schema **4**, imports **1–4**; verify HEAD before changing anything.

## Find the contract

| Work | Read first |
| --- | --- |
| Brush/tool/menu | `app.mjs`, `terrain.mjs`, `brushes.mjs`; handoff §§2–5 |
| Paths/rivers/reflow | `routes.mjs`, `editor.mjs`; §§3, 7, 15 |
| 3D/performance | `terrain3d.mjs`, `gpu-terrain.mjs`; §6 |
| Living World | `living.mjs`, app lifecycle; §16 |
| Saves/undo/export | `editor.mjs`, app state/composition; §§7–8 |
| Verification/release | `tests/`, `package.json`; §9 |
| Holler/storytelling | §§11–12; establish current scope first |

Keep 10 tools. Drawing, Details, Forest Scatter, and thumbnail preview were removed; preserve legacy content. Footprint/material selection keeps the active tool. Strength sculpts; Opacity affects Paint, Path, surface Erase. Flatten protects the perimeter by default. Route previews remain transient; commit once, cancel without edits. Keep bed heights, river water, effective geometry, and picking consistent. Validate imports/work budgets before mutation; never replay saved carving on load.

## Extend Living World

Use the separate overlay, not continuous terrain remeshing. Preserve bounded work, 30Hz cap, reduced-motion/hidden-tab/diagnostic/gesture/draft pause and resume. Current preferences: `landwright-living` → `{enabled,clouds,waterMotion}` Booleans. Effects stay outside project v4, history, autosave, and PNG composition. Any new persistence/export semantics need an explicit design decision.

Use queued window RAF in lifecycle tests; synchronous global RAF causes recursion. Keep jsdom alive through pending 600ms autosave. Follow `tests/living-interactions.test.mjs`.

## Verify and document

Run `npm ci` when needed, `npm test`, relevant `node --check` commands, and `git diff --check`. Browser-check visual changes in both themes and 2D/3D; jsdom does not verify pixels/GPU performance. Release through existing Pages `main:/`; inspect the actual remote/configuration. Coordinate cache URLs for runtime releases; docs-only changes need no version bump. Report deployment evidence and limitations.

Update `docs/tutorial.md`, `docs/kb/`, README and handoff alongside features; refresh this handoff snapshot. Preserve: **start Raise/Lower at 5–10% Strength, short strokes, inspect, increase gradually**.

## Common mistakes

- Claiming full WCAG compliance from color-pair tests.
- Treating visual river flow as hydrology; repeated Reflow can deepen beds.
- Assuming Holler originals are accessible: Windows paths/ChatGPT Library references are not downloaded assets. Locate files and tell the user they were found before integration.
- Assuming vegetation, inhabitants, day/night, or storytelling shipped. Revisit storytelling after terrain; do not add it implicitly.
