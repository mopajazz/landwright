# Terrain workflow: next concepts

Proposed, not implemented: River and Path share a lightweight curve workflow (click to add points, drag to curve, double-click to finish, Escape to cancel). Keep controls to width and a few styles, with advanced behavior hidden. Support both 2D and 3D placement and undo.

Path paints a continuous terrain-following trail, initially dirt, stone, and sand. Preserve the route as editable points rather than introducing general shape tools.

River carves a channel with softened banks, adjustable width and optional depth. Rivers above sea level need their own local water surface with a downhill profile: the existing global ocean plane cannot represent upland rivers. Do not raise global sea level to fill river channels. Build on a shared curve foundation, implement Path first, then River carving and local water rendering/picking/export.

Storytelling is a later phase, after terrain tools are complete. Revisit scope with the user then. Named river/path records may become useful anchors, but narrative UI, quests, timelines, and AI features are deferred.
