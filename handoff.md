# Landwright — engineering and product handoff

**Documentation date:** November 26, 2026 (America/New_York)<br>
**Displayed release:** `v2.13` · **Cache revision:** `2.13.0` · **Project schema written:** `9`<br>
**Repository:** https://github.com/mopajazz/landwright · **Live app:** https://mopajazz.github.io/landwright/

This document describes **the app as it is now**. It is edited in place whenever behavior changes; it is not appended to. Release-by-release engineering notes (why decisions were made, measurements, rejected directions) live in [docs/release-history.md](docs/release-history.md). Source and tests are authoritative where this document and the code disagree; fix the document when that happens.

## 0. Start here

| Contract | Current state |
| --- | --- |
| Release | **v2.13**: the **Worlds library**, a full-screen screen that holds every world in the browser (open, rename, duplicate, download artwork or a backup file, delete with 30-day recovery, New world, Import). Download and Export map left the header. On top of v2.12 (River: one Carve depth setting, creeks, droplet). |
| Live deployment | Last verified live on November 23, 2026: v2.11.1 (`e78fd9e`, Pages run 45094010821); v2.11.2 and v2.12 were merged after that by PRs #14 and #15. After merging v2.13, confirm the Pages run for the exact merge commit and the live footer. |
| Runtime | Static HTML/CSS/ES modules served by GitHub Pages from `main:/`. No build step, backend, accounts or runtime packages. |
| Project format | Writes **9**, imports **1–9**. Saved: terrain, paint, material coverage, forest density, routes, basin fills, poured water, legacy drawings/landmarks, layer flags. |
| Toolbar | **Nine** tools: Raise, Lower, Smooth, Flatten, River, Land, Path, Paint, Pan. |
| Erasing | **Shift + Paint** with Paint's *Shift erase target*. There is no Erase tool. |
| D / E keys | Strength for Raise/Lower/Smooth (1% steps up to 10%, then 5%), River Carve per stroke (0.25), Paint/Path Opacity (5%), Flatten target (1). Shift = four steps (Flatten: 10). Pan ignores them. |
| Navigation | Space + left-drag or middle-drag pans (2D/3D). Right/Alt-drag orbits in 3D. **Walk** gives an eye-level WebGL view with Space/Shift to fly up/down. |
| Terrain sizes | 128², 192², 256² (default), and **experimental 512²**. |
| Height | Hard limits 0–255. Each world has a working range, *Seabed floor* (default 20) to *Highest peak* (default 190), that Raise, Lower and Flatten never pass. 3D draws every size with the same proportions. |
| Water | Sea-connected reactive ocean; **River strokes** that carve a channel and leave a still-water **creek** (a river route record), plus a little running water from a short-lived spring; the **droplet** for deliberate extra water; basin fill/drain; and rivers from older maps (fixed levels, Reflow). |
| Look | Eight earthen ground materials with terrain-responsive texture; terrain-integrated woodland; close-zoom surface detail; Living World motion and cumulus clouds. |
| Worlds | Every world is stored in the browser's IndexedDB (§8). The app reopens the last world; **Worlds** (header, Ctrl/Cmd+O) is the only way to create, switch, import, copy, delete or download. |
| Exports | From each world's menu in Worlds: Map PNG 1024² / 2048² (default) / 4096², Heightmap PNG at N² with bed elevations only, and the editable project JSON ("backup file"). Works for closed worlds too. |
| Tests | `npm test`: **220 passed, 0 failed** (November 26, 2026). |
| Settlements | **Parked.** Removed in v2.9; the user may want them back in a different form (§12). |

**Preserve:** the header has no Download or Export button; the user removed them in favour of the Worlds library. Beginner guidance must prominently say to start Raise/Lower at **5–10% Strength**, use short strokes, inspect, and increase gradually. Keep nine tools. Never save derived water, canopy or texture geometry into bed heights or project files.

## 1. Working agreement

Several agents and people change this repository. These rules exist because earlier work drifted when they were not followed.

- **Roles.** The user decides product direction. ChatGPT/Codex handles art direction and, task by task, implementation. Claude handles UI/app review and, when asked, implementation. Whoever is assigned a task owns those files until it merges.
- **Branches and pull requests.** Every change goes through a branch and a PR; do not push to `main` directly. A PR description says what changed, how it was verified, and what was not verified (real GPU, touch, etc.).
- **This document.** The agent that changes behavior updates the relevant section here in the same PR, by editing it. Add release notes, measurements and rationale to `docs/release-history.md` instead of new sections here. Keep the skill snapshot (§10) in sync.
- **No CI yet.** There is no `.github/workflows`. Run `npm test` before every PR. Adding a test workflow is an open item (§11).
- **Evidence.** Never cite machine-local paths (`/tmp/...`, `/workspace/...`) as evidence; others cannot open them. Cite commits, Pages run IDs, test counts, or files committed to the repository.

## 2. Identity and hosting

| Item | Value |
| --- | --- |
| Product name | **Landwright** |
| Repository | https://github.com/mopajazz/landwright (formerly `worldpainter-studio`; GitHub redirects the old repository and git URLs) |
| Live application | https://mopajazz.github.io/landwright/ (the old `/worldpainter-studio/` Pages path returns 404) |
| Branch | `main` |
| Entry point | `index.html` |
| Hosting | GitHub Pages, branch `main`, directory `/`, legacy build type |

The user chose GitHub Pages because their workplace firewall blocked an earlier host. Keep deploying there unless the user says otherwise. Browser autosaves are keyed to the `mopajazz.github.io` origin, so they survived the repository rename.

Landwright is independently implemented. WorldPainter, WorldBox and Inkarnate inform concepts and interaction preferences; this is not their web edition, contains none of their code, and does not read or write their file formats.

## 3. Product direction and decisions to preserve

The goal is a **minimalist cartographic terrain builder with complexity behind a small interface**. Terrain behavior comes before decoration. Avoid turning the toolbar into a general illustration application or simulation dashboard.

Decisions in force:

- Nine tools. Brush footprint and material are separate choices and never switch the tool.
- The palette, Opacity and Sculpt controls are contextual: each appears only for tools that use it.
- Opacity is a paint concept. It applies to Paint and Path. Sculpt tools and Land ignore it.
- Sculpting is dialed in by a percentage **Strength**, a per-world **height range** and a loose **needle guard**, with 3D drawn at size-independent proportions, so what looks good in 2D also looks good in 3D and Walk. (v2.10 replaced Strength with a "height per stroke" budget and a 50° slope limit; the user found that confusing and overcorrected, so v2.11.1 restored Strength and loosened the guard.)
- Erasing is Shift + Paint; the standalone Erase tool was removed.
- Coastline is a footprint; **Land** is the explicit add/remove-land tool.
- The terrain *decides*: woodland grows only where terrain allows, ground texture responds to slope, wetness and light, and ocean water follows connectivity. This "paint intent, terrain decides" model is what the user likes most, especially the woodland.
- Each project is a single world. Do not add "Overworld" or other world-hierarchy labels.
- Path and River are **freehand brushes** (v2.11). No points, no draft bar, no Finish: "we can be trusted to draw roads on our own". River is a god-sim wand with **one setting, Carve depth**; the brush size is the width and **the river goes where the hand draws it** (no meander). A stroke leaves a readable creek and only a little water; **more water is a deliberate act with the droplet**; Shift + River dries a stretch to try again. Inspired by the WorldBox approach of laying out a shallow channel, inspecting it, then adding water. Carving and erosion happen only while drawing.
- Living World effects are optional visual atmosphere, behind one World Settings toggle.
- Maintain the tutorial and knowledge base with every user-visible change.

Do not restore: Drawing, Details, Forest Scatter, generated tree stamps, the settlement right-panel editor, settlement selection cards, the old preview thumbnail, or preset-driven tool switching. Legacy modules and historical tests are not a reason to restore them.

## 4. Feature inventory

### 4.1 New world

The **New world** tile in Worlds opens a modal over the library: world name (required, up to 80 characters, default `Untitled world`), six starting shapes with thumbnails, terrain detail, a large live preview at the exact chosen grid, collapsed *Generation settings* (seed, relief), Cancel/X/Escape and native Enter/Create. Previews never modify the current map. Create adds a **separate** world beside the others and opens it with an empty undo history; the previous world is saved first and is not changed.

| ID | Label | Behavior |
| --- | --- | --- |
| `island` | Island | Organic island using radial/coast masks and seeded noise |
| `archipelago` | Archipelago | Multiple separated islands |
| `continent` | Continent | Broader land mass |
| `atoll` | Atoll | Ring around a center that starts dry until connected |
| `blank` | Open ocean | Uniform height 30 |
| `flat` | Flat grass | Uniform height 80; unaffected by seed/relief |

| Terrain detail | N | Cells |
| --- | ---: | ---: |
| Quick sketch · Small | 128 | 16,384 |
| Standard · Medium | 192 | 36,864 |
| Detailed · Large (default) | 256 | 65,536 |
| Experimental | 512 | 262,144 |

- Seed: default 42, bounds ±999,999,999; reroll picks an integer below 1,000,000.
- Relief: 40–140 (÷100 for the generator), default 100. Gentle below 70, Dramatic above 115, Natural otherwise.
- Non-flat, non-ocean generation clamps heights to 10–250; relief scales land above sea level 62. New worlds (and their previews) are then fitted into the default height range with `fitHeightRange`: only the band within 24 units of a limit is compressed, and only if the terrain actually passes it, so shapes keep their order.
- Creating a world makes one undo snapshot and clears paint, material coverage, forest density, routes, basin fills, poured water and legacy content. It restores default layers, sea level 62, the default height range 20–190, Water and Hill shading on, and recenters both cameras.
- 512 is experimental: sculpting misses frame budgets on measured hardware and painted 512 worlds can exceed the browser storage quota. See [docs/terrain-resolution-512.md](docs/terrain-resolution-512.md).

### 4.2 Toolbar and shortcuts

| Group | Tool | ID | Key | Effect |
| --- | --- | --- | --- | --- |
| Terrain | Raise | `raise` | R | Increase elevation locally |
| Terrain | Lower | `lower` | L | Decrease elevation locally |
| Terrain | Smooth | `smooth` | Q | Move toward a local 5×5 mean |
| Terrain | Flatten | `flatten` | F | Converge toward a target height |
| Terrain | River | `river` | V | River wand: carve, release water and erode while drawing; also pour water and fill/drain basins (§4.5) |
| Terrain | Land | `land` | C, M | Add land; Shift removes land |
| Surface | Path | `path` | J | Brush that paints a track in the path surface and clears trees (§4.6) |
| Surface | Paint | `paint` | P, B | Paint ground material or forest density; Shift erases |
| Navigate | Pan | `pan` | H | Pan the map/camera |

| Input | Behavior |
| --- | --- |
| W / S, Shift ×10 | Brush diameter ±1 (±10); route width for Path/River |
| Shift + wheel | Brush or route width ±1 |
| Wheel | Zoom |
| D / E (Shift ×4; Flatten ×10) | Strength ±1% up to 10%, then ±5% (Raise/Lower/Smooth), Carve per stroke ±0.25 (River), Opacity ±5% (Paint/Path), target ±1 (Flatten). Implemented by `nudgeSlider`, which steps the slider, clamps it and fires its input handler |
| Left drag | Apply the brush, or add route points while a route is active |
| Space + left drag, middle drag | Pan (2D/3D), including during a route draft; a started pan stays a pan until release. In Walk, Space flies up and Shift descends |
| Right drag, Alt + drag (3D) | Orbit/tilt |
| Shift + tool | Raise↔Lower reverse; Land removes; Paint erases the chosen target |
| Enter / double-click | Finish a route draft |
| Escape | Cancel a route draft or stop the current gesture; exits Walk |
| Ctrl/Cmd + Z, + Shift + Z | Undo/redo; a route draft is cancelled first without consuming history |
| Ctrl/Cmd + S | Save the open world now (it also autosaves) |
| Ctrl/Cmd + O | Open or close Worlds |

Shortcuts are ignored while typing in inputs, selects, textareas or contenteditable elements, and while a dialog is open. Ctrl/Meta/Alt combinations do not trigger D/E.

### 4.3 Brushes and sculpting

| Control | Bounds | Default | Shown for |
| --- | --- | --- | --- |
| Size | 4–120 blocks | 42 | Brush tools |
| Opacity | 0–100% | 100% | Paint, Path |
| Strength | 1–100% | Raise/Lower 8%; Smooth/Flatten 35% (two groups remembered separately) | Sculpt tools |
| Flatten target | Seabed floor – Highest peak | 120 | Flatten |
| Preserve map edges | Boolean | On | Flatten |

Footprints: **Soft Round** `(1 − d²)²`; **Hard Round** full coverage inside the circle; **Coastline** irregular angular edge with a sharper feather; **Grain** soft weight modulated by stable cell noise. Footprints shape coverage only; material texture is separate.

- Elevation is clamped to 0–255. Smooth samples a pre-dab copy. Flatten converges toward the target, which is kept inside the height range.
- **Raise/Lower (`strengthStroke` in `terrain.mjs`).** Each dab adds `strength/100 × 3 × footprint weight` (the pre-v2.10 formula), so repeated passes keep building. Measured with a size-24 brush on the default island: about 1.7 blocks per pass at 8%. With the halved 3D scale this looks about half as tall as the same strokes did before v2.10.
- **Height range.** Within 14 units of the ceiling (Raise) or floor (Lower) the step is eased (minimum 8% speed) and the result is clamped to the limit. Terrain already outside the range is not pulled in by Raise or Lower.
- **Needle guard.** After each dab, cells this stroke changed are pulled back (never past their pre-stroke height) wherever they are steeper than `spikeSlope(n) = 2.5 / verticalScale(n)` units per cell against a 4-neighbor, about 68° in 3D. Ordinary strokes never reach it (tested: identical results with and without it at 8%); it only stops 100% Strength on a tiny brush from making a spike. Pre-existing cliffs are untouched.
- `heightStroke` (per-stroke budget) and the stricter `maxSlope` (~50°) remain in `terrain.mjs` for the river wand's carving, which needs a bounded cut per stroke.
- Preserve map edges holds the outer row/column and feathers over four cells, which prevents the 3D outline from appearing to shrink. It belongs to Flatten only.
- Land converges toward sea +22 (Shift: sea −18), only on the appropriate side of its target, and never applies paint.
- Opacity on sculpt tools was once a hidden second strength multiplier; Opacity 0 left over from painting silently disabled sculpting. It is now scoped to Paint and Path (regression-tested).

### 4.4 Paint: ground materials and forest

Paint shows a grouped palette of eight ground materials plus a separate **Forest** density action.

| ID | Material | Family | Swatch |
| --- | --- | --- | --- |
| 1 | Grass | Living ground | `#697d48` |
| 6 | Loam | Soils | `#7e5e41` |
| 7 | Clay | Soils | `#a27155` |
| 3 | Bedrock | Stone | `#898c82` |
| 8 | Scree | Stone | `#918979` |
| 9 | Mud | Wet ground | `#645841` |
| 2 | Sand | Dry & cold | `#c2ae7d` |
| 5 | Snow | Dry & cold | `#dde2d9` |
| 4 | Forest | — | density, not a ground color |

- **Ground texture** is procedural (`earthen.mjs`) and responds to slope, curvature/shelter, light and proximity to sea and river water. It is visual, not erosion or sediment transport. Diagnostic views bypass it.
- **Coverage** is stored per cell as eight bytes, one per ground material (`material-paint.mjs`), alongside legacy blended RGB/alpha. Within one held stroke, coverage is capped against the pre-stroke state so repeated samples do not compound opacity; separate strokes build up.
- **Forest** paints a density field 0–1. Woodland (`forests.mjs`) is a continuous procedural canopy that grows only on eligible terrain: above sea +2, adjacent height difference ≤ 6, not under water, not on committed paths. Density is kept where trees cannot grow and reappears if the terrain changes. Canopy adds under 3 blocks of derived visual relief, never saved.
- **Shift erase target** lists only targets that exist: Surface paint, Forests, River water, and legacy landmarks/drawings. Choosing a ground material resets the target to Surface; choosing Forest selects Forests. Surface/Forest erasing honors Opacity; whole-object targets ignore it.
- Path surfaces: Loam (default), Bedrock, Sand.

### 4.5 Water

Four kinds of water coexist. Hiding or disabling Water shows the bed; the Heightmap view and PNG always show bed elevations only.

1. **Ocean (`reactive-water.mjs`).** Cells below sea level are wet only if a four-neighbor path below sea level reaches the map edge; enclosed basins start dry. When a cut connects a basin, water advances while you sculpt, with depth-sensitive speed (a shallow sill slows it). The front animates only in Terrain view with Living World and Water motion on; otherwise it settles immediately. Coverage is derived, never saved. Shift + Land makes a shallow below-sea cut. This estimates arrival times on a grid; it does not conserve volume or simulate momentum.
2. **River wand** (River, default mode; `river-wand.mjs`). A brush with **one setting, *Carve depth*** (0.25–4 blocks, default 1.5, D/E ±0.25); width is the brush size, and the river follows the drawn stroke exactly (the v2.11 Meander and Water sliders were removed in v2.12). Each dab lowers the bed under the brush with the same per-stroke budget as Lower (respecting the floor and slope limit) and adds a fixed `STROKE_WATER` (15) at the center. **Grading** (`gradeChannel`): whenever the dab center moves at least one cell, the bed there is held 0.08 below the previous center (feathered over 0.55r), cutting through rises by at most max(6, 4 × carve) below the pre-stroke ground; holding still does not grade. While the stroke is held, every simulation tick feeds a little water along the trail (`feedTrail`), and `erodeStep` lets water moving downhill (surface drop > 0.04) cut its bed by up to 0.05 per step in proportion to depth × drop, carrying material to the lowest neighbor; sediment settles where the flow slows, at dead ends, and in the sea up to 0.2 below sea level (deltas). On release, remaining sediment settles (`settleSediment`, same sea rule), and:
   - **Creek** (`creekRoute`, v2.12): the trail becomes a river route record whose water sits `CREEK_FILL` (0.35) above the carved bed and never rises downstream; width = 60% of the brush diameter (2–32), depth = Carve depth. Where the bed rises above the water arriving from upstream (a scour or settled sediment), the channel center is trimmed to just under it, feathered across the creek width, by at most 6 blocks, so the creek is continuous; a stretch over a taller ridge stays dry. Static water shows the course and (with Living World) its direction, and cannot spread, so one pass never floods. Project route limits apply; past them the channel is carved and a notice says no more creek water can be added. Creeks are ordinary river records: the River water layer, Reflow and Paint's Shift erase target all apply.
   - **Short-lived spring** (PR #14, v2.11.2): the first trail cell becomes `{cell, rate, remaining}` with rate = `STROKE_WATER` and a total supply of rate/50; it feeds `rate/100 × 0.025` per tick until spent and is then removed. The remaining supply is saved, so reopening a project cannot refill a spent spring. Max 64.
   - **Shift + drag** dries a stretch (`dryArea`): removes springs and standing water under the brush and any creek records it touches (`routeTouches`); the channel stays.
   - **Drain floodwater** (PR #14) clears all springs and poured water in one undoable action.
   - `drainToSea` removes water over open sea (ocean coverage) and the map edge drains too. No erosion happens outside a held stroke. One stroke is one undo step (bed, water, spring and creek).
   - Because a spring keeps the simulation moving, the terrain is re-rendered only for visible water changes (more than 24 cells changing wet/dry or by more than 0.15), otherwise at most every 1.5 s. Measured: an idle map with a spring holds 60 fps (median and p95 16.7 ms); without this throttle p95 was ~83 ms.
   - **Rivers from older maps** (route records drawn with the pre-v2.11 point tool) still load and draw: a sampled non-rising profile `level = max(0, min(previousLevel, ground − 0.5))`, carved channel, local water. **Reflow rivers** in World Settings resamples them against current terrain as one undoable action (repeated reflow can deepen beds).
3. **Fill / drain basin** (River → *Fill / drain basin*). Click a low spot to fill an enclosed basin to *Fill depth* above the clicked bed; Shift-click inside to drain. Up to 32 fills, stored as `{cell, level}`. A fill that would reach the map edge is refused.
4. **Pour water** (River → droplet icon): the deliberate way to add water, e.g. to flood a meadow or fill a lake. Click or hold to add water; *Pour amount* sets each dose. Water flows by surface-height difference, pools, spills over rims, drains at the map edge and (since v2.11) into the open sea. Shift-click removes water at that spot. Saved as sorted `[cell, amount]` pairs; the river wand and springs use the same field.

Fills and pours leave the bed intact; the river wand changes the bed only while drawing. All are undoable and saved. This is a grid approximation for play, not hydrology: no momentum, sediment capacity is not physical, and flow does not conserve volume against evaporation.

### 4.6 Path, and route records from older maps

**Path (J)** is a brush. It paints the chosen surface (Loam default, Bedrock, Sand) into the paint arrays and material coverage with the brush footprint and Opacity (D/E), capped per stroke like Paint, and multiplies forest density under the track by (1 − weight), so roads clear trees. It never changes heights and creates no route record. One drag is one undo step.

**Route records** (`routes`) are no longer created; they exist in maps made before v2.11, when Path and River placed points and finished a route. They still load, validate, render (river local water, path paint already baked), count toward limits, keep trees off old path corridors (`pathField`), and old rivers keep Reflow. `isRouteTool()` now returns false, so the old drafting code in `app.mjs` (draft state, preview ribbon, Finish/Cancel bar, Enter/double-click finishing, taper and meander controls) is unreachable; it is kept only until a deliberate cleanup (§11).

| Limit (imported routes) | Value |
| --- | ---: |
| Sampled points per route | 2–4,096 |
| Routes per project | 64 |
| Total route points | 32,768 |
| Raster work per route / project | 8,000,000 / 32,000,000 |

Work estimate: `(1 + Σ max(1, ceil(segmentLength × 2))) × (ceil(width × 1.5) + 3)²`. Keep the work-budget checks in `validRoute` and normalization; point limits alone once allowed billions of raster operations from imported files.

### 4.7 Views, layers and Walk

- **3D proportions.** `verticalScale(n) = 0.65 × n / 512` height units per map block, used by the WebGL shader, Canvas 3D, picking, Walk and sprite depth. Every map size therefore has the same proportions (a 128 map is a 512 one in miniature). Before v2.10, 0.65 was used at every size, so smaller maps were drawn far steeper (64% of the default 256 island was steeper than 45° in 3D). This changes drawing only; saved heights are untouched.
- **Workspace:** 2D Map, 3D Terrain, **Walk**: an eye-level WebGL camera (`walk.mjs`). It arrives hovering 14 blocks above lowland (the lowest quarter of dry, gentle ground nearest the land's centroid) facing the centroid, so the first view is a landscape rather than the face of the central summit. W/A/S/D move; **Space** flies up and **Shift** descends at 12 blocks/s; with neither held the camera hovers at its altitude (pushed up over higher ground, capped at 60 blocks above the highest possible peak). Descending to eye height lands, after which the camera follows the ground. Arrow keys or click-to-look; Esc or *Exit walk* restores the previous view. Walk's key handler runs first, so Space does not start a map pan while walking. Walk is transient: no project field, editing or export effect.
- **Views:** Terrain, Heightmap, Biomes (a visualization, not Minecraft biome data). Toggles: Grid, Contours, Water, Hill shading. Sea level 10–150, default 62. World Settings also holds the height range: *Seabed floor* 0–120 (default 20) and *Highest peak* 100–255 (default 190), at least 30 apart; changes are undoable and saved.
- **Close zoom:** in Terrain view, world-aligned shader detail for stone, ground and canopy fades in, hill shading adds nearby occlusion, and WebGL 3D adds distance haze (`terrain-detail.mjs`). Screen-space only; exports and saved data are unchanged.
- **Layers** (rows appear only when relevant): Surface, Relief (`elevation`), Forests, River water (`rivers`), legacy Landmarks, legacy Drawings. Hidden or locked layers are protected from editing. River creation also needs Relief visible and unlocked.

### 4.8 Living World

One World Settings toggle (default on), with *Water motion*, *Clouds & soft shadows* and *Canopy breeze* options stored in browser preferences only. Everything draws on a separate `living-overlay` canvas in a capped 30 Hz loop (`living.mjs`). It pauses while editing, orbiting/panning, during route drafts, in diagnostic views and Walk, on hidden tabs and under reduced motion. It is excluded from project data, undo history and PNG exports.

- **Water motion (v2.9.4):** wave crests, sun glints, streaks following river direction, and the advancing ocean front.
  - *Crests* are tapered, slightly curved lenses (thickness in screen pixels, so they stay legible at any zoom). They sit on a jittered lattice (step ≈ n/40), thinned by low-frequency patch noise so they cluster, with orientation from a second, broader noise field plus per-crest jitter. Each fades in, drifts about one cell along the swell (south, slightly east) and fades out on its own 5–10 s cycle, so nothing pulses in unison or pops.
  - *Glints* are brief, flat sparkles on their own 2–5 s cycles.
  - At most 260 crests and 140 glints, chosen by a per-mark rank so they spread evenly over the map (the old cap filled the top rows first). Each mark is re-checked against the current wet mask every frame, so marks follow the moving ocean front. JS cost is about 0.1 ms per frame.
- **Canopy breeze:** up to 256 subtle moving foliage glints.
- **Clouds (v2.9.3):** six deterministic cumulus clouds (`cloudField(n, time)`). Each is painted once into a cached 640×400 sprite: a flat base row of puffs, one or two towers and shoulder puffs; an opaque body pass so overlaps never seam; then a cool underside, crescent creases and upper-left sun highlights; a feathered base. A second sprite gives the shadow, affine-mapped onto the ground plane so it foreshortens in 3D. In 3D, bodies float at absolute elevation 235 (above the default 190 ceiling) (`livingProject(x, y, z, absolute)`) instead of riding over peaks. Clouds drift east-south-east and fade at the 0..n−1 map edges, fully transparent at least 0.35r outside, so the wrap is never visible (tested). Without an offscreen canvas (Node/jsdom), clouds are skipped.

### 4.9 Layout and appearance

- Toolbox: default 228px, stored 180–360px, effective width `max(128, min(preferred, 360, viewport − reserve))` with reserve 180 (≤800px), 470 (≤1100px), else 510. Collapsed rail: 64px track, 40px buttons, 28px icons. New visitors below 800px start collapsed; saved preferences win.
- Toolbox order: footprint → brush controls (Size, Opacity where used) → Sculpt (Strength; Flatten target and edge option) → Paint material and Shift erase target (Paint only).
- Header: world name, autosave badge ("Saving…", "Saved in browser", "Not saved · open Worlds"), theme toggle naming the destination mode, Shortcuts, **Worlds** (primary; its label stays visible at every width).
- Nav: undo/redo, 2D/3D/Walk, view choices (filled selected state) and Grid/Contours **toggles** (dot indicator, `aria-pressed`), which are deliberately styled unlike the view choices.
- Selected tool: filled background, inset accent ring, semibold label, 4px edge marker. Layer rows use SVG eye and padlock icons in 32×32 targets.
- Canvas chip reads **MAP** plus dimensions; the overview subtitle is "Custom terrain".

## 5. Iconography and accessibility

Tool icons are original inline SVG from `icons.mjs`: 24×24 viewBox, stroke 1.9, rounded caps/joins, 20% fills, 28px display. Do not distinguish actions only by arrow direction or color. Concepts: Raise (peak +), Lower (basin −), Smooth (sanding block), Flatten (spirit level), River (winding banks), Land (land over shoreline), Path (paired curved edges), Paint (brush), Pan (hand), Settings (sliders). Icons are decorative (`aria-hidden`); group labels, accessible names, shortcut hints, tooltips and pressed states carry meaning.

Semantic color tokens live in `theme.css`, loaded after `style.css`:

| Token | Dark | Light |
| --- | --- | --- |
| Background | `#171d19` | `#f7f6ef` |
| Panel | `#20291f` | `#f0f1e7` |
| Surface | `#2a3427` | `#ffffff` |
| Foreground | `#f0f3e9` | `#1c2b1c` |
| Secondary | `#c3cfba` | `#3f5238` |
| Muted text | `#b4c3a6` | `#52634a` |
| Border | `#839674` | `#718363` |
| Accent | `#bddb91` | `#375b22` |
| Accent foreground | `#182411` | `#ffffff` |
| Focus | `#d5f5a3` | `#315d15` |

`contrast.test.mjs` checks normal text ≥ 4.5:1 and essential control/focus pairs ≥ 3:1 (lowest recorded text pairs: dark 5.03:1, light 4.98:1; see [docs/contrast-audit.md](docs/contrast-audit.md)). This is not a WCAG conformance claim: keyboard-only authoring, screen-reader workflows, touch, and canvas alternatives have not been audited.

## 6. Source architecture and data flow

| File | Responsibility |
| --- | --- |
| `index.html` | Shell, dialogs, toolbar, canvases, forms, help copy |
| `style.css`, `theme.css` | Base layout (with some obsolete selectors); semantic tokens, responsive toolbox and later overrides |
| `app.mjs` | State, events, history/autosave, composition, rendering orchestration, import/export, the Worlds controller (open/switch, artwork for closed worlds, delete/restore) |
| `library.mjs` | World storage: IndexedDB `landwright` with `worlds` (metadata, thumbnail) and `projects` (JSON text) stores; memory fallback; sorting, trash expiry, copy names |
| `library-view.mjs` | Draws library cards, Recently deleted and the per-world menu; no storage |
| `editor.mjs` | Project validation, migration (v1–v9), sizes, default layers, brush-size helpers |
| `terrain.mjs` | Deterministic generation and bounded sculpt strokes |
| `brushes.mjs` | Material table, footprints, alpha compositing, Land operation |
| `earthen.mjs` | Earthen material definitions and procedural ground renderer |
| `material-paint.mjs` | Per-cell material coverage, blending and Base64 codec |
| `forests.mjs` | Forest density strokes, woodland canopy, derived canopy relief, habitat cache |
| `routes.mjs` | Curve sampling, validation and work budget, path/channel rasterization, river field |
| `reactive-water.mjs` | Sea-connected ocean coverage and advancing front |
| `water-dropper.mjs` | Basin fill/drain and poured-water simulation |
| `river-wand.mjs` | River wand: carving dab, trail feeding, erosion and sediment, springs, drying, sea drain |
| `raster-cache.mjs` | Retained RGBA rasters with dirty-rectangle rerendering |
| `terrain-detail.mjs` | Close-zoom detail data and GLSL |
| `terrain3d.mjs` | Projection, Canvas 3D fallback, sampling, full-grid picking, frame scheduler |
| `gpu-terrain.mjs` | WebGL mesh, buffers, shaders, textures |
| `walk.mjs` | Walk camera start and movement |
| `living.mjs` | Living World scene, loop and overlay drawing (including clouds) |
| `ui.mjs` | Theme and sidebar preferences, resize/collapse/flyout |
| `icons.mjs` | Tool and settings icons |
| `landmarks.mjs`, `shapes.mjs`, `eraser.mjs` | Legacy landmark atlas, legacy drawing geometry and hit testing |
| `contrast.mjs` | Contrast utilities for tests |
| `docs/`, `studies/earthen/` | Tutorial, knowledge base, plans, release history, the approved material study |
| `.agents/skills/landwright-development/` | Reusable development skill with a snapshot of this document |

### Runtime data

All cell arrays are row-major `i = y × N + x`. Internally X/Y are horizontal; the UI labels them X/Z.

| Value | Type | Saved | Purpose |
| --- | --- | --- | --- |
| `heights` | Float32Array N² | yes | Authoritative bed |
| `paint`, `paintColors`, `paintAlpha` | Uint8 N², Uint8Clamped 3N², Float32 N² | yes | Legacy material marker, blended RGB, coverage |
| `surfaceMaterials` | 8 bytes × N² | yes (Base64) | Ground material coverage |
| `forest` | Float32Array N² | yes | Forest density 0–1 |
| `routes` | Array | yes | Committed Path/River records |
| `waterDrops`, poured water | Arrays | yes, when non-empty | Basin fills, poured water |
| `marks`, `drawings` | Arrays | yes | Legacy content (no `town` marks) |
| `riverWater`, ocean coverage, `surfaceHeights` | Derived | no | Local and ocean water, effective display/picking surface |
| woodland, earthen and detail rasters | Derived | no | Textures and caches |
| `routeDraft`, Walk camera, Living World state | Transient | no | UI state |

Data flow: a gesture checks visibility/locks and snapshots history → edits authoritative arrays → `refresh()` marks surfaces and textures dirty and requests one coalesced frame → `updateSurface()` refreshes effective geometry for picking → `flushTexture()` rerenders only the dirty rectangle (plus two cells of padding) during scheduled frames, never per pointer event → GPU/Canvas rendering, sampling and picking all read the same effective surface. Save and history store authoritative data only.

Keep effective water geometry consistent across rendering, cursor projection and picking: water that is drawn at the surface but picked at the bed is a bug.

### Rendering limits

- Ground and woodland rasters stay at 4 pixels per block in Terrain view throughout strokes (2048² at 512); diagnostic views use 1 pixel per block.
- WebGL uses one indexed full-resolution mesh, `2 × (N − 1)²` triangles (522,242 at 512). 512 uses 32-bit indices via `OES_element_index_uint`; smaller sizes use 16-bit. Color texture updates upload dirty rectangles.
- The Canvas 3D fallback draws a coarser mesh (step 3, step 6 while orbiting) with texture-mapped covered cells. Picking always intersects the full-resolution field.
- Pixel ratio is capped at 2. Camera defaults: yaw −0.65, pitch 0.65 (0.18–1.15), zoom 1 (0.5–3); 2D zoom 0.4–4. WebGL context loss falls back to Canvas.
- Real-GPU frame pacing has only been profiled once (512 study on an Apple M5). Do not infer GPU performance from headless or Canvas runs.

## 7. Project schema and compatibility

Downloads are JSON named `<sanitized-name>.world.json` (not the WorldPainter desktop format).

```ts
type ProjectV9 = {
  version: 9;
  size: 128 | 192 | 256 | 512;      // missing size → 256
  floor: number; ceiling: number;    // integers; floor 0..120, ceiling 100..255, ≥ 30 apart; missing → 20 / 190
  name: string;                      // ≤ 80 chars
  heights: number[];                 // N², 0..255 (3 decimals)
  paint: number[];                   // N², 0..9
  paintColors: number[];             // 3N², 0..255
  paintAlpha: number[];              // N², 0..1 (4 decimals)
  surfaceMaterials: string;          // Base64 of N×N×8 coverage bytes, '' when empty
  forest: number[];                  // N², 0..1 (4 decimals)
  sea: number;                       // 10..150
  water: boolean; shade: boolean;
  routes: (PathRoute | RiverRoute)[];
  waterDrops?: { cell: number; level: number }[];   // ≤ 32
  pouredWater?: [cell: number, amount: number][];   // sorted by cell; amount 1e-5..1e8
  springs?: [cell: number, rate: number][];         // ≤ 64; rate 0 < r ≤ 100 (Water %)
  marks: LegacyLandmark[];           // tree | mountain
  shapes: LegacyShape[];
  layers: Record<'surface'|'landmarks'|'shapes'|'elevation'|'rivers'|'forests',
                 { visible: boolean; locked: boolean }>;
};
```

- `normalizeProject` accepts versions 1–9 and returns v9. Older versions get empty material coverage, forest density, fills and pours. v1/v2 paint IDs migrate using the frozen original six colors; v3+ require explicit RGB/alpha.
- **Settlement data is dropped on import.** Version 6–8 `settlements` records and `layers.settlements`, and legacy `town` landmarks, are ignored. The original file on disk is unchanged, but the next save or autosave no longer contains them (§12).
- River points carry fixed `level`s; levels must be non-increasing. Missing `taper` means a uniform-width legacy river.
- Validation happens before replacing the active project or history; invalid files leave the current project and redo stack untouched.
- Import size limits: project JSON 32 MB, images 12 MB. JSON is detected by a case-sensitive `.json` suffix. Image heightmaps are resampled to the current N using luminance `0.2126 R + 0.7152 G + 0.0722 B` and clear paint, coverage, forest, routes, water and legacy content.
- Loading never replays route paint/carving: it is already in the saved arrays.

## 8. Persistence, history and exports

Worlds live in IndexedDB database `landwright` (version 1):

| Store | Key | Contents |
| --- | --- | --- |
| `worlds` | `id` | `{ id, name, size, created, edited, bytes, thumb?, deleted? }`. `thumb` is a 192² PNG data URL; `deleted` is a timestamp. |
| `projects` | world id | The v9 project as a JSON string (the same text as a backup file) |

| Browser key | Contents |
| --- | --- |
| `landwright-current` | Id of the world to reopen next visit |
| `worldpainter-project` | Before v2.13, the single saved project. On the first v2.13 visit it becomes the first library world and the key is removed once IndexedDB has it. Still written as the only save when IndexedDB is unavailable. |
| `landwright-ui` | `{ theme, sidebarWidth, collapsed }` |
| `landwright-living` | `{ enabled, clouds, waterMotion, vegetationMotion }` |

Startup: the editor draws (hidden for up to 1.5 s), the library opens, worlds deleted 30+ days ago are purged, then the remembered world (or the most recently edited) loads. If IndexedDB is empty, whatever the editor shows (the old single save, or the default island) is stored as the first world. If every world is in Recently deleted, Worlds opens and cannot be dismissed until one is restored or created.

Autosave is debounced by 600 ms and writes only the open world; the thumbnail refreshes at most every 4 s and whenever the world is closed or Worlds opens. Switching worlds saves the current one first. Saving also flushes on `pagehide` and when the tab is hidden. Failure shows "Not saved · open Worlds" instead of claiming success. If IndexedDB is missing or refuses to open, a memory library keeps the session working, the old single-slot key keeps the open world, and the library footer says only the open world survives a visit. There is no cloud sync or account recovery, so backup files matter.

Artwork for a closed world: `withWorld` loads its project into the editor behind the full-screen library, composes the image, and loads the open world back with its undo history, camera and pending-save state. Nothing is saved during the swap.

Not saved: undo/redo, current tool/material/footprint, slider settings, workspace mode, camera, zoom, view, grid/contours, generation options, route drafts, Living World state.

Undo keeps 35 full project snapshots for the open world and is cleared when another world opens. A new edit clears redo. Route commits and basin fills are single undo steps, and pouring is undoable; name typing groups per focus session. Undo with an open route draft cancels the draft first. Escape stops a brush stroke but does not roll it back.

| Export | Size | Content |
| --- | --- | --- |
| Project | JSON | Authoritative data (§7) |
| Map PNG | 1024² / 2048² (default) / 4096², chosen in the world's menu | Top-down visible terrain, materials, settled water, woodland, legacy overlays. No grid, cursor, drafts, UI, HUD or Living World. |
| Heightmap PNG | N², 8-bit gray | Rounded bed elevations; no water, canopy or detail |

## 9. Development, verification and release

```bash
git clone https://github.com/mopajazz/landwright.git
cd landwright
npm ci
npm test
python3 -m http.server 8000
```

Open `http://localhost:8000/` (serve over HTTP; do not open the file directly). There is no build step. Node 22+ with the built-in test runner is required.

### Tests

195 tests in `tests/` (Node unit tests plus jsdom interaction tests with stubbed canvas). They verify data, events, history and rendering logic, not GPU pixels, PNG encoding, touch, or perceived quality. Notes:

- `interactions.test.mjs` compares whole project states. A failing `deepEqual` on large arrays can exhaust memory and kill the process instead of printing a diff; run the file alone with `node --test --test-reporter=spec tests/interactions.test.mjs` to find the test.
- Living World tests need queued animation frames: bind the loop to `document.defaultView.requestAnimationFrame`, not a synchronous stub (see `living-interactions.test.mjs`).

Also run `node --check` on changed modules and `git diff --check`.

### Manual checks before a release

1. Worlds: create at each size, switch, rename, duplicate, import, delete + Undo, Restore, Delete forever; reload reopens the last world; a v2.12 single save migrates.
2. Paint each material and Forest; footprints never switch tools; Shift erase each target.
3. Raise/Lower/Smooth/Flatten and Land near edges; Flatten rim opt-out; D/E behavior per tool.
4. Path and River drafts in 2D and 3D: Enter, double-click, Finish, Escape, one-point no-op, middle-pan during a draft, undo during a held drag.
5. Water: cut a channel into a dry basin, fill/drain a basin, pour and remove water, Water off, River water hidden/locked, Reflow.
6. Walk in and out; Esc restores the previous view.
7. Living World on/off and each option; pauses during edits and reduced motion; absent from exports.
8. Both themes, collapsed rail, narrow sidebar, ~500px window, settings flyout.
9. Map PNG at each size and Heightmap PNG in a real browser, for the open world and a closed one.
10. A real GPU browser and the Canvas fallback.

### Releasing

GitHub Pages builds `main:/` automatically (legacy build; no workflow file). Before merging a release PR:

- Bump the cache revision **everywhere at once**: the `?v=` query on `style.css`, `theme.css` and `app.mjs` in `index.html`, and on every local module import. `assets.test.mjs` checks they match. Current value: `2.13.0`. Update the footer version when appropriate. Documentation-only changes need no bump.
- Check help text, tutorial and KB against the implemented controls.

After merging, find the Pages run for the exact merge commit, wait for success, then load the live site and confirm the footer and the changed flow. A push is not a deployment. To roll back, revert the faulty commits through a PR and verify Pages again; note any schema implications for files saved by the newer version.

## 10. Reusable development skill

`.agents/skills/landwright-development/` contains `SKILL.md` and `references/handoff.md`, a snapshot of this document with links rebased for use outside the repository. Refresh the snapshot in the same PR whenever this document changes. In a checkout, this file and the code take precedence over any installed snapshot.

Fresh-session prompt: **"Use landwright-development to continue Landwright. Read the current handoff, inspect HEAD and open PRs, and implement the requested change on a branch while keeping the tutorial and KB current."**

## 11. Known limitations and open items

Limitations (facts, not promises):

1. Finished routes cannot be edited point by point; Path records persist after their paint is erased and count toward limits.
2. Water is authored or approximated: no momentum, volume conservation in the ocean, erosion, watershed detection, or automatic river recomputation after sculpting.
3. Erasing river water keeps the carved channel; undo the original commit to restore both.
4. 512 is experimental: CPU-bound sculpting misses frame budgets; storage quota can be exceeded.
5. Desktop-first. Touch and comprehensive accessibility are unaudited; Shortcuts help is hidden below 800px.
6. Browser-local persistence only; no backups, collaboration or multi-project library.
7. No Minecraft/WorldPainter formats, no WorldBox-style simulation.
8. Old CSS selectors remain (legacy tools, `.breadcrumb`, `.smallgreen`); remove deliberately with visual checks.

Open UI items from reviews (not yet assigned):

- Brush controls (Size, Strength) sit below the footprint presets and fall below the fold at 900px height; consider putting controls first.
- Export dialog cards are buttons but look like information panels; add a download affordance.
- Paint's footer hint mentions W/S but not D/E.
- Paint repeats the Shift-erase message three times and shows a one-option target dropdown; hide the dropdown until there is a choice.
- World dimensions appear in four places; "Made for world builders" filler remains in the right panel.
- Land = C (reads as Coastline) and Smooth = Q are hard to recall; tool-button shortcut letters are about 9px.
- The toggle dot, layer icons and selected-tool ring are outside the contrast tests.


- **Creek width is fixed at stroke time** (60% of the brush diameter). Wider rivers come from a bigger brush or the droplet; there is no way to widen an existing creek's water yet.
- **Dead route-drafting code** in `app.mjs` (see §4.6) can be removed in a cleanup PR, keeping legacy route loading, rendering and Reflow.

Process items:

- Add a GitHub Actions workflow that runs `npm test` on pull requests.
- Close the stale draft PR for settlement brushes (#3), superseded by v2.9.

Regression-tested behaviors to protect: one River pass makes a readable creek that stays behind a low lip while a deliberate droplet pour floods the meadow; creeks are continuous and never rise downstream; the river wand's carving is bounded per stroke, erosion happens only while drawing, deltas stay below sea level, the sea drains water, one stroke undoes in one step, and Relief locks block it; Path never changes heights and clears trees; Raise/Lower Strength strokes keep building, never pass the height range and never create needles past `spikeSlope`; 3D proportions are size-independent; Walk starts on lowland, hovers, and never flies below eye height or above its ceiling; zero paint opacity never disables sculpting; no preset-driven tool switching; per-stroke opacity caps; Flatten perimeter protection; coalesced frames and no per-pointer rasterization; real 3D picking at the water/canopy surface; safe route-draft cancellation; no route→sculpt fallthrough; middle-pan ordering; delayed erase-target reconciliation; clouds invisible before wrapping; water marks jittered, evenly spread and fully faded at cycle ends.

## 12. Parked and deferred topics

**Settlements — parked.** Two implementations were rejected: a right-panel editor with stamp placement (v2.5) and terrain-shaped settlement brushes with illustrated selection cards (v2.8). v2.9 removed all settlement code, layers, rendering and data. The user has said settlements are *parked*, not abandoned, and is uncertain about any stamp-style tool. If they return, discuss the shape first; a direction consistent with §3 would be painting settled land and letting terrain decide where buildings appear, rather than placing objects. Note that current imports drop old settlement records (§7); if old data must survive, that needs a code change before anyone relies on it.

**Holler Maps assets — not integrated.** The user's source library lives on their own computer and in their ChatGPT library, neither of which agents can reach. Reference images seen in chat are not source files. Do not claim the library was found, imported or licensed. Next step: the user provides a ZIP or a reachable repository; inventory files, dimensions, transparency, categories and license before designing any integration, and confirm with the user that these are the exact assets.

**Storytelling — deferred** until the terrain tools are complete. Nothing is implemented or specified. Before building, revisit audience, structure, location linking, authoring, export and persistence with the user. Do not add narrative UI, AI services or accounts as an assumed next step.

**Next work.** No next feature is agreed. Candidates on record: reduce CPU cost of brush edits so 512 can leave experimental ([docs/terrain-resolution-512.md](docs/terrain-resolution-512.md)); the open UI items in §11; a CI workflow. Ask the user before starting any of them.
