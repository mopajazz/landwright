# Forests and clearings

## Paint a woodland

1. Select **Paint (P/B)** and **Forest** in the material palette. This keeps Paint selected; there is no extra tool or Forest Scatter footprint.
2. Choose a footprint and brush size. Soft Round gives gentle boundaries; Hard Round makes a clear patch; Coastline and Grain also work.
3. Set **Forest density** (default 65%). Start around 40–65% for open woodland. Set Opacity below 100% for a gentler application.
4. Brush across suitable land. Switch to 3D to inspect the small original pine/broadleaf symbols.

Forest paints tree density, leaving ground color and elevation intact. Other materials still paint the ground. Density is a **target**, not a growth rate: on empty land, density 80% at opacity 50% gives 40% density; a second separate stroke approaches 60%. Repeated samples within one held stroke do not multiply opacity. A lower target thins existing woodland.

## Clear or protect trees

Hold Shift while painting Forest to clear density, or choose **Erase → Forests**. Opacity controls how much is removed. Surface paint erasing changes ground color and leaves trees alone. Forests has its own conditional layer: hide it for comparison or lock it to protect density edits. The row and eraser target appear whenever saved density is nonzero, even if terrain currently prevents visible trees. Clearing the final density removes those controls after the gesture ends.

Undo/Redo restores the full density edit. Escape stops a brush stroke and keeps edits already applied; it only discards uncommitted geometry for Path/River.

## Where trees can appear

Stable tree candidates lie on a jittered four-block lattice. Density chooses a deterministic subset, with an upper bound of 4,096 candidates on Large maps (the inset edge margin makes the actual maximum slightly lower). Tree positions/types do not reshuffle on redraw or reload.

Trees avoid heights below sea level +2, neighboring height changes over 6 blocks, local river water, and committed Path corridors. Water/River water visibility switches do not make submerged land plantable. Suitable terrain changes update visible trees automatically.

Density is retained beneath unsuitable terrain: flood or steepen a woodland and trees disappear; restore suitable land and they return. Erase Forests to remove that saved density. Path blockers follow saved route geometry, so surface-erasing a path does **not** release its corridor; undo the Path commit to remove that record. Finished route editing/management is still future work.

## Living World canopy breeze

World Settings → Living World → Atmosphere settings includes **Canopy breeze** (on by default). It animates small leaf/branch accents over a bounded subset of trees, not every tree mesh. The forest itself stays visible when motion is off, paused, or reduced motion is enabled. The existing edit/route/orbit/hidden-tab/diagnostic pause behavior applies. Motion preferences belong to this browser, not the map.

## Saves, exports and compatibility

New project downloads/autosaves use **schema v5**, including a density value per map cell and a Forests visibility/lock state. Versions 1–4 still import. Their old dark-green Forest paint remains unchanged; it is not automatically converted into trees. Paint Forest over it to add woodland deliberately. Older application versions do not load v5 projects.

Visible static forests appear in Map PNGs and both 2D/3D workspaces. Heightmap visualization/exports omit trees and use the actual ground. Map PNGs omit canopy motion and atmosphere. The GPU renderer batches sprites; Canvas fallback uses projected sprites and has less precise terrain occlusion. Dense woodland costs rendering time; use a smaller world or lower density if needed.

These symbols are original artwork. They are not the unavailable Holler Maps library. No growth simulation, ecosystem, inhabitants, or storytelling tools are included.
