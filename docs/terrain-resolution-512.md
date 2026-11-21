# 512 × 512 terrain experiment

Choose **Experimental · 512 × 512** under **New World → Terrain detail**. The default is still 256 × 256. The 512 grid has 262,144 editable samples and uses the same block-based brush radius, falloff, strength, stroke spacing, and layer rules. At fit zoom each block occupies less screen space. The 3D camera fits the larger grid and picking intersects the same two triangles per cell as the GPU mesh.

## Architecture and changes

- [Project validation](../editor.mjs) accepts the four selectable sizes. Schema 9 retains its existing fields and older files without a size still default to 256. The material coverage codec accepts 512 and heightmap export follows the grid size. The JSON import ceiling is 32 MB to accommodate larger files. Image import keeps its 12 MB limit. Browser autosave uses the existing local storage path. The measured 512 island saved at about 4.86 MB before material painting. A single nonzero material weight adds about 2.80 MB of base64 coverage data, so painted worlds can exceed the browser quota. The existing save badge reports this, and the editable JSON download remains available.
- [Rendering](../app.mjs) keeps four raster pixels per terrain block for ground and canopy in terrain view, with 2048 × 2048 rasters at 512. Diagnostic ground views remain one pixel per block. Ground and canopy retain their canvas pixel buffers and write only the changed rectangle. The rectangle is computed from derived fields, so it can include terrain outside the brush footprint when shading or water changes. Empty rectangles skip canvas writes.
- [WebGL](../gpu-terrain.mjs) keeps a single indexed regular mesh. At 512 it draws 522,242 triangles with 32-bit indices through `OES_element_index_uint`. Smaller grids keep 16-bit indices. The existing Canvas renderer handles unsupported contexts. The color texture receives a rectangular upload for local updates at matching raster sizes. Layout changes and scaled composites use a full upload. Elevation, detail, decals and ocean reuse allocated GPU storage, but updates to those resources still cover the full buffer or texture.

## Browser profile

Chrome 157 headless on Apple M5 with ANGLE Metal, 1440 × 900 CSS viewport, DPR 1, and the default Island seed 42 and Living World settings. Three fresh-tab runs per size. Each run used 60 consecutive animation-frame intervals after warm-up for each workload. With the default Raise brush held, pointer coordinates followed a 25 × 13 CSS-pixel sinusoidal path about the map center in 2D or the projected world center in 3D. Orbit used a right drag along the same path. The timings are requestAnimationFrame intervals and JS wall time. They do not measure hardware presentation or GPU execution.

| Workload | 256 median / p95 frame interval | 512 median / p95 frame interval | 512 intervals over 20 ms |
| --- | ---: | ---: | ---: |
| 2D Raise | 16.7 / 16.7 ms | 33.3–33.4 / 50.0 ms | 60 of 60 per run |
| 3D orbit | 16.7 / 16.7–16.8 ms | 16.7 / 16.8 ms | 1 of 60 per run |
| 3D Raise | 16.7 / 16.7 ms | 33.3–33.4 / 50.0 ms | 60 of 60 per run |

The initial 512 implementation's 2D Raise run had a 41.9 ms p95 raster flush and a 50.1 ms p95 frame interval. The final raster flush ranged from 35.9 to 37.3 ms at p95 across three runs, while the frame interval still reached 50 ms. The final version also removed an initial ground raster cap that had limited the 512 grid to two pixels per block, so this is an end-to-end comparison rather than an isolated timing for rectangle writes.

For 512 3D Raise, typical color uploads were 144 KiB at the median and 279 KiB at p95, versus 16 MiB for a full 2048-square RGBA upload. This is a 99.1% reduction at the median and a 98.3% reduction at p95 in color upload payload. A dirty 512 frame still spent roughly 35 ms in the raster flush before 3D submission. Ocean work was about 1 ms on this fixture. Camera-only frames had near-zero raster flush time. A separate WebGL readback after a 512 Raise stroke matched a fresh full upload across all 16,777,216 color bytes.

After forced GC, Chrome DevTools reported these page-heap and backing-storage measurements. Backing storage includes more than the terrain arrays. It excludes a complete accounting of native canvas, compositor and GPU memory.

| After workload | 256 used JS heap / backing storage | 512 used JS heap / backing storage |
| --- | ---: | ---: |
| Generated world in 2D | 3.85–10.31 / 21.64 MiB | 3.84–10.31 / 85.20 MiB |
| 2D stroke, orbit, and 3D stroke | 9.83–16.49 / 22.15 MiB | 22.74–29.20 / 87.21 MiB |

The position, index and elevation buffers represent about 3.0 MiB of GPU payload at 256 and 15.0 MiB at 512. The primary GPU color texture represents another 4 or 16 MiB. Those are payload calculations, separate from the DevTools readings. Full project snapshots in undo history, first-use woodland pattern generation, and canvas allocation can raise memory further. The fixture did not exercise large forests, active poured water, mobile GPUs, or Canvas fallback performance.

## Recommendation

Keep 512 experimental. Local writes and uploads reduce data movement, but brush edits still rebuild base colors, terrain material fields, woodland eligibility, and other derived state across the grid. Ocean connectivity scans the full submerged mask and reruns the flood fill when that mask changes. The raster cache also compares whole-grid fields before choosing a rectangle. Prioritize measuring and limiting those CPU passes, starting with brush-local color, shading and material work. Shoreline connectivity and other nonlocal changes need their own invalidation rules.

Defer tiled geometry. The measured GPU handled full-mesh orbit at about 60 Hz, while both 2D and 3D sculpting missed frame budgets. Revisit fixed-resolution tiles if clean orbit misses its target on representative devices, or if profiling shows that local elevation uploads need region-level updates. Adaptive terrain would add level transitions, picking and brush-consistency work without addressing the measured CPU bottleneck.
