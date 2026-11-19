# Responsive Water Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This document is a proposal, not an instruction to start implementation.

**Goal:** Water visibly enters newly connected low ground within 100ms without adding perceptible brush-input lag.

**Architecture:** A conservative depth-only grid solver runs in a worker, with bounded work and versioned results. An independent water rendering pass consumes coherent snapshots without regenerating terrain textures. Water depth persists and participates in Undo.

**Tech Stack:** Existing static ES modules, Canvas2D/WebGL, browser Worker, transferable ArrayBuffers, Node test runner/jsdom. No runtime dependency, server or SharedArrayBuffer requirement.

**Spec:** [Responsive water proposed design](../specs/2026-11-19-responsive-water-design.md).

## Global Constraints

- Editable grids 128/192/256; nine tools; no new simulation controls, erosion or settlement features.
- Preserve 4N ground/woodland texture resolution throughout held strokes; Heightmap and diagnostics remain bed-only.
- Propose project schema 10/imports 1–10; require a review of the persistence and layer decisions in the spec before implementation.
- Fixed timestep1/30 second; worker yields after 4ms; publish≤20Hz; main fallback chunks≤1ms.
- Acceptance targets: first new wet cell p95≤100ms at 256²; added input-handler overhead p95≤1ms; water-only publication overhead p95≤4ms. These are release gates, not promises already demonstrated.
- Preserve low Raise/Lower Strength defaults and tutorial guidance; no implicit Reflow or terrain mutation.

## Review Focus

- A mountain river with varying authored levels must not become a valley-wide source-head bathtub — Task 1 river/outlet fixture.
- A saved inland lake must retain finite water and remain identical across load/Undo — Tasks1 and3 volume/persistence tests.
- An old worker response must not flood a newly loaded or undone map — Task 2 generation/revision race tests.
- Dry ground below sea must agree in2D, GPU, Canvas, picking and export — Task 4 parity fixtures.
- Long edits/global changes must not queue unbounded simulation work or blur textures — Tasks2 and5 stress/latency gates.

## File responsibilities

Create `water.mjs` for pure solver/state initialization and source exchange; `water-worker.mjs` for worker scheduling; `water-controller.mjs` for message lifecycle and generation guards; `water-codec.mjs` for compact depth persistence; `water-renderer.mjs` for dynamic water buffers/masks. Modify `app.mjs` for integration, `editor.mjs` for schema validation, `terrain3d.mjs`/`gpu-terrain.mjs` for surface parity, `living.mjs`/`earthen.mjs`/`forests.mjs` to consume the shared wet mask. Keep the existing `routes.mjs` carving/reflow API intact.

### Task 1: Prove the model before changing the editor

**Files:** Create `water.mjs`, `tests/water.test.mjs`.

**Interfaces:**
- `createWaterState({n, bed:Float32Array, depth?:Float32Array, sea, riverLevels:Float32Array}) -> WaterState`.
- `beginWaterStep(state,dt=1/30) -> StepJob`; `advanceWaterStep(job,{budgetMs,now}) -> {done:boolean}`. Input state stays unchanged until the complete step commits.
- `applyWaterBedPatch(state,indices:Uint32Array,values:Float32Array) -> void`; conserve existing depth/volume when bed changes.
- `snapshotWater(state) -> {depth:Float32Array, levels:Float32Array, volume:number, externalIn:number, externalOut:number}`; return owned copies. Surface level is bed+depth; depth≤0.01 is visually dry but retained for mass accounting.

- [ ] Write closed-lake transfer tests: after 600 steps a newly cut lower basin has water, donor lake loses volume, relative volume error≤0.0001; isolated and diagonal-only basins remain dry. Assert every bed/paint/forest/route input is unchanged.
- [ ] Run `node --test tests/water.test.mjs`; confirm missing-interface failures.
- [ ] Implement simultaneous four-neighbor flux from surface-height differences; initially use transfer `2*dt*positiveHeadDifference` and proportionally limit all outgoing transfers to the donor's available volume. Apply transfers together. Ocean exchange and capped river replenishment have separate mass counters. A yielding step never publishes partially applied flux.
- [ ] Add ridge/dam, boundary ocean, shallow film, uphill barrier and varying-river-level/downstream-outlet fixtures. Assert no NaN/negative depths, valid external mass balance and no instantaneous mountain-head flooding. Split any large per-step stage to obey the work budget. Queue edits arriving during a step, finish that step consistently, then apply the coalesced latest bed before the next step; continuous pointer input must not starve progress.
- [ ] Run tests; profile128/192/256 bounded chunks. Calibrate source rate/flow coefficient only against the stated fixtures and record changes in the spec.
- [ ] Commit `feat: add bounded conservative water model`.

**Gate:** Present actual lake and river fixture results. If the depth-only model cannot pass the river/latency scenes, revise this design before integrating UI or save format.

### Task 2: Keep simulation off the input path

**Files:** Create `water-worker.mjs`, `water-controller.mjs`, `tests/water-controller.test.mjs`.

**Interfaces:**
- `createWaterController({workerFactory,onFrame,onError,now}) -> {reset,edit,pause,resume,checkpoint,dispose}`.
- `reset({generation,n,bed,depth,sea,riverLevels})`; `edit({generation,revision,indices,bed,sea?,riverLevels?})`.
- `onFrame({generation,revision,sequence,depth:ArrayBuffer,levels:ArrayBuffer,settled:boolean})` publishes a complete owned frame. Never transfer live authoritative editor arrays.
- `checkpoint()` returns the latest coherent published depth synchronously; `pause()` cancels unpublished work; `resume()` starts from that checkpoint. `dispose()` terminates and invalidates callbacks.

- [ ] Write fake-scheduler tests for 10,000 rapid bed patches, reset128→256, Undo generation changes, out-of-order messages and Worker startup failure. Assert≤1 pending result, latest bed value per cell, no stale publication and no synchronous solver call from `edit()`.
- [ ] Run the tests and observe failure.
- [ ] Implement4ms worker slices with event-loop yields,≤20Hz complete publications and revision guards; flush bed patches≤30Hz (first after idle immediately), and implement the same pure-model fallback in≤1ms chunks. Bed revisions apply at complete-step boundaries; only project/Undo/source resets cancel in-flight work and increment generation. Accept increasing sequences/nondecreasing acknowledged revisions, not only exact equality with unsent pointer edits. Compose published depth with the latest editor bed so current geometry/picking agree. Source replacement, including river erasing, resets from a coherent edited checkpoint to prevent deleted water returning.
- [ ] Test settled/hidden/modal pause, resume with no catch-up storm, disposal and typed-array ownership. Use an injected clock to prove bounded scheduling deterministically; real timings are a separate Task 5 gate.
- [ ] Run `node --test tests/water.test.mjs tests/water-controller.test.mjs` and commit `feat: schedule water updates outside brush input`.

### Task 3: Persist water and make history honest

**Files:** Create `water-codec.mjs`, `tests/water-codec.test.mjs`; modify `editor.mjs`, `app.mjs`, `tests/editor.test.mjs`, `tests/interactions.test.mjs`.

**Interfaces:** `encodeWaterDepth(depth:Float32Array) -> string`; `decodeWaterDepth(value:string,n:number) -> Float32Array`. Schema10 field: `waterDepth`. Normalization preserves this encoded field; application state owns the decoded array. Existing source `routes` records stay unchanged.

- [ ] Write migration tests for schemas1–9 using existing sea/river water once, schema 10 exact Float32 roundtrip, malformed/oversized Base64, negative/NaN/Infinity/Float32-overflow values and a total volume exceeding finite Float32 range. Assert atomic failure. Check exactly4*N*N decoded bytes and canonical encoding; bump total project file limit only if full256² project evidence requires it.
- [ ] Observe failing tests; implement codec/normalization and one-time old-map initialization. A new isolated excavation never reinitializes depth from sea level.
- [ ] Add gesture tests: capture water checkpoint before sculpt, apply bed patches without extra history records, one Undo restores the whole pre-stroke world, Redo restores its coherent captured result, both stay paused until the next world-changing action. A stale worker frame after Undo/import is rejected.
- [ ] Integrate route commit, explicit Reflow, Shift river erase, sea changes, new world, download/autosave and failed import. Keep geometry/canonical maps atomic; background water steps never create individual Undo entries. Export/download uses the last complete frame without an async wait in input handlers.
- [ ] Run editor/interaction/controller tests and commit `feat: save and restore coherent water state`.

### Task 4: Render one water truth without rebuilding the map

**Files:** Create `water-renderer.mjs`, `tests/water-renderer.test.mjs`; modify `app.mjs`, `terrain3d.mjs`, `gpu-terrain.mjs`, `living.mjs`, `earthen.mjs`, `forests.mjs`; extend corresponding tests.

**Interfaces:** `buildWaterFrame({n,bed,depth,sequence}) -> {sequence,levels,wetMask,rgba,changedBounds}`; `composeVisibleSurface({bed,waterFrame,canopy,waterVisible}) -> Float32Array`. `rgba` is an N² dynamic surface image; derive alpha from depth, independent of static4N material/forest rasters. A dry cell has transparent water and its bed surface. Reuse these fields in every consumer.

- [ ] Write the same below-sea dry-pit, filled inland basin and partly drained lake fixtures for 2D, Canvas3D, WebGL vertex inputs, picking, Forest clipping, Living World wetness and MapPNG. Assert Heightmap stays unchanged and all consumers use the same sequence.
- [ ] Observe failures; remove hardcoded global sea planes from the new-water rendering/picking path. Keep static bed material textures available under drained water. Render water as a separate surface/overlay, including depth tint and shoreline alpha; avoid independently interpolating contradictory wet masks.
- [ ] Clip woodland with the live water mask without deleting density or rebuilding all crowns at20Hz. Refresh material wetness after settlement or at a slower measured rate; never delay the visible front for soil rendering.
- [ ] Implement water-only update paths for GPU buffers and Canvas overlay; do not invoke the existing full `refresh()`/`buildWoodland`/`renderEarthen` chain for each water result. Preserve existing terrain mesh/texture caches when only water moves. Use complete published surface data for picking.
- [ ] Apply the reviewed visibility decision. Water hiding reveals the bed but leaves the model intact. Living World off/reduced motion changes decorative animation only.
- [ ] Run renderer, forest, material, terrain3D, Living World and interaction tests. Browser-check 2D/Canvas/GPU where available; record unavailable paths honestly. Commit `feat: display dynamic water without terrain texture rebuilds`.

### Task 5: Acceptance, documentation and release gate

**Files:** Create `tests/water-performance.mjs` and deterministic acceptance fixtures under `docs/examples/water/`; update `docs/tutorial.md`, `docs/kb/living-world.md`, `docs/kb/projects.md`, `docs/terrain-roadmap.md`, `README.md`, `handoff.md`, portable skill/reference and handoff zip.

- [ ] Add performance instrumentation for edit timestamp, first newly wet visible cell, input-handler cost, main-thread publication cost, queue sizes and long tasks. Measure at least200 connecting cuts per size, including long rapid strokes and full-map sea changes; report p50/p95/max with hardware/browser, baseline commit and seed.
- [ ] Run all five acceptance scenes in the spec at128/192/256. Include hidden water, locked layers, reduced motion, hidden tab, worker fallback, project reload and Undo during pending work. Capture real before/held/after screenshots and a short channel-opening recording; no concept artwork as evidence.
- [ ] Enforce p95 first response≤100ms, input overhead≤1ms and water-only main-thread work≤4ms on the declared reference setup. Fail the release gate if budgets are missed; optimize or reduce water publication cadence, never lower terrain/woodland resolution. Report Canvas/GPU differences separately.
- [ ] Run `npm test`, `node --check` on changed modules and `git diff --check`. Compare Heightmap pixels to saved bed; verify MapPNG and a schema 10 partly drained lake project reload.
- [ ] Document finite lake volume, source replenishment, display versus physical state, paused restore behavior, Shift source erasing and current limits. Preserve5–10% Raise/Lower Strength guidance and nine tools.
- [ ] Commit and deploy through existing GitHub Pages only after review of the evidence. Verify the exact-head deployment and actual live behavior before claiming release. No release number assigned by this planning document.

## Self-review

Coverage: model/volume→Task 1; budgets/races/fallback→Task 2; migration/Undo→Task 3; surface parity/sharpness→Task 4; measured response and real visual acceptance→Task 5. No runtime code is changed by this plan. The only decisions requiring product review before execution are persistence/schema 10, finite-lake behavior, restore pause semantics and the Water layer presentation described in the spec.
