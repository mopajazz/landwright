# WorldPainter Studio

A minimalist, dependency-free browser map builder, inspired by WorldPainter's terrain workflow, WorldBox's approachable world creation, and Inkarnate's mapmaking controls. All code and landmark artwork are independently implemented.

**Live app:** https://mopajazz.github.io/worldpainter-studio/

## Create → sculpt → paint → detail

- Start with Island, Archipelago, Continent, Atoll, or Open ocean. Each has a generated preview. Seed and relief live under Advanced generation.
- Sculpt elevation with Raise, Lower, Smooth, or Flatten. Advanced brush settings stay folded until needed. Four brush presets cover Soft Round, organic Coastline land addition/removal, Forest Scatter, and Grain textures. Opacity controls sculpting power and stamp transparency; surface paint opacity is capped within a single stroke and builds across separate strokes.
- Paint six surface materials. Place original tree, mountain, and settlement symbols on a separate landmark layer; drag to scatter, Shift-drag to erase. Landmarks only place on dry land while water is enabled. Limit: 3,000 landmarks.
- Draw freehand paths, straight lines, rectangles, ellipses and triangles on a separate Drawings layer. Set ink color, line width, opacity, and fill. Hold Shift for equal-sided shapes; Escape cancels an unfinished drawing.
- Hide and lock the Surface, Landmarks, Drawings, and Relief layers. Relief visibility controls shading/contours, while elevation remains the world foundation. Hidden or locked layers cannot be edited. Water has its own toggle and sea-level control.
- Toggle the main workspace between 2D Map and 3D Terrain. Drag the 3D terrain to orbit and tilt, scroll to zoom, or reset the view. Choose a tool to return to the 2D editing canvas. Switch to terrain, heightmap, or biome visualization.
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
| R / L / Q / F | Raise / lower / smooth / flatten |
| B or P / T / D / M / H | Paint / details / draw / coastline / pan |
| Shift + sculpt | Reverse elevation brush |
| Shift + paint or details | Erase |
| Ctrl or Cmd + Z | Undo |
| Ctrl or Cmd + Shift + Z | Redo |
| Ctrl or Cmd + S | Download editable project |

Brush sizing follows [Inkarnate's documented controls](https://help.inkarnate.com/articles/4018103-brush-tool). Smooth moved from S to Q to avoid a conflict.

## Development and hosting

Serve this directory with any static HTTP server. GitHub Pages serves the root of `main`; `.nojekyll` bypasses Jekyll. There is no build step. Install test-only dependencies with `npm ci`, then run `npm test`. The application itself needs no dependencies. DOM interaction tests stub canvas drawing; they do not verify browser rendering or PNG encoding.

The app is a map builder, without WorldBox's civilization simulation. It does not load WorldPainter `.world` files or export Minecraft region files. The biome view is a surface visualization, rather than Minecraft biome IDs. Drawings are limited to 500 objects, 1,000 points per freehand path, and 100,000 total points. Landmarks are decorative 2D symbols; the 3D workspace shows terrain. Projects stay in the current browser unless downloaded; autosave is specific to each hosting origin. Optional Google Fonts fall back to system fonts when blocked.
