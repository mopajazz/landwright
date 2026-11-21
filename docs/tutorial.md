# Landwright: your first living landscape

This tutorial covers the current v2.10 interface. It takes you from a flat field to a sculpted map with a path, river, forests and visual atmosphere. [Open Landwright](https://mopajazz.github.io/landwright/) or browse the [knowledge base](kb/index.md).

## Before your first stroke: start small

**Before using Raise or Lower, keep Height per stroke at 1–3 blocks. Make a short stroke, inspect the result in 3D, and build up with more strokes.** Raise and Lower start at 3 blocks. One stroke never adds more than that, even if you hold still, and the world's *Highest peak* and *Seabed floor* (World Settings) are never passed. Smooth and Flatten use a percentage Strength, starting at 35%.

Height per stroke and Strength are sculpting controls. **Opacity is separate:** it affects Paint, Path, surface erasing, and forest painting/erasing; lowering paint Opacity does not make Raise or Lower gentler. Use Ctrl/Cmd+Z if your first stroke is too strong.

## 1. Choose a starting canvas

1. Open New world.
2. Choose **Flat grass** for this exercise. It starts completely level at height 80.
3. Choose **Quick sketch · Small (128×128)** under Terrain detail. Standard uses 192×192; Detailed uses 256×256. The live preview follows your choices. Image export size is separate.
4. Give it a name. Use Download current project first if you need a backup, then select Create world.

Other starts include Island, Archipelago, Continent, Atoll, and Open ocean. Generation settings contains Seed and Relief. Creating a world replaces the active canvas, so download an important existing project first; undo is available within the current session.

## 2. Raise a ridge and lower a valley

1. Select **Raise (R)** and check that Height per stroke is 1–3 blocks before touching the map.
2. Use W/S to change brush size. Shift+W/S changes it by 10; Shift+wheel also resizes.
3. Drag a short, broad stroke. Release, look at the shape, and gradually build a ridge with additional short strokes.
4. Select **Lower (L)**. Keep Height per stroke small and make a shallow valley beside the ridge.
5. Use **Smooth (Q)** lightly if transitions become too abrupt.

Switch to **3D Terrain** to inspect your slopes. Right-drag or Alt-drag orbits; hold Space and left-drag to pan from any tool, or middle-drag; the wheel zooms. All terrain tools work in 3D as well as 2D.

Choose **Walk** to explore at eye level. Move with W/A/S/D and use the arrow keys to look, or click the terrain to enable mouse look. Press Esc or choose **Exit walk** to return to your previous view. Walk requires WebGL.

If you need a level area, **Flatten (F)** approaches its target height. Press D/E to lower/raise that target by 1 block, or Shift+D/E by 10. These keys adjust the target, not Strength. Preserve map edges is on by default so flattening does not move the outer rim in 3D. Only turn it off when you want to reshape the border itself.

## 3. Paint a shoreline or rocky ridge

1. Select **Paint (P or B)**.
2. Choose **Sand** and the **Coastline** footprint.
3. Use D/E to decrease/increase Opacity in5% steps. Start with modest Opacity and paint along a dry bank. Repeat separate strokes to build color.
4. Try Bedrock on your ridge and Grass in the lowlands.

Tool, material, and footprint are separate choices. Choosing Sand does not select Paint for you, and Coastline does not secretly become a land-raising tool. Use **Land (C or M)** to add land; hold Shift with Land to remove it. Forest is different from the ground materials: it paints tree density without recoloring the ground.

## 4. Place a path

1. Choose **Path (J)**.
2. In its settings, choose Loam, Bedrock, or Sand, and set Width. W/S adjusts route width while this tool is active.
3. Click two or more points or drag a curve. The ribbon is only a preview.
4. Press Enter, double-click, or use Finish route to commit.
5. Escape cancels an unfinished route without changing the map.

Path changes surface paint, not elevation. It uses Opacity. A completed path is one undo step; individual points cannot yet be repositioned afterward.

## 5. Carve a river

1. Choose **River (V)**.
2. Start with a modest Width and Channel depth.
3. Taper is enabled by default. The river begins narrow and widens toward its mouth.
4. Meander defaults to 25%. It adds a deterministic curve while keeping the first and last points exact. Set it to 0% for the route you placed without extra meander.
5. Place points **from upstream toward downstream**, then finish.

River water has its own local levels and can exist above the ocean. The river cuts through rising terrain to maintain a non-rising profile; this is an authored terrain tool, not a fluid simulation.

In the sea-connected water draft, a low basin stays dry until you open a channel from the ocean. Start with short Lower strokes at 1–3 blocks per stroke. With **Living World → Water motion** enabled in Terrain view, you can see the advance during sculpting. Turning motion off shows the settled water immediately.

Use Water off/on to inspect the bed. The River water layer hides local river water without undoing the channel. Paint → Shift erase target → River water, then Shift-click/drag, removes whole touched water routes and leaves their channels; undo restores the water record.

**Reflow rivers:** after sculpting near a river, World Settings offers an undoable reflow action. It recalculates from the current bed and recuts channels beneath the updated levels. **Repeated use can deepen the bed.** Use undo if the result is stronger than intended. Relief and River water must be visible and unlocked.

To add still water, choose **River → Fill / drain basin**. Set **Fill depth**, click an enclosed low spot, and Shift-click inside the fill to drain it. Each action can be undone.

## 6. Plant a forest and make a clearing

1. Choose **Paint → Forest**, keeping the same Paint tool and footprint controls.
2. Start with **Forest density 40–65%** and modest Opacity. Brush a woodland onto gentle, dry land. It appears as textured canopy clusters with natural gaps, rather than outlined tree stamps.
3. Hold Shift to clear trees, or use **Paint → Forest, then Shift-click/drag**. Ground color stays intact.
4. The conditional Forests layer lets you hide or lock the woodland. Undo restores a clearing.

Trees avoid water, steep slopes, and saved path corridors. Density remains saved where unsuitable terrain hides trees; erase it if you want permanent removal. See [Forests and clearings](kb/forests.md) for target density, old-map compatibility, and path-corridor limits.

## 7. Let the landscape breathe

World Settings contains **Living World**, enabled by default. It adds subtle water shimmer, downstream river streaks, drifting clouds, and gentle cloud shadows. Expand Atmosphere settings to choose Water motion, Clouds & soft shadows, or Canopy breeze separately. Canopy breeze adds subtle moving foliage glints; trees remain visible when animation is off.

- These are visual effects, not terrain edits or a civilization simulation.
- Effects pause while you sculpt, pan/orbit, or have a route preview open, leaving the editor clear.
- Hidden tabs stop the animation loop. Reduced-motion preferences also pause it.
- Heightmap and Biomes views stay free of atmospheric overlays.
- Turn Living World off for a completely static workspace.

The effects do not enter project history or exports. See [Living World](kb/living-world.md) for scope and performance details. Growth simulation, boats, travelers, day/night, and storytelling remain future topics.

## 8. Save something you can return to

Use **Download project** in the header, or Ctrl/Cmd+S. Keep the `.world.json` file: it contains editable terrain, paint, forest density, river records and layer settings. Browser autosave is useful but tied to this browser and hosting origin.

Open Export map, choose 1024, 2048 or 4096 pixels, then Map image for a square top-down PNG. This changes image resolution without changing terrain detail. Export Heightmap for the actual bed elevations at your selected map size. Neither export includes the cursor, route preview, editor UI, or Living World effects. Map export is not a screenshot of your 3D camera.

## Next steps

- [Starting worlds and export resolution](kb/worlds.md)
- [Brush strength and painting](kb/brushes.md)
- [Rivers, paths, and reflow](kb/routes.md)
- [Forests and clearings](kb/forests.md)
- [Living World](kb/living-world.md)
- [Saving, exporting, and troubleshooting](kb/projects.md)
- [Engineering handoff](../handoff.md)

If you get lost, open Help & shortcuts in the application. Practice on a disposable map and use short strokes; a few controlled passes are easier to shape than one powerful held brush.

## Materials belong to the landscape

Paint offers eight ground materials in compact family groups: Grass, Loam, Clay, Bedrock, Scree, Mud, Sand and Snow. Try Clay beside a river, Scree below a ridge, and Snow across a sheltered hollow. Their procedural textures respond automatically to the underlying slope, shelter and nearby water. This is a visual response; materials do not move cells or simulate erosion.

Soft Round, Hard Round, Coastline and Grain control your stroke coverage. Grain makes a soft-edged scatter: try it with Loam or Scree at low Opacity for broken patches. The material still supplies its own terrain-responsive texture. D/E changes Opacity; successive strokes blend materials. Shift+Paint erases surface coverage and reveals the natural ground. Forest stays below the ground palette as a separate density layer. See [Earthen materials](kb/materials.md).
