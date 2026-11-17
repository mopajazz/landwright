# Path and River Implementation Plan

> **For agentic workers:** Execute inline with tests and a final independent review.

**Goal:** Add focused Path and River tools with curved route placement in 2D/3D, width controls, undo, saved projects, and exports.
**Architecture:** routes.mjs owns bounded curve sampling, terrain paint/channel rasterization, and a local river water field. app.mjs owns draft input and controls; existing GPU/Canvas renderers and picking consume the same derived water-surface heightfield. Existing heights remain the carved bed, and ocean sea level never changes.
**Tech Stack:** Existing dependency-free ES modules, SVG, Canvas/WebGL, Node test runner/jsdom.
**Spec:** docs/terrain-roadmap.md and user request to add Path and River.

## Constraints and review focus
- Keep Drawing and Details removed. Place River in Terrain and Path in Surface; use established icons/themes.
- Path paints dirt, stone, or sand with adjustable width and opacity, without altering elevation.
- River carves only downward, with softened banks and a monotonic source-to-mouth local water profile. No fluid simulation; uphill routes cut terrain rather than raising water globally.
- Point clicks and dragged points create a bounded smooth preview; Enter/double-click/Finish commits one undo group; Escape/tool/view changes cancel it.
- Respect hidden/locked layers, map bounds, malformed imports, route/point limits, and no-op clicks. Imported old projects remain valid.
- Water toggling, rendering/picking consistency, save/import, undo/redo, project reset, and image/heightmap exports must include appropriate route effects.

## Tasks
1. Add failing numerical tests for curve bounds, continuous path painting, channel depth and local water, invalid route payloads. Implement routes.mjs and project v4 migration/validation.
2. Add failing interaction tests for draft cancellation, atomic commits, locks, save/undo/import, 2D/3D route input. Implement draft workflow, controls, icons, state lifecycle, river erasing and derived water heightfield.
3. Wire the common derived surface into GPU/Canvas rendering and picking; verify explicit river above sea level, toggle behavior, exports, and numerical picking. Run npm test and syntax/diff checks.
4. Review changes, resolve findings, document usage/limits, publish to GitHub Pages, verify live controls and map results.

## Verification

Tasks 1–3 complete: 89 tests pass, including numerical river water/picking, project migration, 2D/3D route gestures, cancellation/undo, lock protection, and bounded import work. Independent review findings for margin gestures, middle-pan ordering, workload limits, and held-drag undo are fixed with regression coverage. Task 4: publish and visually verify live UI.
