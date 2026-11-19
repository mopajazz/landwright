# Responsive water — proposed design

Status: planning only. No runtime change is authorized by this document. Baseline: Landwright v2.9.2, project schema 9, editable grids 128/192/256.

## Goal

Cut a channel from existing water into dry low ground and see a water front enter the cut within 100ms, while brush input retains its existing responsiveness. This is an acceptance target to measure, not an established performance claim.

## Scope and recommended approach

Implement a small, conservative, heightfield water model in a Web Worker. Each cell holds bed height and water depth; water moves between four neighbors according to the difference in surface height. Use available water to limit transfers. Compute transfers from one consistent input state, then apply them together. This provides spreading, pooling and drainage without fluid velocities, erosion or changing the authored bed.

Alternatives considered: an instantaneous connected flood-fill is cheaper but assumes an unlimited reservoir at one level, which can flood an entire valley to a mountain river's source level. A full shallow-water solver adds velocity, stability and rendering complexity before we need it. The recommended depth-only model costs more than flood-fill but allows finite lakes to drain and lets locally maintained river levels coexist with downhill flow.

These are proposed product decisions for review:

- Existing wet ground supplies the initial water. Imported v1–9 maps initialize depth as `max(0, sea-bed, authoredRiverLevel-bed)` once. Enclosed existing lakes remain filled initially; newly excavated isolated pits start dry.
- Ocean cells on the map perimeter exchange water with an external reservoir at sea level. An enclosed lake has finite water. River footprints replenish toward their authored local level at a bounded rate, rather than instantly refilling every cell. Initial rate:2 blocks of depth per second per source cell; calibrate visually before release. Sources use all saved routes regardless of display visibility.
- A channel shows advancing water, not an instant full-basin fill. Water cannot cross a dry ridge above the upstream water surface. A temporary downstream surge can occur; an entire valley must not instantly rise to the highest source level.
- Sculpting keeps existing water volume and changes the bed beneath it; raised wet terrain displaces water, lowered terrain invites inflow. Routing sources and ocean exchange are explicit additions/removals in the mass ledger. No erosion, rainfall, evaporation, waves with physical momentum, dam-break spectacle or new lake-authoring tool in this release.
- Use existing tools and the Water toggle. Do not add simulation settings. Preserve existing River-water visibility semantics during the prototype; resolve the final layer presentation before shipping. The recommended final UI is to rename the existing conditional River-water layer to Water and apply its visibility to all water. Keep the saved `rivers` layer key; no new toolbar tool. Hiding water never changes physical state.

## State and persistence

Water depth becomes authoritative because draining a lake changes the world. Propose schema 10, importing1–10. Save compact Float32 depth as canonical little-endian Base64 (exactly4*N*N decoded bytes). Validate length, canonical encoding, finite nonnegative values, finite bed+depth, and total volume no greater than the largest finite Float32 before replacing any active state. Reject values outside the representable Float32 range; never accept NaN/Infinity or silently clamp corrupt imports. Sources remain derived from sea, bed and routes. Solver queues, flux, render masks, timestamps and worker generation numbers are not saved.

Every terrain stroke captures one before-state including depth and all other map data. Water movement caused by that stroke belongs to that same undo action. Undo/Redo restores the saved water state and pauses the solver until the next world-changing action, so it does not immediately run away from the restored result. Opening a project shows exactly its saved water before resuming on the next edit. Download/autosave captures the latest complete simulation frame; export captures one coherent published state. Background-tab time does not produce catch-up floods.

Shift-erasing a river removes its source and the water in its authored footprint in one undoable action; spread water outside that footprint remains as water already in the landscape. Document this explicitly. Reflow remains a separate manual operation and is never called by the spreading solver.

## Responsiveness and lifecycle

- Fixed model timestep1/30 second; publish at most20 complete frames/second. First changed wet cell target:p95≤100ms after a connecting edit on 256², tested on declared reference hardware/browser.
- Worker work yields after 4ms, including during initialization and large edits. Publish only complete steps. Keep at most one pending simulation result and coalesce terrain patches to the newest bed value per cell. Send bed patches at most30Hz, with the first edit after idle sent immediately. Finish a consistent simulation step before applying queued bed changes; do not restart the solver on every pointer sample and starve it during long strokes. Never discard water mass to skip work.
- Worker messages carry project generation, edit revision and simulation sequence. Old project/Undo/source-replacement results never apply. Within one generation, accept only increasing sequences and nondecreasing acknowledged bed revisions; apply published depth against the current editor bed for rendering/picking, since input can be one coalesced batch ahead. Pointer handlers do not wait for the worker. No blocking worker-to-main queries for picking.
- Brush handlers add at most1ms p95 overhead relative to v2.9.2; water-only frame publication adds at most4ms p95 on the main thread. Measure baseline and changed build side by side. The existing CPU texture benchmark was48ms for a local256² update: do not pretend the whole editor already meets a16ms frame budget.
- Pause when settled, hidden or in a modal. Do not stop physical updates simply because Living World, reduced motion or water visibility is off. Reduced motion suppresses decorative flow animation, not terrain/water state updates.
- If Worker startup fails, run the same solver through≤1ms main-thread chunks with coalescing. If the publication budget cannot be met, reduce publication frequency, never map texture resolution. Show an honest diagnostic if water updating is suspended after an unrecoverable error.

## Rendering and shared truth

Separate static terrain/material/woodland textures from dynamic water. Do not call `refresh()` or rebuild material textures/woodland for every simulation tick. Add a dynamic water surface/mask pass shared by 2D, WebGL3D, Canvas3D and MapPNG. The model's published depth is the only authority for wetness: ground under a drained lake must become visible; forests underwater are clipped by the live mask without deleting density.

Remove unconditional `max(sea,height)` behavior from GPU geometry, Canvas rendering and `sampleTerrain`/picking in the new-water path. Build a coherent displayed surface from bed, water and eligible canopy using the same published sequence. No invisible ocean plane under a dry inland pit. Existing diagnostic views and Heightmap remain bed-only. Keep4N ground/woodland resolution during strokes. Wet soil shading can update after settlement or at a lower rate; visible water arrival must not wait for it.

## Acceptance scenes

1. Finite lake behind a one-cell barrier; cut to a lower dry basin. Front enters the cut, donor level falls, receiver fills; total volume is conserved in a closed scene.
2. Mountain river entering a low valley and ocean. Flow travels downstream without flooding the whole valley to the mountain source head.
3. Equally low isolated pit. It stays dry until a wet connection opens. Diagonal-only contact does not connect; a real four-neighbor cut does.
4. Raise a wet channel into a dam, then reopen it. Water redistributes without losing volume or modifying bed/paint/forest/routes itself.
5. Undo/Redo during a long stroke, import a differently sized map, hide water, switch2D/3D, and reload a saved partly drained lake. No stale result, texture blur, geometry mismatch or history surprise.

Ship only after the reference256² latency and overhead budgets pass. If they fail, optimize/pause the next stage; do not disguise the issue by reducing texture quality. Storytelling and decorative assets stay deferred.
