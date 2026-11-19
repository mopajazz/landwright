# Settlements shaped by terrain

Select **Paint (P/B) → Settlements** in the left toolbox. Choose Hamlet, Village, Town, Abbey or Castle. W/S changes the search-brush diameter; Shift+W/S changes it by10. Brush across an area, then release to inspect the actual proposed layout. Paint more area to extend the search.

- Hamlet: a few roofs and a short approach.
- Village: buildings follow a lane guided by a riverbank or gentle contour.
- Town: an open square with branching lanes.
- Abbey: a main hall and, where there is room, a court and outbuildings.
- Castle: a keep on a high usable shoulder, with walls and a court where the ground permits them.

The outlined area is where the planner may search. It is not a stamp that fills every cell. Water, steep slopes, map edges and existing built features leave gaps. Only the connected buildable region is used. A partly suitable area can fit a smaller place; if no viable layout fits, enlarge the search or choose gentler dry ground. Abbey requires room for its main hall and Castle for its keep; courts/walls can be omitted on constrained sites.

Give the place an optional name. Select **Place settlement** or press Enter to commit the layout you inspected. One Undo removes the whole placement; Redo restores the same buildings and lanes. Enter also works from Place name. Escape or Cancel discards a preview. Switching tools or Paint modes cancels it. Space-pan and switching2D/3D retain it. Sea-level changes rebuild the preview before you can commit.

## Keep your landscape

Placement never flattens terrain, paints ground or deletes forest density. Woodland is suppressed only along buildings, lanes, courts and walls. Later sculpting keeps the chosen horizontal layout; buildings follow the newly rendered ground. There is no automatic replanning, flood relocation, erosion or civilization simulation.

Shift+brush in Settlements mode erases a whole saved place when the brush touches a built feature. In Ground mode, choose Settlements in Shift erase target. Hidden/locked settlements cannot be placed or erased. Old seeded settlements retain their older circular erase footprints.

Ground-paint Opacity and D/E do not affect settlement placement. Flatten still uses D/E for Target height; Ground Paint and Path use it for Opacity.

## Saving and exports

New project files use schema8 and save the actual layout. Versions1–7 still import with their prior content preserved. Older applications cannot read v8 files. Uncommitted previews never enter project downloads, autosave, MapPNG or Heightmap exports. Committed visible places appear in2D,3D and MapPNG, including names. Heightmap exports remain bed-only. Hidden content stays saved.

A maximum64 settlements and a shared geometry-work budget keep imported projects and previews bounded. A very large brush does not guarantee a city fills it; each place type caps its building count.

[Practice project: Reaches & Ridges](../examples/river-and-hillside.world.json) contains a riverside and hillside Village built with the same42-block search brush. Compare their lanes, then try your own places. Back up your active project before importing.
