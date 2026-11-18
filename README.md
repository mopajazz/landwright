# Landwright

A minimalist, dependency-free browser map builder, inspired by WorldPainter's terrain workflow, WorldBox's approachable world creation, and Inkarnate's mapmaking controls. All code and landmark artwork are independently implemented.

**Live app:** https://mopajazz.github.io/worldpainter-studio/

**Complete product and engineering handoff:** [handoff.md](handoff.md)

**Reusable development skill:** [landwright-development](.agents/skills/landwright-development/SKILL.md). Copy the entire skill folder into a supported skills directory (commonly `~/.agents/skills/`) for use in another checkout or agent runtime. The skill includes a portable handoff snapshot; the current root handoff and source remain authoritative.

## Create → sculpt → paint

- Start with Island, Archipelago, Continent, Atoll, Open ocean, or Flat grass. Each has a generated preview. Seed and relief live under Generation settings.
- Sculpt elevation with Raise, Lower, Smooth, or Flatten. Raise/Lower start gently at 8% Strength; Smooth/Flatten retain 35%. Full strength remains available. The toolbox follows the active tool: footprint and size first, then Strength for sculpt tools; the paint material palette appears only with Paint. Three brush footprints cover Soft Round, Hard Round, and Coastline. Material textures supply the grain. Brush and material selections keep the current tool and survive tool changes. Coastline paints any selected material without changing height; use the explicit Land tool (C or M) to add or remove terrain. Strength controls sculpting power. Opacity applies only to Paint, Path, and surface Erase; surface paint opacity is capped within a single stroke and builds across separate strokes.
- Paint eight procedural ground materials—Grass, Loam, Clay, Bedrock, Scree, Mud, Sand, and Snow—grouped by family. Their textures automatically respond to slope, shelter and nearby water. Forest paints a separate tree-density layer. Forest has its own density control and conditional layer/eraser; it keeps ground colors unchanged. Drawing and Details creation tools have been removed to keep the toolbox focused on terrain. Existing drawings and landmarks still load, render, export, and save.
- Hold Shift while clicking/dragging with Paint to erase. Paint’s Shift erase target defaults to Surface paint for ground materials and Forests for Forest; River water and saved-object targets appear when that content exists. Surface erasing uses brush opacity and reveals the natural terrain color without changing heights. Landmark/drawing erasing removes whole touched objects; undo restores them. Hidden and locked layers are protected.
- Hide and lock Surface and Relief. Legacy Drawings and Landmarks layers appear only when a project contains that content. Relief visibility controls shading/contours, while elevation remains the world foundation. Hidden or locked layers cannot be edited. Water has its own toggle and sea-level control.
- Toggle the main workspace between 2D Map and 3D Terrain. All editing tools work directly on the 3D terrain. Left-drag edits with the active tool; right-drag or Alt-drag orbits and tilts; middle-drag or the Pan tool moves the camera. Scroll zooms, Shift+scroll resizes the brush, and Reset view recenters. The Orbit toggle supports touch; selecting a tool returns to editing while staying in 3D. Switch to terrain, heightmap, or biome visualization.
- Export a 1024×1024, 2048×2048, or 4096×4096 PNG of the current map view, including visible drawings and landmarks, or an 8-bit PNG heightmap at the selected world size. Map exports omit editor overlays such as grid and cursor.
- Undo/redo retains 35 states, including stamps, layer settings, names, translucent paint, drawings, and world generation. Editable project files and local autosaves use schema v7 and accept v1–v6 projects. Older Forest paint remains color, without automatically adding trees.

## Shortcuts

| Key | Action |
| --- | --- |
| W / S | Increase / decrease brush size by 1 |
| Shift + W / S | Change brush size by 10 |
| Shift + mouse wheel | Resize brush |
| Mouse wheel | Zoom |
| Space + left drag / Middle drag | Pan |
| Right drag or Alt + drag in 3D | Orbit and tilt |
| R / L / Q / F | Raise / lower / smooth / flatten |
| B or P / C or M / H | Paint / land / pan |
| D / E | Flatten target −/+1 block; Paint/Path Opacity −/+5% |
| Shift + D / E | Flatten target −/+10 blocks |
| J / V | Path / river |
| Enter or double-click / Escape | Finish route / cancel preview |
| Shift + Raise/Lower or Land | Reverse elevation direction / remove land |
| Shift + Paint | Erase the chosen target |
| Ctrl or Cmd + Z | Undo |
| Ctrl or Cmd + Shift + Z | Redo |
| Ctrl or Cmd + S | Download editable project |

Brush sizing follows [Inkarnate's documented controls](https://help.inkarnate.com/articles/4018103-brush-tool). Smooth moved from S to Q to avoid a conflict.

## Development and hosting

Serve this directory with any static HTTP server. GitHub Pages serves the root of `main`; `.nojekyll` bypasses Jekyll. There is no build step. Install test-only dependencies with `npm ci`, then run `npm test`. The application itself needs no dependencies. DOM interaction tests stub canvas drawing; they do not verify browser rendering or PNG encoding.

The app is a map builder, without WorldBox's civilization simulation. It does not load WorldPainter `.world` files or export Minecraft region files. The biome view is a surface visualization, rather than Minecraft biome IDs. Drawings are limited to 500 objects, 1,000 points per freehand path, and 100,000 total points. Landmarks are decorative 2D symbols; the GPU 3D workspace shows the terrain with drawings draped on its surface and landmarks rendered as billboards. Projects stay in the current browser unless downloaded; autosave is specific to each hosting origin. Optional Google Fonts fall back to system fonts when blocked.

## 3D rendering

WebGL renders a resident indexed terrain mesh at the selected world size (130,050 triangles at 256×256), a cached map texture, and a batched landmark atlas. Orbiting changes camera uniforms rather than rebuilding CPU triangle paths. Content changes update the cached surface and height data. Animation-frame scheduling combines input updates into one render per display frame. The HUD reports the rendering path and a smoothed rate during interaction; actual frame rate depends on hardware and scene complexity. Devices without WebGL use a Canvas fallback with a lighter mesh while orbiting, full detail on release, and cached landmark sprites. Picking traverses terrain cells and intersects the exact mesh triangles, including water surfaces and isolated peaks.

### Workspace and appearance

Collapse the toolbox to an icon rail, drag its edge to resize it, or use arrow keys on the divider. Light and dark themes persist locally. Flatten preserves the outer map boundary by default; uncheck **Preserve map edges** to reshape it.

UI palette contrast checks and their scope are documented in [the contrast audit](docs/contrast-audit.md).

New world includes a **Flat grass** preset: a completely level grass field at elevation 80. Select **Small (128 × 128)**, **Medium (192 × 192)**, or **Large (256 × 256)** before creation. Size is retained in project files and undo history; existing projects open at their original 256 × 256 size.

The toolbox is grouped by function: **Terrain** (Raise, Lower, Smooth, Flatten, River, Land), **Surface** (Path, Paint), and **Navigate** (Pan). Group separators remain visible in the collapsed rail. Icons share a 24-unit grid, 1.9-unit stroke, and 28px display size: peak/add, excavated basin/remove, sanding block, spirit level, shoreline, brush and hand. Labels, shortcut hints, accessible names, and a selected-edge marker supplement the silhouettes.

## Paths and rivers

Choose **Path (J)** or **River (V)**. Click points or drag a curve; the preview shows its width. **Enter**, **double-click**, or **Finish route** commits one undo group. **Escape** cancels without editing the map. Switching tools or 2D/3D views also cancels unfinished routes.

Use W/S or Shift+wheel to adjust route width (2–32 blocks); Shift+W/S changes it by 10. Path offers Dirt, Stone, and Sand and uses paint opacity without changing elevation. River adds channel depth (1–16 blocks), softly carves the banks, and creates local water above sea level. Start at the source and work toward the mouth: its water profile never rises, so uphill terrain is cut through. This is an authored river tool, not a fluid simulation.

The **River water** layer controls visibility/locking of local water; Relief locking also blocks river carving. The Water toggle reveals the bed. Paint → Shift erase target → River water, then Shift-click/drag, removes whole touched river water routes while retaining the carved channel; undo restores them. Surface erasing removes path paint. Route geometry and river levels save in v5 projects; v1–v4 projects migrate automatically. Finished routes cannot yet have individual points repositioned. Map PNGs include visible water; heightmaps export the actual carved bed.

Up to 64 routes / 32,768 sampled points are supported, with an additional shared raster-work budget to keep large or imported routes responsive.

### v2.1 — river taper, meander, and reflow

New River settings include **Taper** (on by default) and deterministic **Meander** (0–100%, default 25%). Taper follows cumulative route distance from 25% to 100% of configured width, with a 0.75-cell minimum radius for tiny sources. Meander is bounded to half the width at 100% and pins endpoints exactly. Paths are unchanged.

**World Settings → Reflow rivers** recalculates saved levels against the current terrain snapshot and recuts the channels beneath them, in one undoable action. It respects Relief/River water visibility and locks. **Repeated reflow can deepen the current bed**; undo restores the previous terrain and river levels. This follows the current-bed sampling formula and is not an automatic hydrology simulation.

The river upgrade retained v4 compatibility (v2.3 now writes v5 for forests): optional river `taper` metadata is saved; absent metadata means uniform width for old rivers. Meander is baked into sampled coordinates. No tools or schema version were added. Existing raster-work budgets still use maximum width and actual meandering centerline length.

## Living World and user documentation

World Settings → **Living World** adds a visual-only, separately rendered overlay: water shimmer, downstream river streaks, drifting clouds, and soft cloud shadows in 2D/3D. It is on by default, with separate Water motion / Clouds options. Effects pause during editing, route previews, hidden tabs, reduced motion, and diagnostic views. The overlay targets 30 draws/sec, leaves project data/history unchanged, and is excluded from PNG exports. Preferences use `landwright-living`. Atmosphere does not include simulation, inhabitants, day/night, or storytelling. Static forests are saved separately in v5; optional Canopy breeze animates bounded foliage glints.

Start with the [tutorial](docs/tutorial.md) or [knowledge base](docs/kb/index.md), also linked from in-app Help. **Before Raise or Lower, start around 5–10% Strength, use short strokes, inspect, and increase gradually.** Paint Opacity does not reduce sculpting power.

## v2.3 — forests and clearings

Paint → Forest now paints a saved density field, with a 65% default target and normal footprint/opacity controls. Shift clears trees; Paint → Shift erase target → Forests and the conditional Forests layer keep woodland separate from ground paint. The original v2.3 stamps were superseded by the v2.4 integrated canopy described below. Trees avoid low coasts, cliffs, local river water and saved path corridors. Unsuitable terrain hides trees while keeping density for later restoration; path records still block after surface erasure.

Project v5 adds density and Forests layer settings; imports v1–v4 preserve all existing content and initialize empty density. Canopy breeze is optional Living World motion, excluded from saves/history/exports; static forests are included in saves and visible Map PNGs. No tools were added. See [Forests and clearings](docs/kb/forests.md). Holler originals remain unavailable and unintegrated.

## v2.4 — terrain-integrated woodland

Forest painting now produces connected, textured canopy with irregular edges, natural gaps, muted greens and soft contact shading. Generated pine/oak stamps have been removed. Existing density painting, erasing, layers, v5 saves and undo remain compatible; legacy landmark symbols are preserved.

The same cached woodland texture appears in 2D, 3D and visible Map PNGs. A shallow derived canopy surface gives 3D woodland volume and consistent picking without changing the saved ground or Heightmap PNG. Canvas fallback texture-maps wooded cells and restores detail after orbit. Pattern caches, bounding-box rasterization and frame-coalesced texture updates keep repeated brush events from rebuilding the full texture synchronously.

Verified with 123 passing tests and actual browser Map/Heightmap exports. Real-GPU performance remains hardware-dependent and has not been established in the cloud Canvas browser. See [woodland guidance](docs/kb/forests.md) and the [art-direction reference](docs/design/README.md); the reference is concept art, not a screenshot.

## v2.5.1 — simpler sidebar and Space-drag pan

The Settlements placement/editing panel has been removed from the right sidebar. Existing saved settlements retain their rendering, names, layers, erasing, undo and export support; schema 6 and imports1–6 remain compatible. No replacement settlement controls have been added.

Hold **Space + left mouse drag** to pan in 2D or 3D from any active tool. Releasing Space preserves the selected tool; the current pan gesture continues until mouse release. Text fields and open dialogs keep ordinary Space behavior. Losing window focus or hiding the page clears the held-key state. Middle-drag, Pan(H), and3D orbit controls remain available.

## v2.5.2 — opacity keys and Shift erasing

D/E decreases/increases Paint or Path Opacity in5% steps. The dedicated Erase tool and E tool shortcut are removed; there are now nine toolbar tools. Hold Shift and click/drag with Paint to erase, using the natural material target or choosing another saved layer in Shift erase target. Normal Paint remains unchanged. Layer visibility/locks, whole-object erasing, undo and2D/3D support remain. Schema6 is unchanged. Space-drag pan and Shift reverse sculpting remain available.

## v2.6 — a clearer beginning and larger exports

New World now offers a live preview of the selected terrain and detail, descriptive shape choices, clearer Quick sketch/Standard/Detailed labels, a responsive layout, and a current-project backup action. Terrain grids remain128/192/256 square; generation remains undoable. Map image exports offer 1024, 2048 (default), and 4096 square PNGs independently of terrain detail. Heightmap and project formats are unchanged. See [New worlds and resolution](docs/kb/worlds.md).

## Earthen material study — awaiting art-direction feedback

[Open the standalone swatch sheet](https://mopajazz.github.io/worldpainter-studio/studies/earthen/). Eight proposed procedural materials — Grass, Loam, Clay, Bedrock, Scree, Mud, Sand and Snow — appear on identical flat/relief terrain against parchment and midnight frames. Includes a mixed landscape, interface theme switch and downloadable comparison PNG. This is a visual prototype, not the editor palette or a physical erosion simulation. No app data, tools, forests or schema changes.


## v2.8 — settlements brush

Choose a settlement swatch, size the search area with W/S, and preview a terrain-fitted plan before placing it. Hamlet, Village, Town, Abbey, and Castle layouts use connected dry ground and save their plan geometry in the existing project format. See [Settlements brush](docs/kb/settlements.md).
