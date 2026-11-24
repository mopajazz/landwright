---
name: landwright-development
description: Use when developing, debugging, reviewing, releasing, or documenting Landwright (repository mopajazz/landwright, formerly worldpainter-studio), including terrain brushes, 2D/3D editing, paths, rivers, water, materials, woodland, Living World atmosphere or future terrain behavior.
---

# Landwright development

Landwright is a minimalist cartographic terrain editor with complexity behind a small interface. Read the [engineering/product handoff](references/handoff.md) before implementation. In a checkout, the root `handoff.md`, source, tests and Git state supersede this portable snapshot.

- Repository: https://github.com/mopajazz/landwright
- Live app: https://mopajazz.github.io/landwright/
- Static HTML/CSS/ES modules; no build step or runtime npm dependencies; `jsdom` is test-only.

## Orient

1. Read handoff §0 (current state) and §1 (working agreement).
2. Check `git status`, the current branch, `main`, and open pull requests.
3. Run `npm ci` and `npm test`; confirm the count matches the handoff before changing code.

## Find the contract

| Work | Read first |
| --- | --- |
| Tools, shortcuts, brushes | handoff §4.2–4.3; `app.mjs`, `terrain.mjs`, `brushes.mjs` |
| Materials and forest | §4.4; `earthen.mjs`, `material-paint.mjs`, `forests.mjs`, `studies/earthen/` |
| Water (ocean, rivers, fills, pours) | §4.5; `reactive-water.mjs`, `routes.mjs`, `water-dropper.mjs` |
| Routes | §4.6; `routes.mjs`, `editor.mjs` |
| Views, layers, Walk, close zoom | §4.7; `walk.mjs`, `terrain-detail.mjs` |
| Living World and clouds | §4.8; `living.mjs` |
| Layout and UI | §4.9, §5; `index.html`, `theme.css`, `ui.mjs` |
| Rendering and performance | §6; `terrain3d.mjs`, `gpu-terrain.mjs`, `raster-cache.mjs`, `docs/terrain-resolution-512.md` |
| Saves, undo, exports | §7–8; `editor.mjs` |
| Tests and release | §9 |
| Parked and deferred topics | §12 |
| Why something was decided | `docs/release-history.md` |

## Rules that are easy to break

- Work on a branch and open a pull request; never push to `main`.
- Keep eight tools. Footprint and material choices never switch the tool. Opacity applies to Paint and Path only.
- Derived data (water coverage, canopy, textures, Living World) is never saved, never enters undo history, and stays out of the Heightmap.
- Keep rendering, cursor projection and picking on the same effective surface.
- Validate imports and route work budgets before mutating the project; never replay saved carving on load.
- Rasterize on scheduled frames, not pointer events.
- Living World tests need queued animation frames (see `tests/living-interactions.test.mjs`).
- Bump the `?v=` cache revision everywhere at once for runtime releases.
- Settlements are **parked**, not cancelled. Do not reintroduce a settlement panel, stamp tool or selection cards; discuss any return with the user first (handoff §12).

## Finish the change

- Update the relevant handoff section **in place**; put release notes and measurements in `docs/release-history.md`. Refresh `references/handoff.md` in the same PR.
- Update `docs/tutorial.md`, `docs/kb/` and README for user-visible changes. Keep the beginner lesson: **start Raise/Lower at 5–10% Strength, short strokes, inspect, increase gradually**.
- Browser-check visual changes in both themes and in 2D/3D. jsdom does not verify pixels or GPU performance.
- After merge, verify the Pages run for the exact commit and the live footer before calling it released. Link the live build and say plainly what was not verified.

## Common mistakes

- Claiming WCAG compliance from color-pair tests.
- Treating river, fill or pour water as hydrology; repeated Reflow can deepen beds.
- Assuming Holler Maps originals are accessible. Chat images and paths on the user's computer are not downloaded assets.
- Assuming inhabitants, day/night, or storytelling shipped. Storytelling waits until terrain tools are complete.
- Citing `/tmp` or other machine-local paths as evidence.
