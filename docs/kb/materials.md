# Earthen materials

Texture belongs to the material. Paint a material onto terrain using Soft Round, Hard Round, Coastline or Grain; each footprint works with every ground material. Grain scatters coverage; the selected material still supplies its own terrain-responsive texture.

| Family | Material | Character |
| --- | --- | --- |
| Living ground | Grass | Soft, tufted ground |
| Soils | Loam, Clay | Crumbly earth or smoother cracked soil |
| Stone | Bedrock, Scree | Layered rock or broken fragments |
| Wet ground | Mud | Dark, mottled ground responding to nearby water |
| Dry & cold | Sand, Snow | Rippled sand or sheltered snow |

Slope, hollows, lighting and proximity to sea or saved rivers influence the texture automatically. Hiding water does not remove the underlying river context. This changes appearance, not terrain elevation, material placement or physical water flow.

Use Opacity to blend materials, D/E to adjust it, and separate strokes to build coverage. Repeated samples within one held stroke respect its opacity cap. Shift+Paint with Surface paint selected erases coverage without changing terrain. Surface visibility and locks still apply.

Forest is a separate density action below the ground palette. It does not replace ground paint. Painted material textures appear in 2D, 3D and Map PNG exports. Heightmap and Biomes remain diagnostic views, and Heightmap exports contain only terrain elevations.

During an edit the renderer uses a smaller raster, then rebuilds finer texture on release. This can cause a short pause on larger maps, especially in Canvas fallback. Texture detail does not add editable terrain cells.

## Existing projects

The app writes schema9 and imports versions1–8. Existing painted colors/opacity remain intact; those painted areas acquire new material texture when repainted. New projects use procedural texture for natural unpainted ground as well. The saved file contains small material coverage values per cell, not texture images. Downloaded v9 projects require the current app.

Ground textures keep the same resolution while you hold a brush stroke and after release. The editor caches unchanged areas and updates affected pixels; it no longer blurs the whole map during editing.
