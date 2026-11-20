# Sea-connected reactive water

Cut a channel below sea level between a coast and an isolated low basin. Water starts advancing while the stroke is in progress. A cell can receive ocean water through its four direct neighbors. Two low cells that only touch at a corner do not share a connection. Enclosed low ground, including an enclosed atoll center, begins dry. Authored rivers retain their own water level where it is higher than the ocean surface.

## Editing and rendering

- Terrain view advances the front with Living World and Water motion enabled. Turning off either effect, using reduced motion, or switching to Biomes settles the coast immediately. Hidden tabs pause the front. Heightmap view and the Heightmap PNG show bed elevations. Turning Water off hides ocean and river surfaces.
- New, imported, and history-restored maps derive settled water directly from the current terrain. No flood coverage, timing, or derived geometry is written to project schema 9. Map PNG exports use the settled topology, even while the editor shows a moving front.
- The raster has one RGBA sample per terrain cell. In WebGL, the dynamic ocean texture and elevation buffer update independently of the cached material texture. The 2D view draws the ocean between ground and forest. Canvas 3D composites the current ocean raster with cached textures and uses the same derived geometry.
- The model recomputes connectivity when cells cross sea level. A route that remains open keeps its scheduled arrival times through other terrain edits. Fully covered seabed skips procedural shading until water can recede from that cell. Raising ground above sea level clears that cell instantly. Cutting off a basin recedes its coverage.

## Verification

Run `npm ci` followed by `npm test`. For visual verification, use a map with ocean at one edge and a flat-bottomed interior basin behind a narrow ridge. Lower the ridge below sea level with the brush held down. Check the dry, advancing, and settled stages in Terrain view, then check Undo, Redo, reloading, Water off, reduced motion, and both PNG exports.

This branch remains a draft pending verification of sculpting frame pacing on representative hardware.

### Chromium software-rendering sample

Each row compares the draft base with this revision using one scripted Lower stroke in a 1280 × 900 viewport. The sample used headless Chromium with SwiftShader. The sculpt column is p95 time between edit renders. The water column is p95 main-thread time per animation callback that publishes coverage without rebuilding the ground raster. Values are milliseconds.

| Grid | View | Sculpt before | Sculpt after | Water callback |
| --- | --- | ---: | ---: | ---: |
| 128² | 2D | 183.4 | 133.3 | 2.1 |
| 128² | WebGL | 200.0 | 200.0 | 1.3 |
| 192² | 2D | 149.9 | 216.7 | 1.6 |
| 192² | WebGL | 216.7 | 250.0 | 1.6 |
| 256² | 2D | 183.3 | 183.3 | 5.6 |
| 256² | WebGL | 283.4 | 300.0 | 2.7 |

The 256² cached Open ocean raster had a median of 31.09 ms at the base revision and 33.91 ms with the opaque coverage mask in a separate Node benchmark. The browser timings varied by view and grid size. Hardware-accelerated frame pacing remains a release gate.

### Depth and gravity iteration

A shallow sill slows the advancing front. Travel time along each grid edge uses a bounded approximation of the shallow-water wave speed, which scales with the square root of depth. The shallower side of an edge controls the delay. Connected ocean water still settles at the configured sea level.

At low sea levels, Shift + Land targets a shallow cut below sea level without flattening the cut to zero. Start a channel at the ocean and extend it toward the basin. A cut wholly inside dry land has no ocean source.

This iteration estimates arrival times on the grid. It does not solve momentum or conserve water volume, and isolated excavations do not collect rainfall or groundwater.

### Water Dropper

Select River, then Water Dropper in the tool settings. Choose a pool depth and click low ground. The pool fills four-neighbor cells below that level, measured from the bed at the clicked point. If a below-level path reaches the map edge, try a shallower setting. Shift-click the pool to remove it. A drop leaves the bed intact and can be undone. Saved projects store the drop location and level. Terrain and Map PNG show the pool, while Heightmap stays bed-only.

### Close-zoom rendering

In Terrain view, close zoom fades in world-aligned shader detail for stone, ground and canopy. Hill shading adds nearby ridge occlusion and directional lighting. WebGL 3D also adds distance haze, strongest at lower elevations. The effect is drawn at screen resolution and leaves saved elevations, brush coordinates, water levels and image exports as authored. Heightmap and Biome diagnostics keep their original rendering. Without WebGL, the editor keeps its Canvas terrain renderer.

### Pouring water

Select River, then the droplet icon. Click anywhere on the map to add water, or hold to keep pouring. The amount slider controls each dose. Water flows between neighboring cells according to differences in surface height. It pools in hollows, spills over low rims, and drains at the map edge. Shift-click removes the water at the clicked spot. Existing saved basin drops still load. Poured water is saved with the world and leaves the terrain bed intact.
