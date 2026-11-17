# WorldPainter browser studio
Independent implementation inspired by WorldPainter's public terrain painting workflow (https://www.worldpainter.net/). No original source code or assets are included.

A dependency-free static app. Serve `dist/` using any HTTP server. Edit terrain with raise, lower, smooth, and flatten tools; paint six surface types; generate seeded islands; change sea level; toggle water, shading, contours and grid; inspect an isometric preview. Undo and redo retain 35 states. Projects automatically save in browser localStorage. Save editable `.world.json` files, import projects or image heightmaps, and export 8-bit 256×256 grayscale PNG heightmaps.

This first version does not read WorldPainter `.world` files or produce Minecraft region files. Biome view visualizes the painted surface categories rather than storing Minecraft biome IDs. The 3D preview is a fixed isometric projection with rotation.
