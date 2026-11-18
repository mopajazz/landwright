# Forests and clearings

## Paint a woodland

1. Select **Paint (P/B)** and **Forest** in the material palette. This keeps Paint selected; there is no extra tool or Forest Scatter footprint.
2. Choose a footprint and brush size. Soft Round gives gentle boundaries; Hard Round makes a clear patch; Coastline and Grain also work.
3. Set **Forest density** (default 65%). Start around 40–65% for open woodland. Set Opacity below 100% for a gentler application.
4. Brush across suitable land. Switch to 3D to inspect the integrated canopy following the slopes.

Forest paints tree density, leaving ground color and elevation intact. Other materials still paint the ground. Density is a **target**, not a growth rate: on empty land, density 80% at opacity 50% gives 40% density; a second separate stroke approaches 60%. Repeated samples within one held stroke do not multiply opacity. A lower target thins existing woodland.

## Clear or protect trees

Hold Shift while painting Forest to clear density, or choose **Paint → Forest, then Shift-click/drag**. Opacity controls how much is removed. Surface paint erasing changes ground color and leaves trees alone. Forests has its own conditional layer: hide it for comparison or lock it to protect density edits. The row and eraser target appear whenever saved density is nonzero, even if terrain currently prevents visible trees. Clearing the final density removes those controls after the gesture ends.

Undo/Redo restores the full density edit. Escape stops a brush stroke and keeps edits already applied; it only discards uncommitted geometry for Path/River.

## How woodland follows the terrain

Woodland is a continuous procedural canopy surface, not a set of outlined tree stamps. Saved density drives irregular connected foliage, grassy gaps and softer edges. Crown sizes and shading vary deterministically, so the woodland does not reshuffle when redrawn or reloaded. Density controls the target field; the visible proportion of canopy also depends on natural gaps and terrain eligibility.

Trees avoid heights below sea level +2, neighboring height changes over 6 blocks, local river water, and committed Path corridors. Water/River water visibility switches do not make submerged land plantable. Suitable terrain changes update visible trees automatically.

Density is retained beneath unsuitable terrain: flood or steepen a woodland and trees disappear; restore suitable land and they return. Erase Forests to remove that saved density. Path blockers follow saved route geometry, so surface-erasing a path does **not** release its corridor; undo the Path commit to remove that record. Finished route editing/management is still future work.

## Living World canopy breeze

World Settings → Living World → Atmosphere settings includes **Canopy breeze** (on by default). It animates subtle foliage glints at up to 256 canopy locations, without changing the terrain or regenerating the woodland texture each animation frame. The forest itself stays visible when motion is off, paused, or reduced motion is enabled. The existing edit/route/orbit/hidden-tab/diagnostic pause behavior applies. Motion preferences belong to this browser, not the map.

## Saves, exports and compatibility

New project downloads/autosaves use **schema v5**, including a density value per map cell and a Forests visibility/lock state. Versions 1–4 still import. Their old dark-green Forest paint remains unchanged; it is not automatically converted into trees. Paint Forest over it to add woodland deliberately. Older application versions do not load v5 projects.

Visible static forests appear in Map PNGs and both 2D/3D workspaces. Heightmap visualization/exports omit trees and use the actual ground. Map PNGs omit canopy motion and atmosphere. The 3D display adds a shallow, derived canopy surface; picking and brush placement use that same displayed surface. Saved terrain and heightmaps retain the underlying ground. Hiding Forests removes both canopy color and visual relief. The GPU uses the cached terrain texture; Canvas fallback texture-maps woodland onto its lighter mesh and temporarily reduces detail during orbit. Dense woodland costs rendering time; use a smaller world or lower density if needed.

The woodland is generated procedurally. Existing legacy landmark symbols remain compatible; they are separate content. They are not the unavailable Holler Maps library. No growth simulation, ecosystem, inhabitants, or storytelling tools are included.

The outer two map cells have no canopy, with an inward transition to preserve the projected rim. Woodland is computed at lower texture resolution during a stroke, with full detail restored on release or cancellation.
