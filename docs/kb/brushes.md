# Brushes, Strength, and Opacity

## Start low before Raise or Lower

**Set Strength around 5–10% before your first Raise/Lower stroke. Make a short stroke, inspect it, then increase gradually.** Raise and Lower now start at 8% Strength. Smooth and Flatten retain 35%; the two groups remember separate strengths for the session. The full 1–100% range remains available. Size controls area; Strength controls how strongly elevation changes. Holding the brush continues applying it. Undo reverses a completed edit.

Do not lower paint Opacity to tame sculpting: Raise, Lower, Smooth, Flatten, and Land do not use that setting. Opacity applies to Paint, Path, surface erasing, and forest painting/erasing.

## Choose action, footprint, and material separately

- Raise(R), Lower(L), Smooth(Q), Flatten(F), Land(C/M) change elevation.
- Paint(P/B) paints Grass, Loam, Clay, Bedrock, Scree, Mud, Sand, or Snow with terrain-responsive textures. Forest paints tree density instead; see [Forests](forests.md).
- Soft Round, Hard Round, and Coastline determine coverage. A footprint choice does not change the selected tool.
- Sand+Coastline works in Paint without raising/lowering terrain. Land is the separate tool for coastline height changes.
- W/S resizes by 1; Shift+W/S by 10; Shift+wheel also resizes. Ordinary diameter range is 4–120.

The terrain palette appears with Paint. Painting underwater is concealed by enabled Water. Forest has a target density slider and its own layer; it leaves ground color intact. Drawing and Details creation tools were removed.

## Opacity and erasing

**D decreases Opacity by 5%; E increases it by 5%.** These keys work with Paint and Path, clamp to0–100%, and do not change tools or Strength. Typing in fields and open dialogs keeps ordinary keyboard behavior.

There is no separate Erase tool. With Paint selected, hold Shift and click or drag. A ground material defaults the Shift target to Surface paint; Forest defaults it to Forests. The **Shift erase target** selector also offers existing river water and legacy drawings/landmarks. Selecting a target does not change the active tool; ordinary unmodified Paint still paints the selected material. Whole-object targets ignore Opacity, including at0%; surface/forest erasing uses Opacity.

Paint opacity accumulates across separate strokes. Repeated pointer samples inside one held stroke do not multiply coverage indefinitely. Shift+Paint reveals natural terrain color without changing heights. A hidden/locked Surface layer cannot be painted or erased. Forest density has separate Forests protection; Shift+Forest clears trees without changing ground color.

## Flatten edges

Flatten approaches Target height. D lowers / E raises the target by 1 block; Shift+D/E changes it by 10. The target clamps to 1–255. These shortcuts do not change Strength or paint Opacity, and choosing a target does not edit terrain until you brush. Typing and dialogs keep ordinary keyboard behavior. Preserve map edges holds the perimeter fixed and feathers nearby cells. Uncheck it only to intentionally reshape the rim. This protection is specific to Flatten, not every terrain tool.

## Why did my mountain jump so quickly?

Undo, reduce Strength, and use smaller/shorter gestures. Low Strength is the first control to try; a smaller brush only reduces area. Check whether you held the pointer in one place or made many passes before releasing.

Material texture is independent of footprint. Grain is available again: it gives deterministic scattered coverage with soft edges, using any selected material. It also works with sculpt tools and Forest density without switching tools. See [Earthen materials](materials.md) for blending, terrain response and old-project compatibility.
