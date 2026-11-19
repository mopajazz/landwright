---
name: landwright-development
description: Use when developing, debugging, reviewing, releasing, or documenting Landwright (worldpainter-studio), including terrain brushes, 2D/3D editing, paths, rivers, Living World atmosphere or future terrain behavior.
---

# Landwright development

Preserve a minimalist cartographic editor with complexity behind a small interface. Read the [engineering/product handoff](references/handoff.md) before implementation. In a checkout, inspect the current root `handoff.md`, source, tests, Git status, and instructions: they supersede this portable snapshot.

## Locate and orient

Repository: https://github.com/mopajazz/worldpainter-studio

Live app: https://mopajazz.github.io/worldpainter-studio/

Discover the checkout and remote; cloud paths and remote aliases vary. This is static HTML/CSS/ES modules, without a build step or runtime npm dependencies. `jsdom` is test-only. Baseline: v2.9/cache `2.9.0` removes settlements and refocuses on terrain behavior. Read handoff §0 and §29 first; §25–26 cover materials/sculpt controls, §23 for New World/export and §19 for woodland. Schema **9**, imports **1–9**. Verify HEAD/status before editing.

## Find the contract

| Work | Read first |
| --- | --- |
| Earthen materials | `earthen.mjs`, `material-paint.mjs`; handoff §25; approved study in `studies/earthen/` |
| New World/export resolution | `app.mjs`, `index.html`, `theme.css`; §23 |
| Brush/tool/menu | `app.mjs`, `terrain.mjs`, `brushes.mjs`; handoff §§2–5 |
| Paths/rivers/reflow | `routes.mjs`, `editor.mjs`; §§3, 7, 15 |
| 3D/performance | `terrain3d.mjs`, `gpu-terrain.mjs`; §6 |
| Forest density/placement | `forests.mjs`, app composition/lifecycle; §§18–19 |
| Living World | `living.mjs`, app lifecycle; §16 |
| Saves/undo/export | `editor.mjs`, app state/composition; §§7–8 |
| Verification/release | `tests/`, `package.json`; §9 |
| Holler/storytelling | §§11–12; establish current scope first |

Keep nine tools. The user removed Erase: Shift+Paint erases the chosen target; D/E adjusts Flatten Target height by 1block (Shift×10), Paint/Path Opacity by5%, never selects a tool or changes Strength. Raise/Lower start at8%; Smooth/Flatten at35%; remember strengths separately for those two groups during the session. Drawing, Details, Forest Scatter, and thumbnail preview were removed; preserve legacy content. Footprint/material selection keeps the active tool. Strength sculpts; Opacity affects Paint, Path, surface/forest Erase. Forest Paint edits density, preserving ground colors. Flatten protects the perimeter by default. Route previews remain transient; commit once, cancel without edits. Keep bed heights, river water, effective geometry, and picking consistent. Validate imports/work budgets before mutation; never replay saved carving on load.

## Extend Living World

Use the separate overlay, not continuous terrain remeshing. Preserve bounded work, 30Hz cap, reduced-motion/hidden-tab/diagnostic/gesture/draft pause and resume. Current preferences: `landwright-living` → `{enabled,clouds,waterMotion,vegetationMotion}` Booleans. Motion stays outside project/history/exports; static forests save density in v5 and appear in Map PNGs. Any new persistence/export semantics need an explicit design decision.

Use queued window RAF in lifecycle tests; synchronous global RAF causes recursion. Keep jsdom alive through pending 600ms autosave. Follow `tests/living-interactions.test.mjs`.

## Verify and document

Run `npm ci` when needed, `npm test`, relevant `node --check` commands, and `git diff --check`. Browser-check visual changes in both themes and 2D/3D; jsdom does not verify pixels/GPU performance. Release through existing Pages `main:/`; inspect the actual remote/configuration. Coordinate cache URLs for runtime releases; docs-only changes need no version bump. Report deployment evidence and limitations.

Update `docs/tutorial.md`, `docs/kb/`, README and handoff alongside features; refresh this handoff snapshot. Preserve: **start Raise/Lower at 5–10% Strength, short strokes, inspect, increase gradually**.

Woodland coverage, canopy height and RGBA are derived, never saved. Keep picking/render geometry shared; rasterize on scheduled frames, not pointer events. Forest habitat masks cache by route-array identity: replace committed arrays immutably. Water/cliffs/path corridors hide trees while retaining density. Imports1–4 preserve old Forest color and start with empty density.

## Common mistakes

- Claiming full WCAG compliance from color-pair tests.
- Treating visual river flow as hydrology; repeated Reflow can deepen beds.
- Assuming Holler originals are accessible: Windows paths/ChatGPT Library references are not downloaded assets. Locate files and tell the user they were found before integration.
- Assuming inhabitants, day/night, or storytelling shipped. Revisit storytelling after terrain; do not add it implicitly.


Keep terrain grids 128/192/256 separate from MapPNG sizes 1024/2048/4096. Live previews must never mutate active terrain/history. Keep Cancel/Escape safe, creation atomic, backup editable, and Heightmap bed-only at N. Do not claim larger editable worlds, rectangular/retro formats or extra terrain detail from 4K image scaling.

Eight ground materials exclude Forest4; coverage order is[1,2,3,5,6,7,8,9]. Preserve legacy paint RGB/alpha and original v1/v2 palette migration. Schema7 coverage is canonical Base64, empty for zero weights; validate before mutation. Three visible footprints; Grain retired. Ground texture is derived, uses raw bed/all-river context and never changes elevation. Share the ground raster across2D/3D/MapPNG; keep diagnostics and Heightmap clean. Active edits use N² then restore4N on release. Profile release rebuilds and Canvas hover; do not promise a fixedFPS.


Settlements are removed by explicit user instruction. Do not restore their menus, assets, modules, layers, placement, saved-building rendering or a stamp editor. Schema9 omits retired settlement data and legacy town symbols while importing the remaining content of older projects. See handoff§29; earlier settlement instructions are archived history. The next actionable goal is immediate believable water spreading into newly connected low ground when a channel is cut, while sculpting stays smooth. Do not claim a simulation ships before implementing and verifying it.
