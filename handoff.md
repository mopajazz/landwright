# Landwright — engineering and product handoff

**Documentation date:** November 17, 2026 (America/New_York)<br>
**Implementation baseline:** v2.5.2 opacity keys and Shift erasing; previous release `1b2200a` (v2.5.1). See Git history and GitHub Pages for the release commit/deployment.
**Displayed release:** `v2.5.2`
**Browser asset/module cache revision:** `2.5.2`<br>
**Project schema written by the application:** `6`

§20 defines the current settlements/schema6 contracts and supersedes older statements that settlements are deferred. Sections 1–18 retain engineering context and release history; §19 defines the v2.4 woodland renderer and supersedes earlier forest rendering details. It distinguishes current behavior, compatibility support, known limitations, and deferred ideas. It is intended to let another developer or coding agent continue without relying on the chat history. Application behavior is defined by the source and tests; update this handoff whenever those contracts change.

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
- Living World begins with optional visual water/atmosphere effects, behind one World Settings toggle; additional life must preserve the compact toolbar.
- Maintain the tutorial and knowledge base with each feature. Teach low Strength before Raise/Lower: start around 5–10%, use short strokes, inspect, and increase gradually.

- The toolbox is contextual (v2.1). The always-visible paint palette was only a reaction to the old bug where choosing a material switched the tool; the user confirmed this. The palette now appears only with Paint, and the no-switching rule still holds.
- Opacity is a paint concept only. It applies to Paint (including Forest density), Path, surface Erase, and Forests Erase. Sculpt tools and Land ignore it (see §3).

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
| Ctrl/Cmd + S | Download editable project JSON (same as the header Download button) |
| Enter | Finish a route draft |
| Double-click | Finish a route while a route tool is active |
| Escape | Cancel route preview or stop the current gesture |

Global shortcuts are suppressed while typing in inputs/textareas/selects/contenteditable elements or while a dialog is open. Route point placement focuses the canvas so Enter works after placing points. Shift reverses Raise/Lower and removes Land; it erases surface paint while painting. Smooth and Flatten do not reverse under Shift.

### Brush and terrain-palette contract

Tool action, brush footprint, and material are separate choices. Selecting a brush or material preserves the active tool. Changing tools preserves the chosen footprint. The material palette (titled **Paint material**) is shown only while Paint is active; the selected material persists while hidden. Path keeps its own surface select.

Brush controls in the ordinary brush workflow:

| Control | UI bounds | Initial value |
| --- | --- | --- |
| Size / diameter | 4–120 blocks (map cells; UI shows "blocks") | 42 |
| Opacity | 0–100%; Paint, Path and surface Erase only | 100% |
| Sculpt strength | 1–100% | 35% |
| Flatten target | 1–255 | 120 |
| Preserve map edges | Boolean | Enabled |

Footprints:

- **Soft Round:** radial `(1 − d²)²`, where d is distance/radius.
- **Hard Round:** full coverage within a circular edge.
- **Coastline:** irregular angular boundary with a sharper interior feather; works with Sand and every other paint material without changing elevation in Paint mode.
- **Grain:** radial soft weight multiplied by deterministic stippling; useful for textured soil, stone, and vegetation color.

Toolbox order for brush tools: Brush settings (footprint) → Brush controls (Size, plus Opacity where it applies) → **Sculpt** (Strength; Flatten adds target and edge protection) → Paint material (Paint only) → Erase target (Erase only).

**Opacity scope (v2.1 fix):** `usesOpacity()` is true only for Paint, Path, and Erase on the surface target. The Opacity row is hidden for every other tool, and `opacity()` returns 1 for them. Before v2.1, sculpt strength was multiplied by Opacity (`strength × 3 × opacity`) and Land's rate used it too. That made Opacity a hidden second strength slider, and Opacity 0 left over from painting silently disabled Raise/Lower/Smooth/Flatten/Land. A regression test covers this. Zero opacity still makes Paint and surface Erase no-ops.

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
2. Click source/control points, or drag to add them. A smoothed width ribbon, dashed centerline, and point handles preview the route. The ribbon is filled with the chosen Path material colour (alpha scaled by opacity) or river blue, outlined in dark so it reads over stone and snow. Handles have dark rings. The footer hint reads "W/S route width" while a route tool is active.
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
| River taper | Boolean; default on for new rivers | Source-to-mouth radius growth; missing saved flag means uniform (§15) |
| River meander | 0–100%; default 25% | Deterministic, endpoint-pinned offset baked into sampled coordinates (§15) |

**Path:** rasterizes material color into the ordinary paint arrays with a feathered edge and one coverage value per cell. Does not change heights. The sampled route record is retained, but its visible result is baked surface paint, not a separate editable vector layer. Surface erasing removes path paint. It does not automatically remove the stored Path record.

**River:** samples a non-rising source-to-mouth water profile from the terrain at creation. For each sampled point, `level = max(0, min(previousLevel, nearestGroundHeight − 0.5))`, starting with previousLevel 255. Constant levels are allowed on flat terrain. Start upstream and proceed downstream. A route crossing uphill terrain cuts through it rather than raising global water or simulating a new flow direction.

River footprint rasterization:

- Untapered radius is width/2. Tapered radius is `max(0.75, width/2 × (0.25 + 0.75t))`, where t is normalized cumulative arc length; see §15.
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

Forests is a conditional layer whenever any saved density is nonzero; it can exist with no currently eligible trees. Forest Paint/Erase honors this layer, independently of Surface. See §18.

New empty projects show Surface and Relief. River water appears only when a River record exists. Legacy Landmarks and Drawings appear only when their corresponding arrays are nonempty. Layer count is derived, not hardcoded.

| Data/layer | Visibility and lock effects |
| --- | --- |
| Surface | Controls painted ground color visibility and surface editing, including Path |
| Forests / `forests` | Controls visible woodland and density editing; independent of Surface |
| Relief / `elevation` | Controls hill shading/contours and sculpt editing; does not remove the terrain geometry |
| River water / `rivers` | Controls local river water and river editing; river creation also requires visible/unlocked Relief |
| Legacy Landmarks | Controls old symbols, their export/rendering, and eligible object erasing |
| Legacy Drawings | Controls old drawings, their export/rendering, and eligible object erasing |

Eraser targets are conditional:

- Forests appears with nonzero saved density; opacity/footprint erasing thins or clears trees without changing ground.
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
- Header: the world-name badge (`#save-badge`) mirrors autosave: "Saving…", "Saved in browser", or "Not saved · download" on storage failure. The download button reads **Download** (aria-label "Download project file"; tooltip explains that autosave already happens). It shows text above 800px, icon-only below, and **remains visible at ≤500px**. Previously it was hidden on phones, leaving no export path.
- Grid and Contours are on/off toggles (`.toggle`, `aria-pressed`) with a dot indicator. They are deliberately styled differently from the Terrain/Heightmap/Biomes and 2D/3D choices, which use filled selected buttons.
- Selected tool: filled `--selected` background plus an inset accent ring, semibold label, and a 4px edge marker.
- Layer rows use inline SVG eye (visible/hidden) and padlock (locked/unlocked) icons in 32×32 targets. They replaced the ◉/○ and ▣/◇ glyphs. Undo/redo and zoom buttons have accessible names and at least 32px targets.
- New world shape cards use a 3×2 grid.
- No multi-world wording (v2.1.1). Each project is a single world, so the nav has no breadcrumb. The canvas chip reads **MAP** plus dimensions, and the World overview subtitle is "Custom terrain". Do not reintroduce "Overworld" or other dimension/world-hierarchy labels unless the product gains multiple worlds per project. The `.breadcrumb` rules left in `style.css`/`theme.css` are now unused (see item 11).

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
| `forests.mjs` | Density strokes, continuous procedural canopy, derived visual relief, cached texture patterns and route habitat masks |
| `living.mjs` | Wet-mask scene sampling, separate bounded atmosphere renderer, pausable 30Hz animation loop |
| `docs/tutorial.md`, `docs/kb/` | Beginner workflow and topic-based user documentation, linked in Help |
| `.agents/skills/landwright-development/` | Reusable development skill and portable handoff snapshot |
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
| `paint` | Uint8Array N² | Ground material markers 0–6; legacy Forest ID4 remains color |
| `forest` | Float32Array N² | Authoritative density 0–1; separate from paint |
| `forestTrees` | Derived array, ≤4,096 instances | Deterministic eligible trees, never serialized as legacy marks |
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

New downloads use v5; versions 1–4 migrate without automatically converting old Forest color to density.

Project downloads are JSON named `<sanitized-world-name>.world.json`. The UI's Download action (accessible name: Download project file) downloads data and schedules autosave. This is not a WorldPainter desktop `.world` format.

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
  taper?: boolean; // absent means uniform width for old v4 rivers
  points: (XY & { level: number })[];
};
type ProjectV5 = {
  version: 5;
  forest: number[];       // N² finite density values, 0..1
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
    forests: LayerState;
  };
};
```

Schema notes:

- All saved routes use sampled geometry, not the original interactive control points. River points carry fixed local levels.
- Route coordinates must be finite and within 0..N−1. River levels must be finite 0..255 and non-increasing. Route opacity is validated 0..1; newly authored rivers use 1.
- Every default layer is visible and unlocked, including conditional legacy/river layers that may not have a visible UI row yet.
- Legacy landmarks support `tree`, `mountain`, `town`; up to 3,000 records, positions in the map, size 2–40, opacity 0–1 (default 1).
- Legacy shapes support `freehand`, `line`, `rectangle`, `ellipse`, `triangle`; up to 500 shapes, 1,000 points per shape, 100,000 total points. Geometry is bounded; colors must be six-digit hex, width 0.25–12, opacity 0–1, and fill Boolean. Freehand needs at least two points. See `validShape` for endpoint fields.
- `normalizeProject` accepts versions 1, 2, 3, 4, and 5 and returns v5. v5 requires a valid N² density array. Earlier versions initialize zero density, keeping original ground colors/marks/drawings/routes. Missing Forests flags use visible/unlocked defaults. Missing optional legacy/routes arrays become empty. Missing size defaults to 256 for application loads.
- v1/v2 paint IDs migrate to material RGB and alpha 1 for painted cells, 0 otherwise. v3–v5 require explicit paint RGB/alpha arrays.
- Names normalize to a string and truncate to 80 characters. Missing water/shade normalize enabled unless explicitly false. Invalid layer flags are rejected.
- Internal test helpers may supply explicit smaller N to normalization; that does not expand supported application sizes.
- Import validates before replacing the active project or snapshotting it. Invalid JSON/data must preserve the current project and redo history.
- Image heightmap import is resampled to the current N×N; luminance is `0.2126 R + 0.7152 G + 0.0722 B`. It clears paint, forest density, routes, and legacy content, without selecting a new grid size.
- File import rejects files larger than 12,000,000 bytes. JSON dispatch currently uses a case-sensitive `.json` filename suffix.

`state()` rounds saved height values to three decimals, paint alpha and forest density to four. Route geometry/levels are cloned, not rounded by that function. Loading restores typed arrays and rebuilds derived caches. Do not reapply route paint/carving during load: it is already present in saved paint/heights.

## 8. Persistence, history, and exports

### Browser persistence

| Key | Contents |
| --- | --- |
| `worldpainter-project` | Current v5 project JSON; name retained for existing-user compatibility |
| `landwright-living` | `{ enabled: boolean, clouds: boolean, waterMotion: boolean, vegetationMotion: boolean }`; browser preferences only |
| `landwright-ui` | `{ theme: 'dark'|'light', sidebarWidth: number, collapsed: boolean }` |

Autosave is debounced by 600ms. Storage failure produces a save-to-file message rather than silently claiming success. Data is origin/browser-specific. Moving to another URL/origin will not migrate local storage; provide a downloaded project first. There is no cloud sync or account recovery.

The following are not part of the project snapshot: undo/redo stacks, current tool/material/footprint, brush/route setting sliders, workspace mode, camera, zoom/pan, visualization mode, grid/contours, generation seed/shape/relief metadata, and unfinished route draft. Theme/sidebar and Living World preferences are stored separately; Living World changes do not create undo entries or project autosaves. Generation is reproducible by seed/options, but those options are not persisted as a reconstructive project recipe.

Undo retains up to 35 complete project snapshots in memory. Starting an edit clears redo. Route finishing is atomic; name typing forms a focus-session undo group. Undo/redo restores size-dependent buffers and route water. Undo with a draft cancels it first, including held-pointer state. A stopped ordinary brush stroke is not automatically rolled back by Escape; route cancellation is distinct from undoing an already applied brush.

### Exports

| Export | Dimensions | Content |
| --- | --- | --- |
| Editable project | JSON | Authoritative arrays including forest density, route records, legacy content, layers, world settings |
| Map PNG | 1536×1536 | Top-down current visualization, visible paint/water/static forests/legacy overlays |
| Heightmap PNG | N×N, 8-bit grayscale | Rounded/clamped actual heights/river bed, no local/ocean water fill |

Map export is not a screenshot of the 3D orbit. It omits grid, cursor, route draft, point handles, selection/tool UI, compass, labels, HUD, and the Living World atmosphere overlay. World size changes export scaling to 1536/N. Respect layer visibility and Heightmap visualization when composing legacy overlays. Filenames use `-map.png` or `-heightmap.png` after the sanitized world name.

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

Current v2.4 verification: **123 passed, 0 failed** (see §19 for renderer contracts and checks).

At the v2.2 implementation baseline, **106 tests passed, 0 failed** on November 17, 2026. This includes river taper/meander/reflow and Living World lifecycle/data-isolation checks. Test counts are baseline evidence; rerun the suite against the actual checkout before claiming a new result.

Note: `interactions.test.mjs` compares whole project states with `deepEqual`. If such an assertion fails, Node's diff of 65k-element arrays can exhaust memory and the file dies with SIGKILL/heap OOM instead of a readable failure. When that happens, suspect a failing state assertion before suspecting the environment. Run the file alone with `node --test --test-reporter=spec tests/interactions.test.mjs` to see which test it was. Main test responsibilities:

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
| `living.test.mjs` | Wet-mask bounds, deterministic scene budget, immutable project data, loop pause/cancel/resume, bounded projected drawing |
| `living-interactions.test.mjs` | Queued-frame 2D stroke pause/resume regression |

Interaction tests use jsdom and stub canvas drawing because jsdom does not implement browser rasterization. They verify real application data/event behavior, not PNG encoding, GPU pixels, native accessibility usability, or subjective icon recognition.

Living World tests must use asynchronous/queued animation frames. Bind the loop to `document.defaultView.requestAnimationFrame`, not a global synchronous test stub: synchronous recursion never yields. `tests/living-interactions.test.mjs` demonstrates a queued window/global RAF harness. Its DOM remains alive through the 600ms autosave timer before closing; premature teardown causes asynchronous null-DOM errors. Test project/history isolation separately from preference persistence.

Useful checks:

```bash
npm test
node --check app.mjs
node --check routes.mjs
node --check living.mjs
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
13. Living World on/off and independent cloud/water choices in 2D/3D; motion pauses and clears during edits, orbit/pan, route drafts, diagnostic views, hidden tabs, and reduced motion, then resumes appropriately. Effects remain absent from project JSON/history and exported PNGs.
14. Help links to tutorial/KB, low-Strength instructions, and documented control names match the UI.

### GitHub Pages release process

The verified Pages configuration is source `main:/`, build type `legacy`. There is no checked-in `.github/workflows` directory at this baseline. GitHub creates the Pages build/deployment run. Do not assume a custom build workflow or npm build step exists.

Before release:

- Inspect `git status` and preserve unrelated user edits.
- Run appropriate tests and syntax/diff checks.
- Review renderer/picking and project migration when changing terrain data.
- Bump the query cache revision consistently in the `index.html` stylesheet/script URLs and all local ES-module imports. Baseline is `?v=2.3.0`. Documentation-only updates do not require a cache or footer version bump. Do not update only the entry script or only CSS.
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

For rollback, inspect the relevant history, revert the faulty commit(s), rerun checks, push, and verify Pages. Preserve project format compatibility or document any rollback implications for newly saved v5 files.

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
| `1010122` | Focused route settings and route cursor cleanup |
| `dee5ee8` | v2.1 UI review: contextual toolbox, opacity scope fix, Download/save badge, toggles, layer icons |
| `4fd8be5` | v2.1.1: removed Overworld breadcrumb and multi-world wording |
| `10961f0` | River taper, deterministic meander, and undoable reflow |
| `e2320cb` | Merged river upgrade with current UI refinements |
| `03c1199` | v2.2 Living World and tutorial/KB; current runtime baseline |

## 10. Known limitations and follow-up candidates

These are implementation facts or review targets, not promises of completed work:

1. **No finished-route point editing.** Saved geometry is sampled. Width, surface, depth, or control-point changes after committing require undo/recreation or future route-editing work.
2. **Baked Path paint.** Surface erasing/overpainting does not remove its route record. Such records still count against route/point/work limits. A route manager or explicit record cleanup is a possible follow-up.
3. **Authored river approximation.** Water profiles stay fixed until explicit Reflow; junctions use max levels. There is no physical flow, erosion simulation, automatic watershed/source detection, or automatic recomputation after sculpting. Manual Reflow samples the current bed and may deepen it when repeated (§15).
4. **River erasing retains the channel.** Removing water is not restoring pre-carve terrain. Undo the original commit for atomic bed-and-water rollback.
5. **Performance limits are estimates.** Very complex valid scenes can still be slow, especially on Canvas fallback. Full-grid picking and coarse fallback drawing can visually differ around small features.
6. **Desktop-first editing.** Pointer events and Orbit affordances exist, but touch/mobile usability and comprehensive accessibility have not been fully audited.
7. **No complete WCAG claim.** Tested colors are only one accessibility dimension.
8. **Browser-local persistence.** No server backups, collaboration, multi-project library, accounts, or cloud sync. Storage quota is finite; project downloads remain important.
9. **No Minecraft output.** No desktop WorldPainter `.world` import, region files, schematic export, or Minecraft biome metadata. Biomes is a visual map view.
10. **No WorldBox simulation.** No civilizations, agents, ecosystems, or time simulation.
11. **Old style selectors remain.** Base/theme CSS contains obsolete legacy tool selectors, the now-unused `.breadcrumb`/`.smallgreen` rules, and historical overrides. Clean them deliberately if refactoring, with narrow/collapsed visual verification.
12. **Documentation can drift.** Historical development notes and test names may refer to earlier schemas/tools. Use current handlers/validators and this baseline specification rather than reintroducing removed functionality.

13. **Remaining UI review items (not done in v2.1).**
    - The world dimensions appear in four places.
    - The right panel's "Made for world builders" filler remains.
    - The shortcut letters Land=C (reads as Coastline) and Smooth=Q are hard to recall.
    - Shortcut letters on tool buttons are ~9px.
    - The new toggle dot, layer icons, and selected-tool ring are outside `contrast.test.mjs`.
    - Shortcuts help is still hidden below 800px.

Protect the fixes already covered by regression tests: zero paint opacity never disables sculpting, no preset-driven tool switching, correct opacity per stroke, frozen Flatten perimeter by default, no edge-shrink reinterpretation, frame-coalesced rendering, real 3D picking, safe draft cancellation, no route→sculpt fallthrough, correct middle-pan ordering, and delayed conditional eraser-target reconciliation.

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

Terrain-aware forests and visual canopy breeze are shipped in v2.3; no vegetation growth or inhabitants are simulated. The user explicitly wants a storytelling component **after terrain tools are complete**, and asked to revisit it later. There is no narrative/quest/timeline/character/AI subsystem implemented or specified beyond that intent.

Possible future anchors include named locations, paths, rivers, and settlements, but these are ideas only. Before building, revisit desired audience, story structure, location linking, authoring/export, and persistence requirements with the user. Do not add narrative UI, AI service dependencies, or accounts as an assumed next step.

## 13. Quick continuation checklist

- Read this handoff, `README.md`, `docs/terrain-roadmap.md`, and the files touched by the requested change.
- Verify current Git status, branch, commit, and tests; do not assume this dated baseline is still HEAD.
- Keep the static deployment and existing hosting origin unless instructed otherwise.
- Preserve v1–v5 imports and existing user content; validate before mutation.
- Keep terrain, local-water rendering, and picking synchronized.
- Keep Path/River gesture state separate from sculpt brushes and from committed data.
- Keep icons/groups consistent and paint selections independent.
- Test meaningful behavior, review the result, verify deployment, and report real limitations plainly.
- Reconfirm source availability before Holler Maps integration; revisit storytelling only at the appropriate phase.

## 14. UI review — November 17, 2026 (v2.1)

A critical review of the live app compared the UI against this handoff. The interaction model (tool/footprint/material independence, route draft safety) was sound. The layout did not reflect it. Findings and their resolution:

| Finding | Resolution |
| --- | --- |
| Toolbox ordered by component type. With Raise active, the irrelevant paint palette sat above Strength, which was below the fold (toolbox ~1,500px in a 745px viewport). | Sculpt section moved up beside brush controls. Palette shown only for Paint. Filler tip removed. Toolbox is ~1,100px. |
| Opacity and Strength both active on sculpt tools. Opacity silently multiplied strength; Opacity 0 disabled sculpting with no feedback. | Opacity is scoped to Paint, Path, and surface Erase (§3). Regression test added. |
| Size labelled "px" but measured in map cells (~2.4 screen px per cell at 100% zoom on Large). | Labelled "blocks". |
| Footer said "W/S brush size" in Path/River, where W/S changes route width. | Hint is tool-specific. |
| Save/Shortcuts/world name hidden at phone widths, and no Ctrl+S on touch, so no export path. | Download stays visible as an icon at ≤500px. Shortcuts remain hidden on small screens. |
| "Save project" actually downloads; autosave status was buried at the bottom of the toolbox. | Renamed Download. Header badge shows autosave state. |
| Grid/Contours toggles looked identical to the view radio choices. | Distinct toggle style with `aria-pressed`. |
| Selected tool barely distinguishable in dark mode. | Accent ring, bolder label, wider edge marker. |
| Layer lock shown as ◇; layer/water toggles 25×26 and 31×19; undo/redo unlabeled. | SVG eye/lock icons, 32px targets, aria-labels. |
| Route preview ribbon faint and not the result colour. | Material/river-coloured outlined ribbon. |
| New-world cards in a 5+1 grid. | 3×2 grid. |
| "WORLD / Overworld" breadcrumb, OVERWORLD chip, and "Custom terrain · Overworld" implied multiple worlds per project. | Removed in v2.1.1 at the user's request. Chip reads MAP. |

Verified by the full test suite and by screenshots in headless Chromium (Canvas fallback) at 1440×900 in dark and light themes, at 1024px, and at 390px. Real-GPU and touch-device checks are still outstanding (§9 smoke list items 10–12).

## 15. River Taper, Meander and Reflow upgrade

Merged with the contextual-toolbox review and Overworld removal; those UI changes are preserved. No toolbar tool or project schema version was added.

New rivers default to Taper enabled and Meander 25% (slider 0–100%). These controls are hidden for Path. Taper is optional Boolean river metadata in v4; missing metadata means uniform width for older rivers. Meander is baked into sampled coordinates.

Effective radius is `max(0.75, width/2 × (0.25 + 0.75t))` for tapered rivers, where t is normalized cumulative arc length; untapered radius stays width/2. The minimum avoids subcell sources disappearing between terrain samples. Carving, river water, preview, and hit testing share it. Meander uses a deterministic source-coordinate hash and smooth perpendicular sine offset, bounded by width/2 times the slider fraction, clamped to map bounds and exactly zero at both endpoint handles. Work budgets use actual displaced segment lengths and maximum configured width; the 8,000,000/32,000,000 limits are unchanged.

World Settings offers **Reflow rivers** whenever a saved river exists. It is disabled if Relief or River water is hidden/locked. One action cancels pending gestures, samples all profiles against the same current heights snapshot using `level=max(0,min(previousLevel,nearestGroundHeight-0.5))`, recuts beds below the recalculated levels, rebuilds local water/effective geometry, and refreshes. It has one complete undo/redo group and leaves Path data and ocean settings unchanged. Because this formula samples an already carved bed, **repeated Reflow can deepen channels**; this is disclosed beside the button and covered by tests. Undo restores prior bed and levels. No automatic hydrology or finished-point editing is implemented.

Additional coverage includes taper save/load and old v4 compatibility, source/mouth width, thin-source continuity, deterministic bounded endpoint-pinned meander, maximum-width budgets, reflow profiles/recutting, and UI locks/undo/redo. Final merged release verification: **101 tests passed, 0 failed** on November 17, 2026.

## 16. v2.2 Living World and user documentation

Historical v2.2 release scope; §18 supersedes its vegetation scope and preference fields for v2.3.

`living.mjs` renders a separate `living-overlay` Canvas, with a capped 30Hz effect loop rather than continuously re-rendering terrain. Water shimmer samples visible wet cells; route streaks follow source-to-mouth point order; four drifting clouds add stylized projected soft shadows. This is visual atmosphere, not water/lighting/civilization simulation. No vegetation, population, day/night, or storytelling is delivered here.

World Settings offers one Living World toggle (default on) and an expandable choice of Water motion and Clouds & soft shadows. Its browser-local `landwright-living` preferences are `{enabled,clouds,waterMotion}` Booleans; no v4 field, history entry, terrain edit, paint change, reflow, or exported effect is introduced. `syncLiving` pauses/stops animation during pointer edits, pan/orbit, route drafts, hidden documents, reduced-motion preference, diagnostic views, and disabled effects. Resuming after ordinary 2D pointer release is explicitly synchronized and regression-tested with queued animation frames. The overlay has no pointer events and does not alter picking. It is stylized screen compositing, not a depth-buffered physically accurate lighting pass.

`docs/tutorial.md` and `docs/kb/index.md` start the user-facing tutorial/KB, linked in Help. Additional articles cover brushes, routes/reflow, Living World, and projects/troubleshooting. The user explicitly requested the prominent low-Strength lesson: **begin Raise/Lower around 5–10% Strength with short strokes, inspect, then increase gradually**. Keep it in future tutorial revisions. Opacity is reserved for Paint/Path/surface erasing and does not tame sculpting.

Maintain these user docs alongside new features: location, procedure, what changes, save/undo/export behavior, limitations, and common mistakes. Keep planned features clearly separate from shipped behavior.

v2.2 verification: **106 tests passed, 0 failed**. Tutorial/KB local links and syntax/diff checks pass. Living World rendering is deliberately separate from project data, undo and PNG composition; queued-frame tests cover pause/resume after 2D edits.


## 17. Reusable development skill and next session

The repository-scoped skill is [landwright-development](.agents/skills/landwright-development/SKILL.md). It applies to Landwright feature work, regressions, releases, onboarding/tutorial/KB updates, and Holler Maps or storytelling planning. Its `references/handoff.md` is a portable snapshot of this document, not a separate specification. When updating this handoff, refresh that snapshot in the same change; its skill link is rebased to `../SKILL.md`, and its contrast-audit link uses the bundled `references/docs/contrast-audit.md`. Refresh that audit copy if its source changes. In an active checkout, source/tests and this root handoff take precedence over an older installed skill snapshot.

To install elsewhere, copy the entire `landwright-development` directory into that runtime's supported skills directory (commonly `~/.agents/skills/`); retain `SKILL.md` and `references/handoff.md`. A skill file in this repository does not mean it is installed into every ChatGPT session or published to the plugin catalog. The portable `.skill` archive is a ZIP of that directory; extract it into the supported skills directory.

For a fresh session, request: **“Use landwright-development to continue Landwright. Read the current handoff, inspect HEAD and working-tree changes, and implement the requested change while keeping the tutorial and KB current.”** Discover the checkout and remote rather than relying on the cloud path above.

Previous shipped state: v2.2 at `03c1199`, published through successful Pages run `44207290868`. v2.3 adds forests as described in §18. Live-browser smoke checks confirmed the Living World switch/status/options in 2D and Canvas-fallback 3D. These checks do not establish real-GPU performance or a full accessibility audit. The v2.3 runtime changes are described below.

Suggested next product discussion: settlements and named locations as a bridge to storytelling. This remains a candidate, not an implemented or fully specified feature. Holler Maps originals remain unavailable (§11); storytelling remains deferred (§12).


## 18. v2.3 Forests and canopy breeze

Historical published renderer. The user rejected its cartoon stamp appearance; §19 replaces its visuals in v2.4 while preserving density/editing contracts.

**UI and editing.** Forest remains material ID4 inside Paint, but new Forest strokes edit a separate density field instead of surface RGB. The other five materials retain color painting. No toolbar tool or Forest Scatter footprint was added. Forest density is a target from 0–100%, default 65%; Opacity blends toward that target once per gesture against the starting density. A lower target can thin woodland. All four footprints work; Shift Forest clears toward zero. Erase → Forests uses opacity/footprint without changing ground or heights. Forests has independent visibility/locks; Surface controls do not lock woodland. Conditional layer/eraser controls reconcile after pointer release and Escape/pointer cancellation, after clearing gesture state. Escape retains already applied density, matching ordinary brush semantics.

**Schema and history.** New saves/autosaves write v5 with `forest: number[N²]` in 0–1 and `layers.forests`. Imports 1–4 initialize zero density and preserve their original Forest ground color, route data, drawings and marks. Old v4 applications cannot open v5. Import validation precedes mutation/history updates. Undo/Redo snapshots include density and Forests flags. New worlds and image heightmap import clear density; size/load/undo rebuild dependent caches. No individual tree instances enter `marks` or project JSON.

**Deterministic placement.** `buildForest` uses jittered four-block anchors inset three cells from the edge, deterministic noise for density/type/size, and a maximum 4,096 candidates (actual Large inset lattice is slightly smaller). It rejects roots below sea+2, adjacent height differences>6, local river levels more than 0.01 above ground, and saved Path corridors. Eligibility is rebuilt after content/sea changes; masks use all saved rivers independently of Water/River water visibility. Density survives unsuitable terrain and trees reappear when it becomes suitable. Surface-erasing a Path does not erase its saved record or corridor blocker.

**Caching and rendering.** `createForestHabitatCache().get(routes,N)` reuses rasterized path/river masks until route array identity or grid size changes. Committed route arrays must be replaced immutably, including append, erase, reflow, and load. Forest strokes and layer controls must not invalidate these masks. Original pine/broadleaf symbols share `ATLAS_TYPES` with legacy tree/mountain/town symbols in a 320×64 atlas. A 1024² cached forest overlay serves 2D and Map PNGs. GPU 3D batches eligible tree billboards with legacy marks; Canvas fallback draws projected, depth-sorted sprites, with less precise terrain occlusion. Heightmap view/PNG omits trees; Biomes may show static forests.

**Motion.** Living World adds `vegetationMotion` (default true) to browser preferences and a Canopy breeze checkbox. Up to 256 distributed trees receive moving leaf/branch accents, not full mesh animation or growth. Static forests remain with Living World off or reduced motion. Existing 30 Hz cap/pause rules apply. Scene preparation precedes animation-state reconciliation so canopy-only motion starts after the first 3D forest is built. Motion changes never enter history/project data or exports.

**Documentation and verification.** See `docs/kb/forests.md` and the tutorial's forest lesson. Low-Strength Raise/Lower guidance remains. Tests cover target density and per-stroke opacity, deterministic caps, water/cliff/path eligibility and restoration, v5 validation/older imports, populated density below the 12 MB import ceiling, cache reuse,3D editing, conditional controls/cancellation, locks, save/import/undo, and bounded canopy accents. Rendering/pixel checks still require an actual browser; real-GPU performance is not established by jsdom.

No Holler Maps source files were imported. Original symbols are deliberately small in scope. Ecosystem/civilization simulation, full tree swaying, day/night, inhabitants and storytelling remain unimplemented.


v2.3 verification: **118 tests passed, 0 failed**. Syntax and diff checks passed. Local browser smoke checks covered Forest density painting in dark/light themes, stable Paint selection, conditional Forests controls, 2D and Canvas-fallback 3D rendering, independent Canopy breeze, and real 1536² PNG downloads. Comparing visible/hidden Forests exports changed pixels only in the woodland region. Real-GPU rendering/performance is still unverified in this browser.


## 19. v2.4 integrated woodland — Codex continuation

### Start here: release and user intent

- v2.4 replaces the rejected cartoon pine/round-canopy stamps with terrain-integrated woodland. The release uses cache revision `2.4.0` and schema 5; imports 1–5 remain supported. Inspect actual Git/Pages status before quoting a release commit or deployment result.
- The user approved connected textured canopy masses, irregular edges, muted greens, clearings and soft shadows following relief, then explicitly requested release. Preserve the existing painting, opacity, Forests layer/erasing, undo/redo and ten-tool interface.
- Approved concept: [woodland art direction](docs/design/README.md) and [reference image](docs/design/woodland-direction.png). It is generated concept art, **not** a screenshot or an asset pasted over the map. Actual rendering is procedural and is not a pixel-for-pixel reproduction.
- Previous release was `e56269b` (v2.3). No schema migration beyond the existing v5 density contract is needed. Do not restore generated tree stamps or import guessed Holler assets.

### Implementation map

| File | Current changes |
| --- | --- |
| `forests.mjs` | Retains density-stroke compositing and route-identity habitat caching; replaces `buildForest` / `drawForestSymbol` with `buildWoodland`, `renderWoodland`, `woodlandSurface` |
| `app.mjs` | Separates derived geometry updates from RGBA texture rasterization; shares canopy relief with display/picking/brush projections; composites woodland into 2D/3D/Map PNG; removes generated forest billboards |
| `landmarks.mjs` | Atlas returns to legacy tree/mountain/town only; legacy artwork and content preserved |
| `terrain3d.mjs` | Optional cached texture mapping for woodland-covered Canvas fallback triangles; untextured coarse mesh during orbit; full detail on release |
| `living.mjs` | Canopy breeze uses low-opacity moving foliage glints instead of drawn twig strokes; ≤256 accents, existing pause rules |
| `index.html`, local module imports | Footer v2.4 and coordinated `?v=2.4.0`; runtime remains static/buildless |
| `tests/forests.test.mjs` | Continuous deterministic coverage, density monotonicity, habitat clipping, texture alpha, derived-height isolation, existing data/migration/cache contracts |
| `tests/interactions.test.mjs` | Added protection against reordering saved legacy marks during 3D rendering |
| `tests/living-interactions.test.mjs` | Queued-RAF regression: multiple 3D pointer events must not trigger RGBA rebuilds before the scheduled frame |
| `tests/terrain3d.test.mjs` | Canvas woodland texture uses only covered cells and finite affine transforms |

### Rendering/data contracts

1. **Authoritative data is unchanged:** `forest` is N² density in v5; `heights` remains the actual terrain/river bed. No canopy heights, noise fields, RGBA textures or accent instances enter project saves/history.
2. **Eligibility derives from the bed:** reject low coasts below sea+2, adjacent height differences>6, local water above bed, and committed Path corridors. All saved rivers count even when Water/River water is hidden. Density is retained where woodland is unsuitable.
3. **Continuous canopy:** deterministic multiscale patch noise creates coverage and clearings; irregular overlapping crown lobes give texture/lighting. No outlined generated forest symbols remain. The outer two cells have no canopy, with an inward feather, preserving the projected perimeter.
4. **Derived visual height:** `woodlandSurface` adds shallow canopy relief (under 3 blocks, capped at255) to the effective water/terrain surface only while Forests is visible and the view is not Heightmap. This same surface feeds GPU/Canvas rendering, picking, brush/route projections and legacy anchoring. Hiding Forests removes both color and canopy relief. Reflow and Heightmap PNG use actual bed heights.
5. **Shared composition:** the same woodland RGBA layer is drawn once into 2D, the cached 3D surface texture and visible Map PNG. Heightmap view/PNG omits it. Legacy marks are rendered from a copied array: sorting fallback sprites must not mutate `marks`.
6. **Performance:** `updateSurface()` can refresh derived geometry for picking; `flushTexture()` rasterizes RGBA during scheduled rendering/export. `pointer()` calls only `updateSurface()`, preventing per-pointer-event rasterization. `refresh()` dirties both surface and texture.
7. **Resolution/cache:** woodland raster is N×2 during a stroke and N×4 after release/cancel. Two texture-pattern entries keyed by N/resolution avoid alternating-resolution cache thrash. Raster loops visit the woodland bounding box; camera motion/breeze reuse cached textures. Route habitat masks retain their separate immutable-array cache contract.
8. **Canvas fallback:** texture-map only covered cells using affine clipped triangles. During orbit, retain the lighter existing mesh; return to cached textured woodland on release. This remains an approximate painter-sorted fallback, not a GPU-equivalent depth buffer.
9. **Motion:** foliage glints are subtle, bounded, visual-only and excluded from PNGs. Static woodland stays visible with motion disabled/reduced motion. Existing preferences and pause rules are unchanged.

### Verification and visual findings

The earlier v2.4 full suite passed **121 tests** before the latest marks/frame-coalescing/fallback additions. The fresh complete run in `/tmp/woodland-handoff-tests.log` passed **123 tests, 0 failed**, including the marks-order, queued-RAF rasterization and Canvas texture mapping regressions. Syntax checks for every root `.mjs` and `git diff --check` passed during this handoff update.

Real local-browser checks used Evergreen Island at `http://127.0.0.1:8765/`, with saved v5 forest density from v2.3. The first renderer looked too uniformly beaded; crown radii/positions now vary more and lighting is softer. The last actual screenshot shows textured woodland draped across the northwestern slopes in Canvas-fallback 3D, with no generated tree silhouettes. The fallback initially lost texture in flat triangles; affine texture mapping was added and visually checked. Final browser exports verified a 1536² Map PNG containing integrated woodland and a 256² Heightmap whose every pixel matched the saved bed. Project download retained schema 5/density. GPU rendering/performance has not been established. Visible/hidden Forests Map PNGs differ, while Heightmaps are byte-identical; every exported Heightmap pixel matches the saved bed. Live deployment must be checked against the release commit.

Warm local Node measurements for an 80×80 woodland patch on a 256 map: cached 512² texture ~4ms, cached 1024² ~11ms; first pattern creation ~75ms/~261ms. These are local component timings, not guaranteed app frame rates. Measure held 3D strokes as well as orbit; do not infer GPU performance from Canvas.

Code review identified per-event RGBA rasterization through `pointer()`; the split `updateSurface()` fix and queued-RAF regression address it. A separate regression caught legacy mark sorting mutating saved order; `sceneMarks()` now returns a copy. Recheck the final implementation after these fixes and fallback texturing.

### Continuation and known limits

- Keep the tutorial, forest KB, README, handoff and skill snapshot current with future changes. The low-Strength 5–10% Raise/Lower lesson remains required.
- Canvas fallback is textured but approximate, with reduced detail while orbiting. Final screenshots were checked in 2D/Canvas 3D; this does not establish real-GPU performance or full WCAG conformance.
- Full-tree swaying, growth/ecosystem simulation, individual route-point editing, inhabitants and storytelling remain unimplemented. Saved Path records continue blocking canopy after surface erasure; density remains dormant on unsuitable terrain.
- Verify the actual Pages deployment/live release before claiming publication. A push alone is not evidence. Future terrain changes must keep derived canopy out of bed/river calculations, saves and Heightmap exports.

Useful commands:

```bash
cd /workspace/work/worldpainter-github
git status --short
git diff --stat
npm test
node --check app.mjs
node --check forests.mjs
node --check terrain3d.mjs
git diff --check
```

The local preview server was restarted as `python3 -m http.server 8765 --bind 0.0.0.0`, with output at `/tmp/woodland-http.log`. It may need restarting in another environment. Browser local storage is tied to the 8765 origin; a different port will not load the same map. Browser tab IDs are ephemeral.

Do not use `/workspace/shared/landwright-forests.jpg` as a v2.4 acceptance image: it shows the rejected v2.3 stamps. Capture fresh screenshots through the supported browser tool. The generated concept is not a substitute for testing the implemented renderer.

## 20. v2.5 settlements — current Codex continuation

### Scope and interaction

The user explicitly authorized implementing and deploying settlements. Preserve ten terrain/surface/navigation tools. The right-sidebar collapsed Settlements panel contains Hamlet/Village/Town, Place, Select, existing-place dropdown, Name, Size, Rotation, Move, Delete and Back to terrain. It is separate from removed Drawing/Details tools. Original deterministic muted roof clusters replace any assumption of access to Holler originals. No inhabitants, growth, roads between places, auto-relocation or narrative authoring shipped.

Place/Move are transient modes with stable seed and exact chosen fields. Pointer preview validates without mutation; click/Enter commits one snapshot. Escape, selecting a tool, view changes, New world or imports clear the draft. Pointer events must not fall through into sculpting. Selecting/renaming/moving works in 2D and 3D. Middle-pan and right/Alt orbit remain available. Form fields retain normal text editing. Move must compare the full record, not only x/y, so same-position rotation/scale/name changes commit.

### Authoritative persistence and validation

`editor.mjs` writes schema6, imports1–6, migrates older versions with settlements[]. Required v6 list: max64, unique IDs, canonical fields `{id,kind,x,y,scale,rotation,seed,name}`. ID is1–40 ASCII alphanumeric/underscore/hyphen; name is nonblank plain text up to80 chars without control characters. Kind is hamlet/village/town; finite scale0.5–1.5, rotation0–360, unsigned32-bit integer seed. Entire circular footprint fits the grid. Unknown fields are stripped. Validate imports before replacing active project/history. Never insert names into HTML; use textContent and Canvas text. Autosave/history use the same authoritative records, no roof fields.

### Site and rendering contracts

`settlements.mjs` owns deterministic layout, validation, derived fields and Canvas composition. Base radii6/9/13; bounded packing targets6/15/30 irregular buildings with curved internal lanes. Every footprint cell must be at least sea+1 and dry against raw riverWater even when hidden. Ground range<=8 and adjacent differences<=3; circular footprints cannot overlap (one-cell separation). Failure reports a reason. Prepare ground manually with Flatten, or reduce size; placement never sculpts. Terrain changes can leave an existing record unsuitable; do not silently remove it.

`settlementFields` builds bounded mask and shallow gable heights; cache by records-array identity/N. All committed edits replace the array immutably. Combine visible footprints with woodland suppression masks without changing saved forest density. Derived roofs add only to `surfaceHeights`, capped255, shared by GPU/Canvas/picking. Bed, river reflow, saved heights and Heightmap remain untouched. Hiding Settlements removes roofs and allows eligible woodland to return. Separate cached1024² settlement texture is reused during orbit and composited into2D/3D/MapPNG. Names remain overlay text, clamped/flipped inside actual N for export and screen projection in3D. Heightmap view suppresses labels/buildings. Conditional layer and Erase target remove whole objects regardless of Opacity; visibility/locks protect edits.

Living World pauses during Place/Move drafts. UI themes use existing tokens. No claim of full WCAG conformance or real-GPU performance is established by Node tests or Canvas screenshots.

### Verification and maintenance

Fresh full `npm test`: **135 passed, 0 failed**, including5 settlement module tests and7 DOM integration tests. Coverage includes deterministic bounded layout, whole-footprint suitability, derived-height isolation, schema migration and rejection, label edges, safe names, cancel/undo/redo, locks/erasing, all types placed in3D, same-position Move transform, image-import draft cleanup and malformed-import atomicity. Reviewer confirmed the three reproduced bugs fixed, with no concrete remaining blocker. Node DOM tests stub Canvas; actual browser visual/export checks remain separately required for release.

Update tutorial, `docs/kb/settlements.md`, KB index, projects/brush guidance and README with behavior changes. Preserve the mandatory5–10% initial Raise/Lower Strength lesson. Refresh this skill's reference copy with its relative skill link rebased. Deployment remains GitHub Pages `main:/`; verify actual successful run and live footer2.5 before claiming release. All root module/style query revisions are2.5.0. Prior v2.4 release95c5ea6 remains historical. See Git history for this release commit.

Actual v2.5 local-browser verification: placed Village Willowbank and Hamlet Northwatch in Evergreen Island after explicitly preparing a flat site. Inspected light/dark controls and2D/Canvas3D composition. Downloaded schema6 retained both names/types. MapPNG is1536² and includes roofs/lanes/labels. The256² Heightmap matched every rounded saved bed pixel; visible/hidden Settlements heightmaps were byte-identical. No real-GPU frame-rate claim is made.

## 21. v2.5.1 sidebar removal and Space pan — current override

The user rejected the right-sidebar Settlements options. Remove the entire placement/editing panel, controls, CSS and interaction modes; do not silently move them elsewhere. §20 describes historical v2.5 creation behavior only. Preserve schema6 records, import validation, derived roof/woodland composition, labels, MapPNG exports, conditional visibility/lock layer and whole-object Erase support for saved maps. No new schema or eleventh tool.

Space keydown outside inputs/selects/textareas/contenteditable and open dialogs prevents scrolling/activation and enables temporary camera panning. Left pointerdown chooses pan before editing/route logic.2D uses existing pan offsets;3D uses camera panX/panY without changing yaw/pitch, even off terrain and with Orbit active. A started pan stays a pan until pointerup even if Space is released first. Tool selection and authoritative data/history stay unchanged. Mid-stroke Space ends the stroke before enabling pan. Keyup, window blur and hidden-page transitions clear key state; blur/hidden also cancel held gestures. Brush cursor hides during navigation; grab cursor indicates Space.

Tests replace removed creation-mode integration tests with current sidebar-absence, saved-content retention,2D/3D translation, no-terrain-change, tool persistence, keyup/blur/typing and route-pan tests. Full suite134 passes. Tutorial/KB/README/help describe current controls. §20 historical135-test count is superseded.

Real-browser v2.5.1 checks used held Space with native left-mouse drags:2D moved the map80px/40px;3D translated the camera without changing the selected Raise tool. Inspected simplified sidebar in dark/light themes; existing Willowbank/Northwatch records remained visible. Canvas fallback was used; no GPU performance claim.

## 22. v2.5.2 opacity shortcuts and Shift erase — current override

The user removed the standalone Erase toolbar tool and requested D/E opacity adjustment. **Nine tools** now supersede all historical ten-tool requirements. E never selects Erase. D lowers and E raises Paint/Path Opacity by5 percentage points, bounded0–100; keys preserve tools, Strength, saved project and undo history. They respect editable fields/dialogs and existing Ctrl/Cmd shortcuts. Hidden non-opacity tools ignore these keys. The opacity slider includes the shortcut hint and Help documents it.

`gestureTool(e)` treats Shift+Paint as erase while keeping the actual tool Paint. Event-aware `activeLayer(e)` and `opacity(e)` route validation before snapshot/mutation. Normal paint always paints its selected material, regardless of chosen Shift target. Choosing a ground material resets Shift target to Surface; Forest chooses Forests (available even when empty). Paint contains the former target selector labelled Shift erase target; existing rivers, settlements and legacy shapes/landmarks remain erasable. Target changes preserve the current tool. Whole-object erase ignores paint Opacity (even0%); surface and forest clearing uses opacity-once-per-stroke coverage. Layer locks/visibility follow the target, not the selected paint material. Erasing river water keeps the carved bed. Conditional controls reconcile on release/Escape, not mid-stroke. No schema change; save/import remain6/1–6.

Shift reverses Raise/Lower and removes Land as before; it erases only with Paint. Path’s Opacity keys affect newly committed route paint; Shift is not a path-record deletion tool. Space-panning still takes precedence over Paint and modifiers. Removed Erase icon may remain in the reusable icon module, but has no toolbar, shortcut or tool dispatch.

Verification: full Node suite **139 passed,0failed**, including new D/E clamping/no-project-change, typing/dialog protection, nine-tool UI, Path committed-opacity and zero-opacity whole-object Shift-erasing tests. Existing2D/3D surface, forest, river and legacy erasing tests now send genuine Shift-modified Paint events. Preserve tutorial low-Strength5–10% guidance and refresh the skill snapshot with changes.

Actual local-browser v2.5.2 check: D/D/E produced100→90→95% with Paint retained; painted a Hard Round Sand patch and Shift-clicked it away, then undid both test strokes. Inspected2D/Canvas3D and light/dark controls. No real-GPU performance claim.
