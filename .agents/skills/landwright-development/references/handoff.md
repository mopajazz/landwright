# Landwright — engineering and product handoff

**Documentation date:** November 21, 2026 (America/New_York)<br>
**Displayed release:** `v2.9.3` · **Cache revision:** `2.9.3` · **Project schema written:** `9`<br>
**Repository:** https://github.com/mopajazz/landwright · **Live app:** https://mopajazz.github.io/landwright/

This document describes **the app as it is now**. It is edited in place whenever behavior changes; it is not appended to. Release-by-release engineering notes (why decisions were made, measurements, rejected directions) live in [docs/release-history.md](https://github.com/mopajazz/landwright/blob/main/docs/release-history.md). Source and tests are authoritative where this document and the code disagree; fix the document when that happens.

## 0. Start here

| Contract | Current state |
| --- | --- |
| Release | **v2.9.3**: v2.9.2 plus 512 terrain, Walk, basin fill and pour water (`d1d9526`), plus the cumulus cloud renderer (PR `fluffy-clouds`). |
| Live deployment | Last verified live on November 21, 2026: `d1d9526`, cache `2.9.2-walk.1`. After merging, confirm the Pages run for the exact merge commit and that the live footer reads v2.9.3. |
| Runtime | Static HTML/CSS/ES modules served by GitHub Pages from `main:/`. No build step, backend, accounts or runtime packages. |
| Project format | Writes **9**, imports **1–9**. Saved: terrain, paint, material coverage, forest density, routes, basin fills, poured water, legacy drawings/landmarks, layer flags. |
| Toolbar | **Nine** tools: Raise, Lower, Smooth, Flatten, River, Land, Path, Paint, Pan. |
| Erasing | **Shift + Paint** with Paint's *Shift erase target*. There is no Erase tool. |
| D / E keys | Paint and Path: Opacity −/+ 5%. Flatten: target height −/+ 1 (Shift ×10). Other tools ignore them. |
| Navigation | Space + left-drag or middle-drag pans (2D/3D). Right/Alt-drag orbits in 3D. **Walk** gives an eye-level WebGL view. |
| Terrain sizes | 128², 192², 256² (default), and **experimental 512²**. |
| Water | Sea-connected reactive ocean, authored river channels, basin fill/drain, and poured water that flows and pools. |
| Look | Eight earthen ground materials with terrain-responsive texture; terrain-integrated woodland; close-zoom surface detail; Living World motion and cumulus clouds. |
| Exports | Map PNG 1024² / 2048² (default) / 4096². Heightmap PNG at N² with bed elevations only. Editable project JSON. |
| Tests | `npm test`: **183 passed, 0 failed** on this branch (November 21, 2026). |
| Settlements | **Parked.** Removed in v2.9; the user may want them back in a different form (§12). |

**Preserve:** beginner guidance must prominently say to start Raise/Lower at **5–10% Strength**, use short strokes, inspect, and increase gradually. Keep nine tools. Never save derived water, canopy or texture geometry into bed heights or project files.

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
- Erasing is Shift + Paint; the standalone Erase tool was removed.
- Coastline is a footprint; **Land** is the explicit add/remove-land tool.
- The terrain *decides*: woodland grows only where terrain allows, ground texture responds to slope, wetness and light, and ocean water follows connectivity. This "paint intent, terrain decides" model is what the user likes most, especially the woodland.
- Each project is a single world. Do not add "Overworld" or other world-hierarchy labels.
- Path and River are focused route tools, not a reason to restore a general Drawing menu.
- Living World effects are optional visual atmosphere, behind one World Settings toggle.
- Maintain the tutorial and knowledge base with every user-visible change.

Do not restore: Drawing, Details, Forest Scatter, generated tree stamps, the settlement right-panel editor, settlement selection cards, the old preview thumbnail, or preset-driven tool switching. Legacy modules and historical tests are not a reason to restore them.

## 4. Feature inventory

### 4.1 New world

New world opens a modal: world name (required, up to 80 characters, default `Untitled world`), six starting shapes with thumbnails, terrain detail, a large live preview at the exact chosen grid, collapsed *Generation settings* (seed, relief), a *Download current project first* action, Cancel/X/Escape and native Enter/Create. Previews never modify the current map.

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
- Non-flat, non-ocean generation clamps heights to 10–250; relief scales land above sea level 62.
- Creating a world makes one undo snapshot and clears paint, material coverage, forest density, routes, basin fills, poured water and legacy content. It restores default layers, sea level 62, Water and Hill shading on, and recenters both cameras.
- 512 is experimental: sculpting misses frame budgets on measured hardware and painted 512 worlds can exceed the browser storage quota. See [docs/terrain-resolution-512.md](https://github.com/mopajazz/landwright/blob/main/docs/terrain-resolution-512.md).

### 4.2 Toolbar and shortcuts

| Group | Tool | ID | Key | Effect |
| --- | --- | --- | --- | --- |
| Terrain | Raise | `raise` | R | Increase elevation locally |
| Terrain | Lower | `lower` | L | Decrease elevation locally |
| Terrain | Smooth | `smooth` | Q | Move toward a local 5×5 mean |
| Terrain | Flatten | `flatten` | F | Converge toward a target height |
| Terrain | River | `river` | V | River channels, pour water, fill/drain basins (§4.5) |
| Terrain | Land | `land` | C, M | Add land; Shift removes land |
| Surface | Path | `path` | J | Route that paints a material trail |
| Surface | Paint | `paint` | P, B | Paint ground material or forest density; Shift erases |
| Navigate | Pan | `pan` | H | Pan the map/camera |

| Input | Behavior |
| --- | --- |
| W / S, Shift ×10 | Brush diameter ±1 (±10); route width for Path/River |
| Shift + wheel | Brush or route width ±1 |
| Wheel | Zoom |
| D / E, Shift ×10 for Flatten | Opacity ±5% (Paint, Path) or Flatten target ±1 |
| Left drag | Apply the brush, or add route points while a route is active |
| Space + left drag, middle drag | Pan (2D/3D), including during a route draft; a started pan stays a pan until release |
| Right drag, Alt + drag (3D) | Orbit/tilt |
| Shift + tool | Raise↔Lower reverse; Land removes; Paint erases the chosen target |
| Enter / double-click | Finish a route draft |
| Escape | Cancel a route draft or stop the current gesture; exits Walk |
| Ctrl/Cmd + Z, + Shift + Z | Undo/redo; a route draft is cancelled first without consuming history |
| Ctrl/Cmd + S | Download project JSON |

Shortcuts are ignored while typing in inputs, selects, textareas or contenteditable elements, and while a dialog is open. Ctrl/Meta/Alt combinations do not trigger D/E.

### 4.3 Brushes and sculpting

| Control | Bounds | Default | Shown for |
| --- | --- | --- | --- |
| Size | 4–120 blocks | 42 | Brush tools |
| Opacity | 0–100% | 100% | Paint, Path |
| Strength | 1–100% | Raise/Lower 8%; Smooth/Flatten 35% (two groups remembered separately) | Sculpt tools |
| Flatten target | 1–255 | 120 | Flatten |
| Preserve map edges | Boolean | On | Flatten |

Footprints: **Soft Round** `(1 − d²)²`; **Hard Round** full coverage inside the circle; **Coastline** irregular angular edge with a sharper feather; **Grain** soft weight modulated by stable cell noise. Footprints shape coverage only; material texture is separate.

- Elevation is clamped to 0–255. Raise/Lower are additive and weighted. Smooth samples a pre-dab copy. Flatten converges toward the target.
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
2. **River channels** (River, default mode). Click/drag a route, then finish. The water profile is sampled source-to-mouth and never rises: `level = max(0, min(previousLevel, ground − 0.5))`. The channel is carved with softened banks; local river water exists inside the channel. Options: width 2–32 (default 8), channel depth 1–16 (default 4), **Taper** (default on: the source starts at 25% width), **Meander** 0–100% (default 25%, deterministic, endpoints pinned). **Reflow rivers** in World Settings resamples every profile against current terrain as one undoable action (repeated reflow can deepen beds).
3. **Fill / drain basin** (River → *Fill / drain basin*). Click a low spot to fill an enclosed basin to *Fill depth* above the clicked bed; Shift-click inside to drain. Up to 32 fills, stored as `{cell, level}`. A fill that would reach the map edge is refused.
4. **Pour water** (River → droplet icon). Click or hold to add water; *Pour amount* sets each dose. Water flows by surface-height difference, pools, spills over rims and drains at the map edge. Shift-click removes water at that spot. Saved as sorted `[cell, amount]` pairs.

Fills and pours leave the bed intact, are undoable, and are saved. River routes, fills and pours are authored approximations, not hydrology.

### 4.6 Routes (Path and River channels)

1. Select Path (J) or River (V).
2. Click points or drag a curve. The preview shows a ribbon in the path material or river blue, a dashed centerline and handles. The footer hint says "W/S route width".
3. Finish with Enter, double-click or the on-map **Finish route** button. Escape or Cancel discards; changing tool or 2D/3D cancels.

An unfinished route never changes project data. A committed route is one undo group; a single point or a route under one map unit cannot commit. Route tools never fall through to sculpting; middle-drag pans instead of adding points.

Path paints a feathered trail into the paint arrays without changing heights. Its sampled record is kept (and still counts toward limits) even if its paint is later erased.

| Limit | Value |
| --- | ---: |
| Draft control points | 512 |
| Sampled points per route | 2–4,096 |
| Routes per project | 64 |
| Total route points | 32,768 |
| Raster work per route / project | 8,000,000 / 32,000,000 |

Work estimate: `(1 + Σ max(1, ceil(segmentLength × 2))) × (ceil(width × 1.5) + 3)²`. Keep the work-budget checks in `validRoute`, normalization and commit; point limits alone once allowed billions of raster operations.

### 4.7 Views, layers and Walk

- **Workspace:** 2D Map, 3D Terrain, **Walk** (eye-level WebGL camera; W/A/S/D to move, arrow keys or click-to-look, Esc or *Exit walk* restores the previous view). Walk is transient: no project field, editing or export effect.
- **Views:** Terrain, Heightmap, Biomes (a visualization, not Minecraft biome data). Toggles: Grid, Contours, Water, Hill shading. Sea level 10–150, default 62.
- **Close zoom:** in Terrain view, world-aligned shader detail for stone, ground and canopy fades in, hill shading adds nearby occlusion, and WebGL 3D adds distance haze (`terrain-detail.mjs`). Screen-space only; exports and saved data are unchanged.
- **Layers** (rows appear only when relevant): Surface, Relief (`elevation`), Forests, River water (`rivers`), legacy Landmarks, legacy Drawings. Hidden or locked layers are protected from editing. River creation also needs Relief visible and unlocked.

### 4.8 Living World

One World Settings toggle (default on), with *Water motion*, *Clouds & soft shadows* and *Canopy breeze* options stored in browser preferences only. Everything draws on a separate `living-overlay` canvas in a capped 30 Hz loop (`living.mjs`). It pauses while editing, orbiting/panning, during route drafts, in diagnostic views and Walk, on hidden tabs and under reduced motion. It is excluded from project data, undo history and PNG exports.

- **Water motion:** shimmer strokes on wet cells, streaks following river direction, and the advancing ocean front.
- **Canopy breeze:** up to 256 subtle moving foliage glints.
- **Clouds (v2.9.3):** six deterministic cumulus clouds (`cloudField(n, time)`). Each is painted once into a cached 640×400 sprite: a flat base row of puffs, one or two towers and shoulder puffs; an opaque body pass so overlaps never seam; then a cool underside, crescent creases and upper-left sun highlights; a feathered base. A second sprite gives the shadow, affine-mapped onto the ground plane so it foreshortens in 3D. In 3D, bodies float at absolute elevation 185 (`livingProject(x, y, z, absolute)`) instead of riding over peaks. Clouds drift east-south-east and fade at the 0..n−1 map edges, fully transparent at least 0.35r outside, so the wrap is never visible (tested). Without an offscreen canvas (Node/jsdom), clouds are skipped.

### 4.9 Layout and appearance

- Toolbox: default 228px, stored 180–360px, effective width `max(128, min(preferred, 360, viewport − reserve))` with reserve 180 (≤800px), 470 (≤1100px), else 510. Collapsed rail: 64px track, 40px buttons, 28px icons. New visitors below 800px start collapsed; saved preferences win.
- Toolbox order: footprint → brush controls (Size, Opacity where used) → Sculpt (Strength; Flatten target and edge option) → Paint material and Shift erase target (Paint only).
- Header: world name, autosave badge ("Saving…", "Saved in browser", "Not saved · download"), theme toggle naming the destination mode, Shortcuts, **Download** (visible at every width; icon-only below 800px), **Export map**.
- Nav: New world, Import, undo/redo, 2D/3D/Walk, view choices (filled selected state) and Grid/Contours **toggles** (dot indicator, `aria-pressed`), which are deliberately styled unlike the view choices.
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

`contrast.test.mjs` checks normal text ≥ 4.5:1 and essential control/focus pairs ≥ 3:1 (lowest recorded text pairs: dark 5.03:1, light 4.98:1; see [docs/contrast-audit.md](https://github.com/mopajazz/landwright/blob/main/docs/contrast-audit.md)). This is not a WCAG conformance claim: keyboard-only authoring, screen-reader workflows, touch, and canvas alternatives have not been audited.

## 6. Source architecture and data flow

| File | Responsibility |
| --- | --- |
| `index.html` | Shell, dialogs, toolbar, canvases, forms, help copy |
| `style.css`, `theme.css` | Base layout (with some obsolete selectors); semantic tokens, responsive toolbox and later overrides |
| `app.mjs` | State, events, history/autosave, composition, rendering orchestration, import/export |
| `editor.mjs` | Project validation, migration (v1–v9), sizes, default layers, brush-size helpers |
| `terrain.mjs` | Deterministic generation and bounded sculpt strokes |
| `brushes.mjs` | Material table, footprints, alpha compositing, Land operation |
| `earthen.mjs` | Earthen material definitions and procedural ground renderer |
| `material-paint.mjs` | Per-cell material coverage, blending and Base64 codec |
| `forests.mjs` | Forest density strokes, woodland canopy, derived canopy relief, habitat cache |
| `routes.mjs` | Curve sampling, validation and work budget, path/channel rasterization, river field |
| `reactive-water.mjs` | Sea-connected ocean coverage and advancing front |
| `water-dropper.mjs` | Basin fill/drain and poured-water simulation |
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

| Browser key | Contents |
| --- | --- |
| `worldpainter-project` | Current v9 project (key name kept for existing users) |
| `landwright-ui` | `{ theme, sidebarWidth, collapsed }` |
| `landwright-living` | `{ enabled, clouds, waterMotion, vegetationMotion }` |

Autosave is debounced by 600 ms and per origin/browser. Storage failure shows "Not saved · download" instead of claiming success; painted 512 worlds can exceed the quota. There is no cloud sync or account recovery, so downloads matter.

Not saved: undo/redo, current tool/material/footprint, slider settings, workspace mode, camera, zoom, view, grid/contours, generation options, route drafts, Living World state.

Undo keeps 35 full project snapshots. A new edit clears redo. Route commits and basin fills are single undo steps, and pouring is undoable; name typing groups per focus session. Undo with an open route draft cancels the draft first. Escape stops a brush stroke but does not roll it back.

| Export | Size | Content |
| --- | --- | --- |
| Project | JSON | Authoritative data (§7) |
| Map PNG | 1024² / 2048² (default) / 4096² (session choice) | Top-down visible terrain, materials, settled water, woodland, legacy overlays. No grid, cursor, drafts, UI, HUD or Living World. |
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

183 tests in `tests/` (Node unit tests plus jsdom interaction tests with stubbed canvas). They verify data, events, history and rendering logic, not GPU pixels, PNG encoding, touch, or perceived quality. Notes:

- `interactions.test.mjs` compares whole project states. A failing `deepEqual` on large arrays can exhaust memory and kill the process instead of printing a diff; run the file alone with `node --test --test-reporter=spec tests/interactions.test.mjs` to find the test.
- Living World tests need queued animation frames: bind the loop to `document.defaultView.requestAnimationFrame`, not a synchronous stub (see `living-interactions.test.mjs`).

Also run `node --check` on changed modules and `git diff --check`.

### Manual checks before a release

1. New world at each size; save, import, undo back.
2. Paint each material and Forest; footprints never switch tools; Shift erase each target.
3. Raise/Lower/Smooth/Flatten and Land near edges; Flatten rim opt-out; D/E behavior per tool.
4. Path and River drafts in 2D and 3D: Enter, double-click, Finish, Escape, one-point no-op, middle-pan during a draft, undo during a held drag.
5. Water: cut a channel into a dry basin, fill/drain a basin, pour and remove water, Water off, River water hidden/locked, Reflow.
6. Walk in and out; Esc restores the previous view.
7. Living World on/off and each option; pauses during edits and reduced motion; absent from exports.
8. Both themes, collapsed rail, narrow sidebar, ~500px window, settings flyout.
9. Map PNG at each size and Heightmap PNG in a real browser.
10. A real GPU browser and the Canvas fallback.

### Releasing

GitHub Pages builds `main:/` automatically (legacy build; no workflow file). Before merging a release PR:

- Bump the cache revision **everywhere at once**: the `?v=` query on `style.css`, `theme.css` and `app.mjs` in `index.html`, and on every local module import. `assets.test.mjs` checks they match. Current value: `2.9.3`. Update the footer version when appropriate. Documentation-only changes need no bump.
- Check help text, tutorial and KB against the implemented controls.

After merging, find the Pages run for the exact merge commit, wait for success, then load the live site and confirm the footer and the changed flow. A push is not a deployment. To roll back, revert the faulty commits through a PR and verify Pages again; note any schema implications for files saved by the newer version.

## 10. Reusable development skill

This skill folder contains [`SKILL.md`](../SKILL.md) and `references/handoff.md`, a snapshot of this document with links rebased for use outside the repository. Refresh the snapshot in the same PR whenever this document changes. In a checkout, this file and the code take precedence over any installed snapshot.

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

- Water-motion shimmer is a regular grid of short dashes that reads as graph paper; it needs an organic pattern.
- Brush controls (Size, Strength) sit below the footprint presets and fall below the fold at 900px height; consider putting controls first.
- Export dialog cards are buttons but look like information panels; add a download affordance.
- Paint's footer hint mentions W/S but not D/E.
- Paint repeats the Shift-erase message three times and shows a one-option target dropdown; hide the dropdown until there is a choice.
- World dimensions appear in four places; "Made for world builders" filler remains in the right panel.
- Land = C (reads as Coastline) and Smooth = Q are hard to recall; tool-button shortcut letters are about 9px.
- The toggle dot, layer icons and selected-tool ring are outside the contrast tests.

Process items:

- Add a GitHub Actions workflow that runs `npm test` on pull requests.
- Close the stale draft PR for settlement brushes (#3), superseded by v2.9.

Regression-tested behaviors to protect: zero paint opacity never disables sculpting; no preset-driven tool switching; per-stroke opacity caps; Flatten perimeter protection; coalesced frames and no per-pointer rasterization; real 3D picking at the water/canopy surface; safe route-draft cancellation; no route→sculpt fallthrough; middle-pan ordering; delayed erase-target reconciliation; clouds invisible before wrapping.

## 12. Parked and deferred topics

**Settlements — parked.** Two implementations were rejected: a right-panel editor with stamp placement (v2.5) and terrain-shaped settlement brushes with illustrated selection cards (v2.8). v2.9 removed all settlement code, layers, rendering and data. The user has said settlements are *parked*, not abandoned, and is uncertain about any stamp-style tool. If they return, discuss the shape first; a direction consistent with §3 would be painting settled land and letting terrain decide where buildings appear, rather than placing objects. Note that current imports drop old settlement records (§7); if old data must survive, that needs a code change before anyone relies on it.

**Holler Maps assets — not integrated.** The user's source library lives on their own computer and in their ChatGPT library, neither of which agents can reach. Reference images seen in chat are not source files. Do not claim the library was found, imported or licensed. Next step: the user provides a ZIP or a reachable repository; inventory files, dimensions, transparency, categories and license before designing any integration, and confirm with the user that these are the exact assets.

**Storytelling — deferred** until the terrain tools are complete. Nothing is implemented or specified. Before building, revisit audience, structure, location linking, authoring, export and persistence with the user. Do not add narrative UI, AI services or accounts as an assumed next step.

**Next work.** No next feature is agreed. Candidates on record: reduce CPU cost of brush edits so 512 can leave experimental ([docs/terrain-resolution-512.md](https://github.com/mopajazz/landwright/blob/main/docs/terrain-resolution-512.md)); restyle water shimmer; the open UI items in §11; a CI workflow. Ask the user before starting any of them.
