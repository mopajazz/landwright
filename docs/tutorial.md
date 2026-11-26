# Landwright: your first living landscape

This tutorial covers the current v2.11 interface. It takes you from a flat field to a sculpted map with a path, river, forests and visual atmosphere. [Open Landwright](https://mopajazz.github.io/landwright/) or browse the [knowledge base](kb/index.md).

## Before your first stroke: start with low Strength

**Before using Raise or Lower, set Strength to around 5–10%. Make a short stroke, inspect the result in 3D, and build up with more strokes.** Raise and Lower start at 8%; press D/E to change it. The world's *Highest peak* and *Seabed floor* (World Settings) are never passed. Smooth and Flatten have their own Strength, starting at 35%.

Strength is sculpting power. **Opacity is separate:** it affects Paint, Path, surface erasing, and forest painting/erasing; lowering paint Opacity does not make Raise or Lower gentler. Use Ctrl/Cmd+Z if your first stroke is too strong.

## 1. Choose a starting canvas

1. Select **Worlds** in the header, then the **New world** tile.
2. Choose **Flat grass** for this exercise. It starts completely level at height 80.
3. Choose **Quick sketch · Small (128×128)** under Terrain detail. Standard uses 192×192; Detailed uses 256×256. The live preview follows your choices. Image export size is separate.
4. Give it a name, then select Create world.

Other starts include Island, Archipelago, Continent, Atoll, and Open ocean. Generation settings contains Seed and Relief. Creating a world adds it beside your other worlds and opens it. The world you had open is saved and stays in Worlds unchanged.

## 2. Raise a ridge and lower a valley

1. Select **Raise (R)** and check that Strength is 5–10% before touching the map.
2. Use W/S to change brush size. Shift+W/S changes it by 10; Shift+wheel also resizes.
3. Drag a short, broad stroke. Release, look at the shape, and gradually build a ridge with additional short strokes.
4. Select **Lower (L)**. Keep Strength low and make a shallow valley beside the ridge.
5. Use **Smooth (Q)** lightly if transitions become too abrupt.

Switch to **3D Terrain** to inspect your slopes. Right-drag or Alt-drag orbits; hold Space and left-drag to pan from any tool, or middle-drag; the wheel zooms. All terrain tools work in 3D as well as 2D.

Choose **Walk** to explore at eye level. You arrive hovering above lowland at the edge of the land, looking inland. Move with W/A/S/D, hold **Space** to fly up and **Shift** to descend; descend all the way to land and walk on the ground. Use the arrow keys to look, or click the terrain to enable mouse look. Press Esc or choose **Exit walk** to return to your previous view. Walk requires WebGL.

If you need a level area, **Flatten (F)** approaches its target height. Press D/E to lower/raise that target by 1 block, or Shift+D/E by 10. These keys adjust the target, not Strength. Preserve map edges is on by default so flattening does not move the outer rim in 3D. Only turn it off when you want to reshape the border itself.

## 3. Paint a shoreline or rocky ridge

1. Select **Paint (P or B)**.
2. Choose **Sand** and the **Coastline** footprint.
3. Use D/E to decrease/increase Opacity in5% steps. Start with modest Opacity and paint along a dry bank. Repeat separate strokes to build color.
4. Try Bedrock on your ridge and Grass in the lowlands.

Tool, material, and footprint are separate choices. Choosing Sand does not select Paint for you, and Coastline does not secretly become a land-raising tool. Use **Land (C or M)** to add land; hold Shift with Land to remove it. Forest is different from the ground materials: it paints tree density without recoloring the ground.

## 4. Lay a path

1. Choose **Path (J)** and pick its surface: Loam, Bedrock or Sand.
2. Set the brush Size with W/S and the Opacity with D/E.
3. Drag across the map. The track paints the surface and keeps trees off it; it never changes heights.

There are no points to place and nothing to finish: each drag is one stroke and one undo step.

## 5. Carve a river

1. Choose **River (V)**. Its only setting is *Carve depth* (default 1.5 blocks; D/E to change). The brush size (W/S) sets the width.
2. Drag from high ground toward the sea, down a valley if you can. The river goes where you draw it, so bend your stroke for bends. The ground under the brush is lowered, the channel is kept running downhill along your stroke, and a little water runs down it as you draw, deepening the bed and carrying sediment to where the flow slows.
3. Release. The stroke leaves a **creek**: a thin film of water in the channel that shows its course. Turn on *Living World → Water motion* to see which way it runs. One pass never floods the land around it.
4. Want more water? Use the **droplet** and hold it at the head of the creek. Go over a river again to cut deeper. Hold **Shift** while dragging to dry a stretch and try again.

If you draw over a ridge, the channel cuts through small rises; beyond that the stretch stays dry, because water does not run uphill. Erosion only happens while you are drawing.

In the sea-connected water draft, a low basin stays dry until you open a channel from the ocean. Start with short Lower strokes at 5–10% Strength. With **Living World → Water motion** enabled in Terrain view, you can see the advance during sculpting. Turning motion off shows the settled water immediately.

Use Water off/on to inspect the bed. The River water layer hides river water without undoing the channel.

**Older maps** may contain rivers drawn with the previous point-by-point tool. They still load and draw. **Reflow rivers** in World Settings applies to them: It recalculates from the current bed and recuts channels beneath the updated levels. **Repeated use can deepen the bed.** Use undo if the result is stronger than intended. Relief and River water must be visible and unlocked.

To pour water without carving, use **River → droplet**. To add still water, choose **River → Fill / drain basin**. Set **Fill depth**, click an enclosed low spot, and Shift-click inside the fill to drain it. Each action can be undone.

## 6. Plant a forest and make a clearing

1. Choose **Paint → Forest**, keeping the same Paint tool and footprint controls.
2. Start with **Forest density 40–65%** and modest Opacity. Brush a woodland onto gentle, dry land. It appears as textured canopy clusters with natural gaps, rather than outlined tree stamps.
3. Hold Shift to clear trees, or use **Paint → Forest, then Shift-click/drag**. Ground color stays intact.
4. The conditional Forests layer lets you hide or lock the woodland. Undo restores a clearing.

Trees avoid water, steep slopes, and paths (new paths clear the trees they cross; older maps' saved path corridors still block them). Density remains saved where unsuitable terrain hides trees; erase it if you want permanent removal. See [Forests and clearings](kb/forests.md) for target density, old-map compatibility, and path-corridor limits.

## 7. Let the landscape breathe

World Settings contains **Living World**, enabled by default. It adds subtle water shimmer, downstream river streaks, drifting clouds, and gentle cloud shadows. Expand Atmosphere settings to choose Water motion, Clouds & soft shadows, or Canopy breeze separately. Canopy breeze adds subtle moving foliage glints; trees remain visible when animation is off.

- These are visual effects, not terrain edits or a civilization simulation.
- Effects pause while you sculpt, pan/orbit, or have a route preview open, leaving the editor clear.
- Hidden tabs stop the animation loop. Reduced-motion preferences also pause it.
- Heightmap and Biomes views stay free of atmospheric overlays.
- Turn Living World off for a completely static workspace.

The effects do not enter project history or exports. See [Living World](kb/living-world.md) for scope and performance details. Growth simulation, boats, travelers, day/night, and storytelling remain future topics.

## 8. Save something you can return to

Your world saves itself as you work, and Ctrl/Cmd+S saves immediately. Every world is kept in **Worlds**, but only in this browser: clearing the site's data erases them. For anything you care about, open Worlds, select **⋯** on the world, then **Download backup file**. Keep the `.world.json` file: it contains editable terrain, paint, forest density, river records and layer settings, and **Import** in Worlds brings it back in any browser.

For a picture, open Worlds, select **⋯** on the world, then **Download artwork** and a Map image size (1024, 2048 or 4096 pixels) for a square top-down PNG. This changes image resolution without changing terrain detail. Heightmap gives the actual bed elevations at the world's size. This works for worlds that are not open, too. Neither export includes the cursor, route preview, editor UI, or Living World effects. Map export is not a screenshot of your 3D camera.

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
