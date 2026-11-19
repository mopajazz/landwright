# Reactive water — isolated experiment

This branch is **not a complete visual feature**. The production renderer has not yet been changed, and this branch is deliberately not merged.

## Implemented
- `reactive-water.mjs` uses preallocated typed arrays and 4-neighbor breadth-first connectivity.
- Only water below the sea level and connected to a wet perimeter counts as ocean-connected. Disconnected basins remain dry.
- `initialize` snaps an existing world to its final coverage; `setTerrain` starts a deterministic wavefront after an edit.
- `advance(dt)` updates a transient 0–1 coverage buffer and never modifies elevation or saved project data.
- Added basic Node tests in `tests/reactive-water.test.mjs`.

## Unfinished integration — do not merge until addressed
1. **Water composition:** Landwright currently renders every cell below sea level immediately (in `earthen.mjs`, `app.mjs`, and the 3D mesh). To see the flood front, coverage must control the color/alpha and rendered surface, and new dry basins must show the actual underlying ground. Avoid replacing `heights` with temporary wet heights.
2. **River compatibility:** Current authored river water is independent of the sea-level flood. Preserve its behavior. Do not flood isolated river-shaped depressions solely because they are below sea level.
3. **Live editing:** `living.mjs` currently pauses motion during editing. Flood visual should be allowed to advance after a terrain edit, even while a user draws, without forcing expensive full-raster updates every frame.
4. **Refresh lifecycle:** Initialize on project create/load/undo/redo, recalculate after sculpt or sea-level changes, and clear on water disable. Resize the model for 128, 192, and 256 grids.
5. **Performance:** Prototype uses an O(N²) scan per `advance` call and an O(N²) flood recomputation per `setTerrain`. 256² may be fine for occasional commits but should be profiled on modest laptops; cache pending cells or a sparse frontier for continuous brush strokes.
6. **Visual quality:** Reveal should advance from the old shoreline with animated ripples. Blend against terrain/forest textures in 2D, and resolve height/depth discontinuities in 3D.
7. **Testing:** Run `node --test tests/reactive-water.test.mjs` and full application suite; verify in browser before marking complete. Neither was run in this connector-only environment.

## Product contract
No new tools, no new persistent project fields, no WebGPU conversion. Keep visual-only animation behind the existing Living World toggle. Reduced-motion users should see the settled result. Heightmap exports must remain bed elevations. The first user-facing acceptance case is cutting a channel between an already wet coast and a formerly isolated low basin.
