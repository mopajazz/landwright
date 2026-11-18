# Brushes, Strength, and Opacity

## Start low before Raise or Lower

**Set Strength around 5–10% before your first Raise/Lower stroke. Make a short stroke, inspect it, then increase gradually.** The current default Strength is 35%, so deliberately lower it for early practice. Size controls area; Strength controls how strongly elevation changes. Holding the brush continues applying it. Undo reverses a completed edit.

Do not lower paint Opacity to tame sculpting: Raise, Lower, Smooth, Flatten, and Land do not use that setting. Opacity applies to Paint, Path, surface erasing, and forest painting/erasing.

## Choose action, footprint, and material separately

- Raise(R), Lower(L), Smooth(Q), Flatten(F), Land(C/M) change elevation.
- Paint(P/B) changes ground color with Grass, Sand, Stone, Snow, or Dirt. Forest paints tree density instead; see [Forests](forests.md).
- Soft Round, Hard Round, Coastline, and Grain determine coverage. A footprint choice does not change the selected tool.
- Sand+Coastline works in Paint without raising/lowering terrain. Land is the separate tool for coastline height changes.
- W/S resizes by 1; Shift+W/S by 10; Shift+wheel also resizes. Ordinary diameter range is 4–120.

The terrain palette appears with Paint. Painting underwater is concealed by enabled Water. Forest has a target density slider and its own layer; it leaves ground color intact. Drawing and Details creation tools were removed.

## Opacity and erasing

Paint opacity accumulates across separate strokes. Repeated pointer samples inside one held stroke do not multiply coverage indefinitely. Shift+Paint or Erase→Surface paint reveals natural terrain color without changing heights. A hidden/locked Surface layer cannot be painted or erased. Forest density has separate Forests protection; Shift+Forest or Erase→Forests clears trees without changing ground color.

## Flatten edges

Flatten approaches Target height. Preserve map edges holds the perimeter fixed and feathers nearby cells. Uncheck it only to intentionally reshape the rim. This protection is specific to Flatten, not every terrain tool.

## Why did my mountain jump so quickly?

Undo, reduce Strength, and use smaller/shorter gestures. Low Strength is the first control to try; a smaller brush only reduces area. Check whether you held the pointer in one place or made many passes before releasing.
