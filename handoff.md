# Landwright — engineering and product handoff

**Documentation date:** November 17, 2026 (America/New_York)  
**Implementation baseline:** `1010122f94ac3e06c1aaef7375019f6b16c30a4b`  
**Displayed release:** `v2.0`  
**Browser asset/module cache revision:** `2.0.1`  
**Project schema written by the application:** `4`

This document describes the implemented application at the baseline above. It distinguishes current behavior, compatibility support, known limitations, and deferred ideas. It is intended to let another developer or coding agent continue without relying on the chat history. Application behavior is defined by the source and tests; update this handoff whenever those contracts change.

## 1. Identity, ownership, and locations

| Item | Value |
| --- | --- |
| Product name | **Landwright** |
| Repository | https://github.com/mopajazz/worldpainter-studio |
| Live application | https://mopajazz.github.io/worldpainter-studio/ |
| Branch | `main` |
| Repository-relative entry point | `index.html` |
| Current execution checkout | `/workspace/work/worldpainter-github` |
| Git remote used in this checkout | `github` |
| Hosting | GitHub Pages, branch `main`, directory `/` |
| Hosting configuration observed | Pages `build_type: legacy`; GitHub-managed Pages build/deployment |

The checkout path and remote alias are environment-specific conveniences, not product requirements. The repository and Pages URL retain `worldpainter-studio`; the product was renamed without renaming the repository or moving the hosting origin.

The user requested GitHub hosting because their workplace firewall blocked the earlier hosting site. Continue deploying this application to the existing GitHub Pages site unless the user changes that instruction.

Landwright is independently implemented. WorldPainter, WorldBox, and Inkarnate inform concepts and interaction preferences; this is not their official web edition, does not embed their application code, and does not provide their full feature sets. No desktop WorldPainter file-format implementation or binary reverse-engineering deliverable is included.

## 2. Product direction and decisions to preserve

The goal is a **minimalist cartographic terrain builder with complexity behind a small interface**. Terrain creation comes first. Avoid turning the toolbar into a general illustration application or simulation dashboard.

User decisions already implemented:

- Small set of procedural starting shapes, including completely flat grass.
- Actual Small/Medium/Large editable grid sizes.
- Inkarnate-style W/S brush sizing; Smooth uses Q to avoid the S conflict.
- Opacity and a compact cartographic brush set.
- Creation in a full-workspace 2D or 3D mode, with tools available in both.
- Collapsible, resizable toolbox and persistent light/dark UI preferences.
- Explicit eraser and visually distinct tool icons.
- Brush footprint and material choices must not secretly select another tool.
- Coastline is a painting/sculpting footprint; **Land** is the explicit land addition/removal tool.
- Forest Scatter was removed and replaced by Hard Round.
- General Drawing and Details creation tools were removed completely from the UI, shortcuts, settings, and creation handlers.
- Old drawings and landmarks must survive loading, rendering, export, and saving.
- Path and River are focused tools, not a reason to restore the general Drawing menu.
- Storytelling is deferred until the terrain tools are complete.

Do not restore Drawing, Details, Forest Scatter, the old preview thumbnail, or preset-driven tool switching merely because legacy rendering modules or historical tests exist.

## 3. Delivered feature inventory

### World creation

New world opens a modal with six preview cards:

| Internal ID | Label | Behavior |
| --- | --- | --- |
| `island` | Island | Organic island using radial/coast masks and seeded noise |
| `archipelago` | Archipelago | Multiple separated islands |
| `continent` | Continent | Broader land mass |
| `atoll` | Atoll | Elevated ring surrounding a flooded center |
| `blank` | Open ocean | Uniform height 30 |
| `flat` | Flat grass | Uniform height 80; no elevation noise, unaffected by seed/relief |

Grid size is real data resolution, not a zoom preset:

| Size | Side length N | Height/paint cell count |
| --- | ---: | ---: |
| Small | 128 | 16,384 |
| Medium | 192 | 36,864 |
| Large | 256 | 65,536 |

Large preserves the original application size and is the initial New world selection. Old projects lacking `size` default to 256. Generation can run at other resolutions internally for preview/tests, but normal application project loading accepts only 128, 192, and 256.

Additional modal fields:

- World name: required by the form, maximum 80 characters; initial value `Untitled Island`.
- Seed under Advanced generation: default 42, UI bounds −999,999,999 through 999,999,999; reroll chooses an integer below 1,000,000.
- Relief: UI 40–140, divided by 100 for the generator; initial 100. Labels: Gentle below 70, Dramatic above 115, Natural otherwise.
- Non-flat/non-ocean generation clamps heights to 10–250. Relief scales land elevation above the baseline sea height 62.

Committing a new world creates one undo snapshot, clears paint, routes, legacy marks and drawings, restores default layer flags, sets sea level 62, enables Water and Hill shading, resets 2D/3D camera positioning, and refreshes size-dependent buffers/labels. Tool, view, grid, and contour choices are not all reset as project data. Canceling/reopening the dialog must not accidentally generate a world. Opening it cancels an unfinished route.

### Toolbar and shortcuts

There are **10 creation/navigation tools**, grouped as follows:

| Group | Tool | Internal ID | Shortcut | Main effect |
| --- | --- | --- | --- | --- |
| Terrain | Raise | `raise` | R | Increase elevation locally |
| Terrain | Lower | `lower` | L | Decrease elevation locally |
| Terrain | Smooth | `smooth` | Q | Move toward a local 5×5 mean |
| Terrain | Flatten | `flatten` | F | Converge toward target height |
| Terrain | River | `river` | V | Preview/commit a carved river and local water |
| Terrain | Land | `land` | C; M alias | Add land; Shift removes land |
| Surface | Path | `path` | J | Preview/commit a material trail |
| Surface | Paint | `paint` | P; B alias | Paint the selected material |
| Surface | Erase | `erase` | E | Erase the selected eligible target |
| Navigate | Pan | `pan` | H | Pan the map/camera |

D and T no longer select tools. There is no general Drawing or Details panel.

Global editing controls:

| Input | Behavior |
| --- | --- |
| W / S | Increase/decrease brush diameter by 1; for Path/River, change route width instead |
| Shift + W / S | Increase/decrease by 10 |
| Shift + wheel | Increase/decrease brush or route width by 1 according to scroll direction |
| Wheel | Zoom |
| Left drag | Apply the selected brush, or add route control points while a route is active |
| Middle drag | Pan in 2D/3D, including while a route preview exists |
| Right drag or Alt + drag in 3D | Orbit/tilt |
| Ctrl/Cmd + Z | Undo; if a route draft exists, cancel the draft first without consuming history |
| Ctrl/Cmd + Shift + Z | Redo; draft cancellation takes precedence |
| Ctrl/Cmd + S | Download editable project JSON |
| Enter | Finish a route draft |
| Double-click | Finish a route while a route tool is active |
| Escape | Cancel route preview or stop the current gesture |

Global shortcuts are suppressed while typing in inputs/textareas/selects/contenteditable elements or while a dialog is open. Route point placement focuses the canvas so Enter works after placing points. Shift reverses Raise/Lower and removes Land; it erases surface paint while painting. Smooth and Flatten do not reverse under Shift.

### Brush and terrain-palette contract

Tool action, brush footprint, and material are separate choices. Selecting a brush or material preserves the active tool. Changing tools preserves the chosen footprint. Clicking Sand while Raise is selected chooses the future paint material; it does not activate Paint. Use P/B or the Paint button to paint.

Brush controls in the ordinary brush workflow:

| Control | UI bounds | Initial value |
| --- | --- | --- |
| Size / diameter | 4–120 | 42 |
| Opacity | 0–100% | 100% |
| Sculpt strength | 1–100% | 35% |
| Flatten target | 1–255 | 120 |
| Preserve map edges | Boolean | Enabled |

Footprints:

- **Soft Round:** radial `(1 − d²)²`, where d is distance/radius.
- **Hard Round:** full coverage within a circular edge.
- **Coastline:** irregular angular boundary with a sharper interior feather; works with Sand and every other paint material without changing elevation in Paint mode.
- **Grain:** radial soft weight multiplied by deterministic stippling; useful for textured soil, stone, and vegetation color.

Sculpt tools also consume the selected footprint. Land always uses its own coastline operation; irrelevant footprint controls are disabled for Land. Pan and non-surface legacy erasing also disable irrelevant controls. Route tools hide ordinary brush/palette controls and expose their focused settings instead; Path retains the shared paint-opacity control.

Materials use IDs 1–6; 0 means no material marker:

| ID | Material | Swatch hex | Actual paint RGB |
| --- | --- | --- | --- |
| 1 | Grass | `#728958` | `[111,143,79]` |
| 2 | Sand | `#c1ad7f` | `[193,173,127]` |
| 3 | Stone | `#85877c` | `[133,135,124]` |
| 4 | Forest | `#355e43` | `[53,94,67]` |
| 5 | Snow | `#dde2d7` | `[221,226,215]` |
| 6 | Dirt | `#89704f` | `[137,112,79]` |

Forest is a terrain color, not a tree scatter brush. Rendered terrain also receives automatic elevation colors, grain, optional hill shading, and contours. Painting underwater remains concealed by enabled water rendering. Biomes is a visualization, not Minecraft biome metadata.

Paint stores blended RGB and alpha separately from the material marker. Within one held paint gesture, maximum cell coverage is tracked against the pre-stroke state so repeated pointer samples do not multiply opacity. Separate strokes build opacity. The material marker does not fully describe mixed color; do not reconstruct v3/v4 paint solely from `paint` IDs.

### Sculpt behavior and edge protection

All edited elevation is clamped to 0–255. Raise/Lower use weighted additive strength. Smooth reads a copy of pre-dab heights before sampling neighbors. Flatten converges toward the target instead of setting every touched cell instantly.

Flatten's Preserve map edges option holds the outer row and column fixed and feathers the effect over four cells using the minimum distance to the edges. This fixes the reported apparent 3D map shrinkage: changing rim Z values moved the projected outline even though world X/Y dimensions stayed fixed. Unchecking the option intentionally allows rim edits. This protection belongs to Flatten; it is not a universal border lock for all tools.

Land converges upward toward sea +22 or, under Shift, downward toward sea −18, with targets clamped to 0–255. It only changes cells on the appropriate side of its target. It does not apply the selected paint material.

### Path and River route workflow

1. Select Path (J) or River (V).
2. Click source/control points, or drag to add them. A smoothed width ribbon, dashed centerline, and point handles preview the route.
3. Adjust settings in the route panel; the collapsed rail's Settings button exposes it.
4. Finish using Enter, double-click, or the on-map Finish route button.
5. Escape or Cancel discards the preview. Changing tools or 2D/3D view also cancels it.

An unfinished route does not mutate project terrain/paint or enter saved route data. One committed route is one undo group. One point or a route shorter than one map unit cannot commit. Margin clicks outside the actual world must not create empty drafts. Middle-drag must pan rather than add points. Undo during a held route gesture must clear pointer state; route tools are explicitly prevented from falling through to sculpting.

| Route option | Bounds/default | Notes |
| --- | --- | --- |
| Width | 2–32 blocks; default 8 | Full width, not radius; W/S and Shift+wheel apply |
| Path surface | Dirt ID 6 default; Stone 3; Sand 2 | Independent of ordinary Paint palette |
| Path opacity | Shared 0–100% control | Zero-opacity finish cancels without edits |
| River depth | 1–16 blocks; default 4 | Bed-depth parameter; softened banks |
| River opacity | Fixed 1 internally | No river opacity slider |

**Path:** rasterizes material color into the ordinary paint arrays with a feathered edge and one coverage value per cell. Does not change heights. The sampled route record is retained, but its visible result is baked surface paint, not a separate editable vector layer. Surface erasing removes path paint. It does not automatically remove the stored Path record.

**River:** samples a non-rising source-to-mouth water profile from the terrain at creation. For each sampled point, `level = max(0, min(previousLevel, nearestGroundHeight − 0.5))`, starting with previousLevel 255. Constant levels are allowed on flat terrain. Start upstream and proceed downstream. A route crossing uphill terrain cuts through it rather than raising global water or simulating a new flow direction.

River footprint rasterization:

- Radius is width/2.
- For normalized distance d, target bed is `level − depth × (0.25 + 0.75 × max(0, 1 − d²))`.
- Full carving weight inside d≤1; bank weight tapers to zero at d=1.5.
- Carving only lowers terrain and never goes below 0.
- Local water exists inside d≤1. Multiple rivers combine by maximum local water level.
- Ocean sea level is unchanged. Water off reveals the carved bed. Hiding River water hides local river water, not the carved channel or global ocean.

This is authored terrain, not fluid simulation or a hydrological solver. Profiles stay fixed after commit and do not rerun automatically after later sculpting. Junctions/intersections are not physically solved. Finished route control points cannot yet be repositioned.

Limits are enforced for generated and imported route data:

| Limit | Value |
| --- | ---: |
| Draft control points | 512 |
| Sampled points per saved route | 2–4,096 |
| Saved routes per project | 64, including both types |
| Total saved route points | 32,768 |
| Estimated raster work per route | 8,000,000 |
| Estimated raster work per project | 32,000,000 |

The work estimate is `(1 + sum(max(1, ceil(segmentLength × 2)))) × (ceil(width × 1.5) + 3)²`. Point-count limits alone are insufficient: imported wide zigzags with distant consecutive points previously allowed billions of raster operations. Preserve the work-budget checks in `validRoute`, normalization, and commit.

## 4. Layers, erasing, views, and UI state

New empty projects show Surface and Relief. River water appears only when a River record exists. Legacy Landmarks and Drawings appear only when their corresponding arrays are nonempty. Layer count is derived, not hardcoded.

| Data/layer | Visibility and lock effects |
| --- | --- |
| Surface | Controls painted color visibility and surface editing, including Path |
| Relief / `elevation` | Controls hill shading/contours and sculpt editing; does not remove the terrain geometry |
| River water / `rivers` | Controls local river water and river editing; river creation also requires visible/unlocked Relief |
| Legacy Landmarks | Controls old symbols, their export/rendering, and eligible object erasing |
| Legacy Drawings | Controls old drawings, their export/rendering, and eligible object erasing |

Eraser targets are conditional:

- Surface paint always exists; alpha is reduced and natural terrain shows through. Heights remain unchanged.
- River water exists only with rivers; whole touched river water records are removed while the carved bed stays. Undo restores the record.
- Legacy landmark/drawing targets exist only with old content; erase removes whole touched objects, not partial bitmap pixels.

Hidden/locked targets are protected. Object erasing uses full object removal independent of the paint-opacity slider. When the final object disappears, reconcile conditional target options after the gesture ends, never midway through interpolation. Target, hint, description, opacity enabled state, and footprint enabled state must agree. These transitions have regression tests.

Views: Terrain, Heightmap, and Biomes. Additional toggles: grid, contours, Water, and Hill shading. Sea level UI range is 10–150, initially 62. Heightmap visualization/export uses actual bed elevations; it does not fill river/ocean surfaces into the heightmap.

### Layout and appearance

- Expanded toolbox preference: default 228px; stored width clamps to 180–360px.
- Effective width also clamps against the viewport to retain canvas space; on narrow screens it can be below the stored minimum, with an absolute 128px floor.
- Width calculation: `max(128, min(preferred, 360, viewport − reserve))`, where reserve is 180 at viewport≤800, 470 at viewport≤1100, otherwise 510.
- Collapsed rail: 64px track; 40px-tall tool buttons; 28px icons. Groups remain separated.
- Expanded buttons: 48px tall. Groups use two columns normally, one column in a sidebar container≤210px.
- Right panel width: 260px, or 220px at viewport≤1100; small-screen behavior is controlled by CSS and the panel toggle.
- Collapsed Settings opens a scrollable flyout. Escape/outside pointer closes it.
- Divider supports pointer resizing, arrows by 10px, Shift+arrows by 40px, Home/End to current bounds.
- New visitors below 800px default to collapsed. Saved preferences take precedence.
- Light and dark modes are persistent. The toggle label names the destination mode.

## 5. Iconography and accessibility specification

Toolbar icons are original inline SVG from `icons.mjs`, with a common 24×24 viewBox, stroke width 1.9, rounded caps/joins, restrained 20% fills, and 28px display size. Do not distinguish actions only through arrow direction or color.

| Tool | Visual concept |
| --- | --- |
| Raise | Peak with addition mark |
| Lower | Excavated basin with removal mark |
| Smooth | Sanding block |
| Flatten | Spirit level |
| River | Winding banks/flow |
| Land | Land shape over shoreline/wave |
| Path | Paired curved route edges |
| Paint | Paintbrush |
| Erase | Eraser |
| Pan | Hand |
| Settings | Sliders, using the same icon factory |

Group labels, separators, accessible button names, shortcut hints, native tooltips, pressed states, and a selected-edge marker supplement the icons. The SVG itself is decorative (`aria-hidden`, not separately focusable). Do not bring back the old tool-specific icon scaling or a special Erase color treatment that makes it look like a different family.

Semantic color tokens live in `theme.css`, loaded after `style.css`. Key pairs:

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

Automated palette tests check normal text≥4.5:1 and essential tested control/focus pairs≥3:1. Recorded lowest ordinary UI text pairs: dark 5.03:1, light 4.98:1. See [contrast audit](docs/contrast-audit.md) for scope and original measurements. Its Eraser-specific entry reflects the earlier special treatment; current toolbar Erase uses the common selected palette.

This is not a full WCAG conformance claim. Canvas alternatives, non-mouse authoring, screen-reader workflows, focus behavior, and general usability still need broader assessment. Disabled controls, terrain artwork, decorative separators, and preview colors are outside the palette-pair test. Live visual checks covered both themes, the narrow 180px expanded sidebar, and the collapsed rail.

## 6. Source architecture and data flow

This is a static, buildless HTML/CSS/ES-module application. No React, bundler, application backend, database, authentication, or runtime npm package is required. `jsdom` is test-only. Optional Google Fonts have system fallbacks when external fonts are blocked.

| File | Responsibility |
| --- | --- |
| `index.html` | Application shell, dialogs, grouped toolbar, canvases, forms, help copy |
| `style.css` | Original/base layout and component styles, including some obsolete selector definitions |
| `theme.css` | Semantic light/dark colors, responsive toolbox, grouping, route controls, later overrides |
| `app.mjs` | Browser state, events, history/autosave, terrain colors, routes UI, composition, rendering orchestration, import/export |
| `terrain.mjs` | Deterministic generation and bounded sculpt strokes |
| `brushes.mjs` | Material table, deterministic grain, footprint weights, alpha compositing, Land operation |
| `routes.mjs` | Curve sampling, validation/work budgeting, path/channel rasterization, local river field, hit testing, effective surface |
| `terrain3d.mjs` | Projection, CPU rendering, sampling, full-grid picking, frame scheduler |
| `gpu-terrain.mjs` | WebGL mesh/buffers, shader program, texture and legacy billboard batches |
| `editor.mjs` | Project normalization/migration, default layers, sizing shortcuts |
| `ui.mjs` | Persistent theme/sidebar preferences, resize/collapse/flyout handlers |
| `icons.mjs` | Tool/settings SVG family |
| `shapes.mjs` | Validation/rendering/hit-compatible geometry helpers for legacy drawings; not a live Drawing tool |
| `landmarks.mjs` | Original legacy symbol rendering and cached atlas |
| `eraser.mjs` | Legacy drawing hit testing |
| `contrast.mjs` | Color parsing/luminance/contrast utilities for audit tests |
| `tests/` | Node unit and jsdom interaction tests |
| `.nojekyll` | Prevents Pages/Jekyll processing |
| `package.json`, `package-lock.json` | Test dependency and reproducible installation |

### Runtime arrays

All map cell arrays use row-major indexing `i = y × N + x`; world coordinates are X/Y internally, while the UI labels horizontal map coordinates X/Z. Elevation is the vertical height.

| Runtime value | Type/size | Purpose |
| --- | --- | --- |
| `heights` | Float32Array N² | Authoritative terrain/river bed |
| `paint` | Uint8Array N² | Material markers 0–6 |
| `paintColors` | Uint8ClampedArray 3N² | Blended RGB |
| `paintAlpha` | Float32Array N² | Paint coverage 0–1 |
| `riverWater` | Float32Array N² | Derived local river levels; −1 means no local river |
| `surfaceHeights` | Float32Array N² or reference to heights | Derived local-water geometry used for display/picking |
| `routes` | Array | Committed Path/River records |
| `marks`, `drawings` | Arrays | Preserved legacy content |
| `routeDraft`, `routeHover` | Transient objects | Uncommitted route controls/preview |

Data flow:

1. An authorized gesture checks visibility/locks and captures the appropriate undo snapshot.
2. Brushes edit heights/paint. Route drafts only preview; finishing rasterizes once and appends a record.
3. `refresh()` marks texture and scene dirty and requests a coalesced animation frame.
4. `flushTexture()` rebuilds local river water when dirty and derives `surfaceHeights = max(heights, localWater)` while Water is enabled.
5. Texture colors use actual heights/paint plus visible water. Contour treatment skips visible local water.
6. GPU and Canvas renderers, 3D sampling, and picking consume the same effective local-water surface; global enabled ocean water is then clamped to sea level by the rendering/sampling functions.
7. Save/history stores authoritative data, not derived caches or temporary drafts.

Keep effective water geometry consistent across rendering, cursor projection, and picking. A river that is colored correctly but picked at the bed is a bug.

### Rendering implementation and compute limits

- 2D map texture is a canvas at N×N; the map workspace draws/scales it with legacy overlays and optional grid.
- `combined` is a cached 1024×1024 texture composition; scale is 1024/N, not a fixed four.
- WebGL uses an indexed full-resolution terrain mesh with 8 floats per vertex and Uint16 indices. It rebuilds the mesh when size changes.
- Triangle count is `2 × (N − 1)²`: Small 32,258; Medium 72,962; Large 130,050.
- Maximum supported N=256 fits 65,536 vertices in Uint16 index space. Larger sizes require a deliberate index/mesh/performance redesign; changing one size selector is insufficient.
- Camera motion updates uniforms rather than rebuilding terrain triangle paths. Content edits update height buffers and cached texture. Legacy landmarks use a batched billboard atlas.
- CPU fallback sorts projected cells and draws a coarser step-3 mesh, using step 6 while orbiting and restoring detail on release. Cached landmark bitmaps avoid regenerating symbols.
- Picking traverses heightfield cells and intersects the underlying full-grid triangles front-to-back, including narrow peaks and enabled water. The coarsened CPU drawing is an approximation of that field; it is not identical to every coarse visible fallback triangle.
- Legacy drawings are texture-composited for GPU rendering and projected as vector paths for the Canvas fallback.
- Pixel ratio is capped at 2. Frame requests are coalesced. The HUD identifies GPU/Canvas and reports a smoothed interaction rate, not a guaranteed frame rate.

Camera defaults: yaw −0.65 radians, pitch 0.65, zoom 1. 3D pitch clamps to 0.18–1.15; zoom to 0.5–3. 2D zoom clamps to 0.4–4. New world and Reset view recenter appropriately; orbiting/panning does not mutate project data. Context loss switches to Canvas; restoration permits WebGL recreation.

Cloud-browser live checks used the Canvas fallback because that browser did not provide WebGL. Earlier shader validation and code tests are not a substitute for testing final GPU behavior on a real GPU-enabled browser.

## 7. Editable project schema and compatibility

Project downloads are JSON named `<sanitized-world-name>.world.json`. The UI's Save project action downloads data and schedules autosave. This is not a WorldPainter desktop `.world` format.

Current normalized object shape (descriptive TypeScript, not a separate runtime dependency):

```ts
type LayerState = { visible: boolean; locked: boolean };
type XY = { x: number; y: number };
type LegacyLandmark = {
  type: 'tree' | 'mountain' | 'town';
  x: number; y: number; size: number; opacity: number;
};
type LegacyShape = {
  type: 'freehand' | 'line' | 'rectangle' | 'ellipse' | 'triangle';
  x1: number; y1: number; x2: number; y2: number;
  color: string; width: number; opacity: number; filled: boolean;
  points: XY[];
};
type PathRoute = {
  type: 'path'; width: number; opacity: number; material: 2 | 3 | 6;
  points: XY[];
};
type RiverRoute = {
  type: 'river'; width: number; opacity: number; depth: number;
  points: (XY & { level: number })[];
};
type ProjectV4 = {
  version: 4;
  size: 128 | 192 | 256;
  name: string;
  heights: number[];      // N² finite values, 0..255
  paint: number[];        // N² integer values, 0..6
  paintColors: number[];  // 3N² integer values, 0..255
  paintAlpha: number[];   // N² finite values, 0..1
  sea: number;            // finite, 10..150
  water: boolean;
  shade: boolean;
  routes: (PathRoute | RiverRoute)[];
  marks: LegacyLandmark[];
  shapes: LegacyShape[];
  layers: {
    surface: LayerState;
    landmarks: LayerState;
    shapes: LayerState;
    elevation: LayerState;
    rivers: LayerState;
  };
};
```

Schema notes:

- All saved routes use sampled geometry, not the original interactive control points. River points carry fixed local levels.
- Route coordinates must be finite and within 0..N−1. River levels must be finite 0..255 and non-increasing. Route opacity is validated 0..1; newly authored rivers use 1.
- Every default layer is visible and unlocked, including conditional legacy/river layers that may not have a visible UI row yet.
- Legacy landmarks support `tree`, `mountain`, `town`; up to 3,000 records, positions in the map, size 2–40, opacity 0–1 (default 1).
- Legacy shapes support `freehand`, `line`, `rectangle`, `ellipse`, `triangle`; up to 500 shapes, 1,000 points per shape, 100,000 total points. Geometry is bounded; colors must be six-digit hex, width 0.25–12, opacity 0–1, and fill Boolean. Freehand needs at least two points. See `validShape` for endpoint fields.
- `normalizeProject` accepts versions 1, 2, 3, and 4 and returns v4. Missing optional legacy/routes arrays become empty. Missing size defaults to 256 for application loads.
- v1/v2 paint IDs migrate to material RGB and alpha 1 for painted cells, 0 otherwise. v3/v4 require explicit paint RGB/alpha arrays.
- Names normalize to a string and truncate to 80 characters. Missing water/shade normalize enabled unless explicitly false. Invalid layer flags are rejected.
- Internal test helpers may supply explicit smaller N to normalization; that does not expand supported application sizes.
- Import validates before replacing the active project or snapshotting it. Invalid JSON/data must preserve the current project and redo history.
- Image heightmap import is resampled to the current N×N; luminance is `0.2126 R + 0.7152 G + 0.0722 B`. It clears paint, routes, and legacy content, without selecting a new grid size.
- File import rejects files larger than 12,000,000 bytes. JSON dispatch currently uses a case-sensitive `.json` filename suffix.

`state()` rounds saved height values to three decimals and paint alpha to four. Route geometry/levels are cloned, not rounded by that function. Loading restores typed arrays and rebuilds derived caches. Do not reapply route paint/carving during load: it is already present in saved paint/heights.

## 8. Persistence, history, and exports

### Browser persistence

| Key | Contents |
| --- | --- |
| `worldpainter-project` | Current v4 project JSON; name retained for existing-user compatibility |
| `landwright-ui` | `{ theme: 'dark'|'light', sidebarWidth: number, collapsed: boolean }` |

Autosave is debounced by 600ms. Storage failure produces a save-to-file message rather than silently claiming success. Data is origin/browser-specific. Moving to another URL/origin will not migrate local storage; provide a downloaded project first. There is no cloud sync or account recovery.

The following are not part of the project snapshot: undo/redo stacks, current tool/material/footprint, brush/route setting sliders, workspace mode, camera, zoom/pan, visualization mode, grid/contours, generation seed/shape/relief metadata, and unfinished route draft. Theme/sidebar preferences are stored separately. Generation is reproducible by seed/options, but those options are not persisted as a reconstructive project recipe.

Undo retains up to 35 complete project snapshots in memory. Starting an edit clears redo. Route finishing is atomic; name typing forms a focus-session undo group. Undo/redo restores size-dependent buffers and route water. Undo with a draft cancels it first, including held-pointer state. A stopped ordinary brush stroke is not automatically rolled back by Escape; route cancellation is distinct from undoing an already applied brush.

### Exports

| Export | Dimensions | Content |
| --- | --- | --- |
| Editable project | JSON | Authoritative arrays, route records, legacy content, layers, world settings |
| Map PNG | 1536×1536 | Top-down current visualization, visible paint/water/legacy overlays |
| Heightmap PNG | N×N, 8-bit grayscale | Rounded/clamped actual heights/river bed, no local/ocean water fill |

Map export is not a screenshot of the 3D orbit. It omits grid, cursor, route draft, point handles, selection/tool UI, compass, labels, and HUD. World size changes export scaling to 1536/N. Respect layer visibility and Heightmap visualization when composing legacy overlays. Filenames use `-map.png` or `-heightmap.png` after the sanitized world name.

## 9. Development, verification, and deployment

### Local setup

Use a current Node.js runtime with ES modules, built-in test runner, and `structuredClone`; the environment used Node 24. The package currently declares no explicit engine floor. Keep dependencies locked through `package-lock.json`.

```bash
git clone https://github.com/mopajazz/worldpainter-studio.git
cd worldpainter-studio
npm ci
npm test
python3 -m http.server 8000
```

Open `http://localhost:8000/`. Serve over HTTP rather than opening `index.html` directly as a file. There is no build command. `node_modules/` is ignored and not needed to run the deployed app.

### Test suite

At the implementation baseline, **89 tests pass**. The full suite was rerun during this handoff task on November 17, 2026: **89 passed, 0 failed**. Main test responsibilities:

| Test file | Coverage |
| --- | --- |
| `terrain.test.mjs` | Determinism, sculpt bounds/effects, Flatten rim protection, Flat grass, selected sculpt footprint |
| `expansion.test.mjs` | Distinct procedural shapes, atoll topology, relief, separated archipelago islands |
| `brushes.test.mjs` | Hard Round coverage/edge |
| `cartography.test.mjs` | Alpha compositing, coastline behavior, shape geometry validation/projection |
| `editor.test.mjs` | Shortcuts, migration, malformed project rejection, route profiles and shared work budget |
| `eraser.test.mjs` | Legacy drawing hit testing, filled/unfilled boundaries |
| `terrain3d.test.mjs` | Projection/picking, water/occlusion/narrow peaks, size variants, scheduler |
| `routes.test.mjs` | Curve bounds, continuous path paint, local water/carving, uphill profile, effective-surface picking, workload rejection |
| `interactions.test.mjs` | Actual DOM/event/history/import logic for paint/erase/tools/sidebar/themes/routes/locks/cancel/undo and legacy compatibility |
| `ui.test.mjs` | Preference normalization and responsive sidebar width bounds |
| `contrast.test.mjs` | Actual theme-token color-pair thresholds |
| `assets.test.mjs` | Consistent entry stylesheet/module cache revisions |

Interaction tests use jsdom and stub canvas drawing because jsdom does not implement browser rasterization. They verify real application data/event behavior, not PNG encoding, GPU pixels, native accessibility usability, or subjective icon recognition.

Useful checks:

```bash
npm test
node --check app.mjs
node --check routes.mjs
node --check editor.mjs
node --check gpu-terrain.mjs
git diff --check
```

Manual smoke checks before a feature release:

1. New Flat grass at each size; save/import and undo back to the previous size.
2. Paint → Coastline → Sand; confirm Paint remains selected and heights unchanged.
3. Raise/Lower/Smooth/Flatten and Land near edges; verify Flatten rim opt-out.
4. Path click/drag preview, each material, width/opacity, Enter/double-click/Finish, Escape, and one-point no-op.
5. River above sea level, uphill cut, width/depth, Water off/on, river layer visibility/lock, river-water erase with bed preserved, undo.
6. Repeat route creation in 3D; orbit/pan, route while middle-panning, picking at the water surface.
7. Undo during a held route drag; continue moving and confirm no sculpt fallthrough.
8. Margin-to-world route drag; confirm no exception/empty draft.
9. Import malformed routes and work-budget extremes; active project and history must remain intact.
10. Both themes, collapsed rail, 180px expanded sidebar, short/small viewports, settings flyout, route Finish/Cancel bar.
11. Map/heightmap PNGs and legacy overlay visibility; real browser output, not only test stubs.
12. GPU-enabled browser plus Canvas fallback; do not infer GPU performance from the cloud fallback.

### GitHub Pages release process

The verified Pages configuration is source `main:/`, build type `legacy`. There is no checked-in `.github/workflows` directory at this baseline. GitHub creates the Pages build/deployment run. Do not assume a custom build workflow or npm build step exists.

Before release:

- Inspect `git status` and preserve unrelated user edits.
- Run appropriate tests and syntax/diff checks.
- Review renderer/picking and project migration when changing terrain data.
- Bump the query cache revision consistently in the `index.html` stylesheet/script URLs and all local ES-module imports. Baseline is `?v=2.0.1`. Do not update only the entry script or only CSS.
- Update displayed footer version when appropriate; displayed release and cache-patch revision may differ intentionally.
- Check documentation and shortcut help against implemented handlers.

Example for the current checkout (use your actual remote name in another clone):

```bash
git add <reviewed-files>
git commit -m "Describe the concrete change"
git push github HEAD:main
gh run list --repo mopajazz/worldpainter-studio --limit 3
gh run watch <run-id> --repo mopajazz/worldpainter-studio --exit-status
```

Verify the exact release is deployed, then reload the live page and exercise the changed flow. A successful push alone is not deployment verification. If authorization/network/tool availability changes in a new environment, resolve that access normally; do not store tokens in project files.

For rollback, inspect the relevant history, revert the faulty commit(s), rerun checks, push, and verify Pages. Preserve project format compatibility or document any rollback implications for newly saved v4 files.

### Useful implementation history

| Commit | Milestone |
| --- | --- |
| `bf38fdb` | Landwright branding, themes, adaptive toolbox, protected Flatten boundary |
| `79e1b3a` | Flat grass and actual selectable grid dimensions |
| `152c316` | Independent footprints/materials, Hard Round, stable paint toolbox |
| `0b378ce` | Drawing/Details removal and conditional legacy layers |
| `351e4c5` | New silhouette family and tool grouping |
| `9c6697e` | Narrow expanded sidebar stacking |
| `dd01447` | Path/River implementation and local water |
| `1010122` | Focused route settings and route cursor cleanup; current code baseline |

## 10. Known limitations and follow-up candidates

These are implementation facts or review targets, not promises of completed work:

1. **No finished-route point editing.** Saved geometry is sampled. Width, surface, depth, or control-point changes after committing require undo/recreation or future route-editing work.
2. **Baked Path paint.** Surface erasing/overpainting does not remove its route record. Such records still count against route/point/work limits. A route manager or explicit record cleanup is a possible follow-up.
3. **Authored river approximation.** Water profile is fixed, junctions use max levels, and there is no physical flow, erosion simulation, automatic watershed/source detection, or recomputation after sculpting.
4. **River erasing retains the channel.** Removing water is not restoring pre-carve terrain. Undo the original commit for atomic bed-and-water rollback.
5. **Performance limits are estimates.** Very complex valid scenes can still be slow, especially on Canvas fallback. Full-grid picking and coarse fallback drawing can visually differ around small features.
6. **Desktop-first editing.** Pointer events and Orbit affordances exist, but touch/mobile usability and comprehensive accessibility have not been fully audited.
7. **No complete WCAG claim.** Tested colors are only one accessibility dimension.
8. **Browser-local persistence.** No server backups, collaboration, multi-project library, accounts, or cloud sync. Storage quota is finite; project downloads remain important.
9. **No Minecraft output.** No desktop WorldPainter `.world` import, region files, schematic export, or Minecraft biome metadata. Biomes is a visual map view.
10. **No WorldBox simulation.** No civilizations, agents, ecosystems, or time simulation.
11. **Old style selectors remain.** Base/theme CSS contains obsolete legacy tool selectors and historical overrides. Clean them deliberately if refactoring, with narrow/collapsed visual verification.
12. **Documentation can drift.** Historical development notes and test names may refer to earlier schemas/tools. Use current handlers/validators and this baseline specification rather than reintroducing removed functionality.

Protect the fixes already covered by regression tests: no preset-driven tool switching, correct opacity per stroke, frozen Flatten perimeter by default, no edge-shrink reinterpretation, frame-coalesced rendering, real 3D picking, safe draft cancellation, no route→sculpt fallthrough, correct middle-pan ordering, and delayed conditional eraser-target reconciliation.

## 11. Holler Maps assets — exact status

**Not integrated. The source library has not been located in the accessible execution workspace.**

The user supplied this Windows location:

```text
C:\Users\j.warren\Documents\PERSONAL\holler-maps
```

They also said some assets are in the ChatGPT Library and shared inline reference images: a cartographer's compendium, foliage/tree variants, cliffs/rock forms, and road-like marks. Seeing those images in chat is not equivalent to receiving downloadable source assets with filenames/metadata. The cloud execution workspace does not have access to that Windows path or general ChatGPT Library contents.

Earlier accessible workspace/library/repository searches did not establish an exact Holler Maps source set. Do not claim the library was found, imported, licensed, or implemented as drag-and-drop. The existing original legacy symbol atlas is not that library.

Practical next step: receive a ZIP of the folder or a reachable source repository/download. Inventory real files, dimensions, alpha/backgrounds, categories, duplicates, ownership/license information, and desired placement behavior before designing integration. The user previously requested confirmation that the exact assets were found before that integration step. Honor that requirement.

The earlier idea to rename Details to Assets/Objects and assign O was superseded by the later explicit removal of Details. There is currently no Objects/O tool or drag-and-drop asset browser. Any future asset interface should be discussed as a focused addition and must not silently restore the crowded removed menu.

## 12. Storytelling — deferred product topic

The user explicitly wants a storytelling component **after terrain tools are complete**, and asked to revisit it later. There is no narrative/quest/timeline/character/AI subsystem implemented or specified beyond that intent.

Possible future anchors include named locations, paths, rivers, and settlements, but these are ideas only. Before building, revisit desired audience, story structure, location linking, authoring/export, and persistence requirements with the user. Do not add narrative UI, AI service dependencies, or accounts as an assumed next step.

## 13. Quick continuation checklist

- Read this handoff, `README.md`, `docs/terrain-roadmap.md`, and the files touched by the requested change.
- Verify current Git status, branch, commit, and tests; do not assume this dated baseline is still HEAD.
- Keep the static deployment and existing hosting origin unless instructed otherwise.
- Preserve v1–v4 imports and existing user content; validate before mutation.
- Keep terrain, local-water rendering, and picking synchronized.
- Keep Path/River gesture state separate from sculpt brushes and from committed data.
- Keep icons/groups consistent and paint selections independent.
- Test meaningful behavior, review the result, verify deployment, and report real limitations plainly.
- Reconfirm source availability before Holler Maps integration; revisit storytelling only at the appropriate phase.
