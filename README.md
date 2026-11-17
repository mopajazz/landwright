# WorldPainter Studio

A minimalist, dependency-free browser map builder, inspired by WorldPainter's terrain workflow, WorldBox's approachable world creation, and Inkarnate's mapmaking controls. All code and landmark artwork are independently implemented.

**Live app:** https://mopajazz.github.io/worldpainter-studio/

## Create → sculpt → paint → detail

- Start with Island, Archipelago, Continent, Atoll, or Open ocean. Each has a generated preview. Seed and relief live under Advanced generation.
- Sculpt elevation with Raise, Lower, Smooth, or Flatten. Advanced brush settings stay folded until needed.
- Paint six surface materials. Place original tree, mountain, and settlement symbols on a separate landmark layer; drag to scatter, Shift-drag to erase. Landmarks only place on dry land while water is enabled. Limit: 3,000 landmarks.
- Hide and lock the Surface, Landmarks, and Relief layers. Relief visibility controls shading/contours, while elevation remains the world foundation. Hidden or locked layers cannot be edited. Water has its own toggle and sea-level control.
- Inspect terrain in a rotating isometric preview. Switch to terrain, heightmap, or biome visualization.
- Export a 1536×1536 PNG of the current map view, including visible landmarks, or a 256×256 8-bit PNG heightmap. Map exports omit editor overlays such as grid and cursor.
- Undo/redo retains 35 states, including stamps, layer settings, names, and world generation. Editable project files and local autosaves use schema v2 and accept v1 projects.

## Shortcuts

| Key | Action |
| --- | --- |
| W / S | Increase / decrease brush size by 1 |
| Shift + W / S | Change brush size by 10 |
| Shift + mouse wheel | Resize brush |
| Mouse wheel | Zoom |
| Middle drag | Pan |
| R / L / Q / F | Raise / lower / smooth / flatten |
| B or P / T / H | Paint / details / pan |
| Shift + sculpt | Reverse elevation brush |
| Shift + paint or details | Erase |
| Ctrl or Cmd + Z | Undo |
| Ctrl or Cmd + Shift + Z | Redo |
| Ctrl or Cmd + S | Download editable project |

Brush sizing follows [Inkarnate's documented controls](https://help.inkarnate.com/articles/4018103-brush-tool). Smooth moved from S to Q to avoid a conflict.

## Development and hosting

Serve this directory with any static HTTP server. GitHub Pages serves the root of `main`; `.nojekyll` bypasses Jekyll. There is no build step. Install test-only dependencies with `npm ci`, then run `npm test`. The application itself needs no dependencies. DOM interaction tests stub canvas drawing; they do not verify browser rendering or PNG encoding.

The app is a map builder, without WorldBox's civilization simulation. It does not load WorldPainter `.world` files or export Minecraft region files. The biome view is a surface visualization, rather than Minecraft biome IDs. Landmarks are decorative 2D symbols; the isometric preview shows terrain. Projects stay in the current browser unless downloaded; autosave is specific to each hosting origin. Optional Google Fonts fall back to system fonts when blocked.
