# Terrain-integrated woodland — v2.4

Approved direction: muted overlapping canopy texture, irregular connected woodland edges, soft shadows and clearings; replace outlined pine/oak stamps. Visual reference: approved concept image, not a screenshot or guaranteed pixel match. Keep existing v5 density, editing, layers, imports and undo.

1. Test deterministic coverage, habitat clipping, texture alpha/lighting, empty density and derived surface isolation. Then implement cached procedural crown/noise patterns and a woodland renderer in forests.mjs.
2. Compose the same woodland texture into 2D, 3D terrain and Map PNG. Replace new forest billboard drawing; preserve all legacy landmarks. Add shallow derived canopy relief to the shared display/picking surface, keeping saved ground and Heightmap exports unchanged.
3. Change canopy breeze from drawn twigs to restrained foliage glints. Keep bounded work and all pause/reduced-motion rules.
4. Run functional tests, review code, inspect actual browser screenshots and exported PNG on the same saved terrain as the approved concept. Iterate on visual fit, not merely passing tests. Check both themes and 2D/3D.
5. Update tutorial, KB, handoff and skill; publish on existing GitHub Pages and verify the release.
