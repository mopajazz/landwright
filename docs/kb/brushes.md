# Brushes, height per stroke, and Opacity

## Start small before Raise or Lower

**Keep Height per stroke at 1–3 blocks for your first Raise/Lower strokes. Make a short stroke, inspect it in 3D, then build up with more strokes.** Raise and Lower start at 3 blocks; the range is 0.5–20.

*Height per stroke* is the most one stroke can add (Raise) or remove (Lower) under the center of the brush. Holding the pointer still or scrubbing back and forth inside one stroke cannot go past it; release and stroke again to build higher. Size controls area. Smooth and Flatten keep a percentage *Strength* (35% by default); the two groups remember their settings separately for the session. Undo reverses a completed stroke.

Two more guards keep terrain natural:

- **Height range.** World Settings has *Seabed floor* (default 20) and *Highest peak* (default 190), inside the absolute 0–255 limits. Raise and Lower slow down as they approach these limits and never pass them. Flatten's target stays inside the range too. Each world saves its own range.
- **Natural slopes.** A stroke never makes ground steeper than about 50° as seen in 3D, so even a tiny brush at 20 blocks builds a rounded knoll instead of a needle. Slopes that were already steeper are left alone.

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

Flatten approaches Target height. D lowers / E raises the target by 1 block; Shift+D/E changes it by 10. The target stays between the world's Seabed floor and Highest peak. These shortcuts do not change Strength or paint Opacity, and choosing a target does not edit terrain until you brush. Typing and dialogs keep ordinary keyboard behavior. Preserve map edges holds the perimeter fixed and feathers nearby cells. Uncheck it only to intentionally reshape the rim. This protection is specific to Flatten, not every terrain tool.

## Why is my terrain too tall or too spiky?

Undo, lower Height per stroke, and build with several short strokes instead of one. To cap a whole world, lower *Highest peak* in World Settings; Raise will not go past it. Terrain made before v2.10 may already exceed the range; Raise leaves it as it is, and Smooth or Lower can bring it down.

Material texture is independent of footprint. Grain is available again: it gives deterministic scattered coverage with soft edges, using any selected material. It also works with sculpt tools and Forest density without switching tools. See [Earthen materials](materials.md) for blending, terrain response and old-project compatibility.
