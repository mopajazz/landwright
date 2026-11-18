# Paths, rivers, taper, and reflow

Choose Path(J) or River(V). Click points or drag; Enter/double-click/Finish route commits one undo group. Escape/Cancel discards a draft. Changing tools or 2D/3D mode cancels it. Middle-drag pans without adding route points. W/S adjusts width(2–32 blocks).

## Path

Choose Dirt, Stone, or Sand and set Opacity. Path paints terrain without changing heights. Surface erasing removes the visible trail. Finished control points cannot yet be moved individually. Sampled records remain saved even if paint is later erased and count toward route limits.

## River

Start upstream. Set Width and Channel depth(1–16). Taper defaults on: the source starts at 25% of the configured width and widens toward the mouth, with a small raster minimum so tiny streams remain visible. Old v4 rivers without taper metadata remain uniform.

Meander(0–100%, default 25%) displaces the centerline smoothly and deterministically while preserving both endpoints. At 100%, displacement is bounded by half the configured width. It is baked into saved geometry; it is not continuously random motion.

Water can exist above sea level. River profiles do not rise downstream; uphill ground is cut through. This is not a fluid simulation. Junctions and watersheds are not solved automatically.

## Reflow safely

World Settings→Reflow rivers appears when rivers exist. It samples the current terrain, recalculates local water profiles, and recuts channels in one undoable action. **Repeated reflow can deepen the already carved bed.** Undo restores both prior terrain and levels. Relief and River water must be visible and unlocked. Sculpting does not trigger automatic reflow.

## Visibility and erasing

Water off reveals the bed. Hiding River water hides local river water while retaining the channel. Paint → Shift erase target → River water, then Shift-click/drag, removes whole touched water routes but retains the carved terrain; undo restores them. To roll back both bed and water from creation, undo that river commit.

## Limits and saving

Current v5 projects retain river levels (v4 imports remain compatible),, taper metadata, and sampled route geometry. Paths and rivers share a 64-route limit,32,768 sampled points, and a bounded raster-work budget. Very long/wide/complex routes may need shortening. Save/download the editable project before substantial changes.
