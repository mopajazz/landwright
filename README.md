# Landwright

A minimalist, dependency-free browser map builder, inspired by WorldPainter's terrain workflow, WorldBox's approachable world creation, and Inkarnate's mapmaking controls. All code and landmark artwork are independently implemented.

**Live app:** https://mopajazz.github.io/worldpainter-studio/

## Create → sculpt → paint → detail

- Start with Island, Archipelago, Continent, Atoll, or Open ocean. Each has a generated preview. Seed and relief live under Advanced generation.
- Sculpt elevation with Raise, Lower, Smooth, or Flatten. Brushes, size/opacity, and the terrain palette stay in fixed positions. Tool-specific settings follow below. Four independent brush footprints cover Soft Round, Hard Round, Coastline, and Grain. Brush and material selections keep the current tool and survive tool changes. Coastline paints any selected material without changing height; use the explicit Land tool (C or M) to add or remove terrain. Opacity controls sculpting power and stamp transparency; surface paint opacity is capped within a single stroke and builds across separate strokes.
- Paint six surface materials. Place original tree, mountain, and settlement symbols on a separate landmark layer; drag to scatter, Shift-drag to erase. Landmarks only place on dry land while water is enabled. Limit: 3,000 landmarks.
- Draw freehand paths, straight lines, rectangles, ellipses and triangles on a separate Drawings layer. Set ink color, line width, opacity, and fill. Hold Shift for equal-sided shapes; Escape cancels an unfinished drawing.
- Erase (E) targets Surface paint, Landmarks, or Drawings. Surface erasing uses brush opacity and reveals the natural terrain color without changing heights. Landmark/drawing erasing removes whole touched objects; undo restores them. Hidden and locked layers are protected.
- Hide and lock the Surface, Landmarks, Drawings, and Relief layers. Relief visibility controls shading/contours, while elevation remains the world foundation. Hidden or locked layers cannot be edited. Water has its own toggle and sea-level control.
- Toggle the main workspace between 2D Map and 3D Terrain. All editing tools work directly on the 3D terrain. Left-drag edits with the active tool; right-drag or Alt-drag orbits and tilts; middle-drag or the Pan tool moves the camera. Scroll zooms, Shift+scroll resizes the brush, and Reset view recenters. The Orbit toggle supports touch; selecting a tool returns to editing while staying in 3D. Switch to terrain, heightmap, or biome visualization.
- Export a 1536×1536 PNG of the current map view, including visible drawings and landmarks, or a 256×256 8-bit PNG heightmap. Map exports omit editor overlays such as grid and cursor.
- Undo/redo retains 35 states, including stamps, layer settings, names, translucent paint, drawings, and world generation. Editable project files and local autosaves use schema v3 and accept v1/v2 projects.

## Shortcuts

| Key | Action |
| --- | --- |
| W / S | Increase / decrease brush size by 1 |
| Shift + W / S | Change brush size by 10 |
| Shift + mouse wheel | Resize brush |
| Mouse wheel | Zoom |
| Middle drag | Pan |
| Right drag or Alt + drag in 3D | Orbit and tilt |
| R / L / Q / F | Raise / lower / smooth / flatten |
| B or P / E / T / D / M / H | Paint / erase / details / draw / coastline / pan |
| Shift + sculpt | Reverse elevation brush |
| Shift + paint or details | Erase |
| Ctrl or Cmd + Z | Undo |
| Ctrl or Cmd + Shift + Z | Redo |
| Ctrl or Cmd + S | Download editable project |

Brush sizing follows [Inkarnate's documented controls](https://help.inkarnate.com/articles/4018103-brush-tool). Smooth moved from S to Q to avoid a conflict.

## Development and hosting

Serve this directory with any static HTTP server. GitHub Pages serves the root of `main`; `.nojekyll` bypasses Jekyll. There is no build step. Install test-only dependencies with `npm ci`, then run `npm test`. The application itself needs no dependencies. DOM interaction tests stub canvas drawing; they do not verify browser rendering or PNG encoding.

The app is a map builder, without WorldBox's civilization simulation. It does not load WorldPainter `.world` files or export Minecraft region files. The biome view is a surface visualization, rather than Minecraft biome IDs. Drawings are limited to 500 objects, 1,000 points per freehand path, and 100,000 total points. Landmarks are decorative 2D symbols; the GPU 3D workspace shows the terrain with drawings draped on its surface and landmarks rendered as billboards. Projects stay in the current browser unless downloaded; autosave is specific to each hosting origin. Optional Google Fonts fall back to system fonts when blocked.

## 3D rendering

WebGL renders a resident 256×256 indexed terrain mesh (130,050 triangles), a cached map texture, and a batched landmark atlas. Orbiting changes camera uniforms rather than rebuilding CPU triangle paths. Content changes update the cached surface and height data. Animation-frame scheduling combines input updates into one render per display frame. The HUD reports the rendering path and a smoothed rate during interaction; actual frame rate depends on hardware and scene complexity. Devices without WebGL use a Canvas fallback with a lighter mesh while orbiting, full detail on release, and cached landmark sprites. Picking traverses terrain cells and intersects the exact mesh triangles, including water surfaces and isolated peaks.

### Workspace and appearance

Collapse the toolbox to an icon rail, drag its edge to resize it, or use arrow keys on the divider. Light and dark themes persist locally. Flatten preserves the outer map boundary by default; uncheck **Preserve map edges** to reshape it.

UI palette contrast checks and their scope are documented in [the contrast audit](docs/contrast-audit.md).

New world includes a **Flat grass** preset: a completely level grass field at elevation 80. Select **Small (128 × 128)**, **Medium (192 × 192)**, or **Large (256 × 256)** before creation. Size is retained in project files and undo history; existing projects open at their original 256 × 256 size.
