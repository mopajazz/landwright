# Brushes, height per stroke, and Opacity

## Start low before Raise or Lower

**Set Strength around 5–10% before your first Raise/Lower stroke (D/E adjusts it). Make a short stroke, inspect it in 3D, then build up with more strokes.** Raise and Lower start at 8%; the range is 1–100%.

Strength is how fast height changes while you brush: every pass adds more, so build ridges with several short strokes. Size controls area. Smooth and Flatten have their own Strength (35% by default); the two groups remember their settings separately for the session. Undo reverses a completed stroke.

Two more guards keep terrain natural:

- **Height range.** World Settings has *Seabed floor* (default 20) and *Highest peak* (default 190), inside the absolute 0–255 limits. Raise and Lower slow down as they approach these limits and never pass them. Flatten's target stays inside the range too. Each world saves its own range.
- **No needles.** Raise and Lower never make a single cell shoot up from its neighbors (steeper than about 68° as seen in 3D), so even 100% Strength with a tiny brush builds a steep knoll rather than a spike. Ordinary strokes never reach this limit, and existing cliffs are left alone.

Do not lower paint Opacity to tame sculpting: Raise, Lower, Smooth, Flatten, and Land do not use that setting. Opacity applies to Paint, Path, surface erasing, and forest painting/erasing.

## Choose action, footprint, and material separately

- Raise(R), Lower(L), Smooth(Q), Flatten(F), Land(C/M) change elevation. Land cuts or builds straight to its height, and cleans up any wall or pit one or two cells thick that a gap between passes would leave.
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

**D / E** make the current tool's main setting smaller / bigger: Strength for Raise, Lower and Smooth (1% steps up to 10%, then 5%), Carve depth for River (0.25 blocks) and Opacity for Paint and Path (5%). Shift+D/E takes four steps at once.

Flatten approaches Target height. For Flatten, D lowers / E raises the target by 1 block; Shift+D/E changes it by 10. The target stays between the world's Seabed floor and Highest peak. These shortcuts do not change Strength or paint Opacity, and choosing a target does not edit terrain until you brush. Typing and dialogs keep ordinary keyboard behavior. Preserve map edges holds the perimeter fixed and feathers nearby cells. Uncheck it only to intentionally reshape the rim. This protection is specific to Flatten, not every terrain tool.

## Why is my terrain too tall or too spiky?

Undo, lower Strength (press D), and build with several short strokes instead of one. To cap a whole world, lower *Highest peak* in World Settings; Raise will not go past it. Terrain made before v2.10 may already exceed the range; Raise leaves it as it is, and Smooth or Lower can bring it down.

Material texture is independent of footprint. Grain is available again: it gives deterministic scattered coverage with soft edges, using any selected material. It also works with sculpt tools and Forest density without switching tools. See [Earthen materials](materials.md) for blending, terrain response and old-project compatibility.


## Parchment

Choose **Parchment** in the View bar. Raise, Lower, and Land update the elevation ink as you sculpt. Use **Contours** to control elevation lines and shore echoes. Switch to **3D Terrain** to see the same marks follow the paper relief.

**Paint** offers Hatch, Stipple, Woodland, and Fine Line alongside the full material and biome palettes. The ink brushes share the project's existing Grass, Sand, Forest density, and Loam channels, so switching between Terrain and Parchment shows the same edits in each style. To download parchment artwork, select Parchment before opening **Worlds** and choosing a Map PNG.
