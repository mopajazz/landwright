# Rivers and paths

## River: draw it and watch it carve

Choose **River (V)**. It is a brush, like Raise or Lower: **W/S changes its width** (the brush size) and the footprint presets apply. It has one setting:

- **Carve depth** (0.25–4 blocks, default 1.5) is how much one stroke cuts under the center of the brush. Holding still cannot cut more; go over the river again to deepen it. D/E changes it (Shift: four steps).

The river goes where your hand draws it: bend your stroke to bend the river. As you draw, the channel is kept running **downhill along your stroke**: each new point is held a little below the last, cutting through small rises (up to about 6 blocks), so water stays in the line you drew. While you drag, a little water runs down the trail, and moving water deepens its bed and carries sediment, which settles where the flow slows: at the foot of slopes, on flats, and where the river meets the sea (just below sea level). Erosion only happens while you draw.

When you release, the stroke leaves a **creek**: a thin film of water lying in the channel from where you started to where you stopped, never rising downstream. With Living World's Water motion on, streaks show which way it runs. Small bumps along the channel are trimmed so the creek is continuous. A creek is still water: it cannot spread, so one pass never floods the land around it. The stroke's own running water comes from a short-lived spring at its start and soon drains to the sea or the map edge.

**More water is deliberate:** use the **droplet** (below) to pour as much as you want; the creek's channel guides it. **Shift + drag** with River dries a stretch: it removes the creek water, springs and standing water under the brush and keeps the channel, so you can inspect it and try again. *Drain floodwater* clears all flowing and poured water at once (undoable).

If you draw over a ridge taller than the channel can cut through, that stretch stays dry: water does not run uphill. The carving respects the world's Seabed floor, and a hidden or locked Relief layer blocks it. Each stroke is one undo step.

## Other water modes

- **Droplet:** add water without carving. Click, or hold to keep pouring; *Pour amount* sets each dose. Shift-click removes water at that spot. This is how you flood a meadow or fill a lake on purpose.
- **Fill / drain basin:** fill an enclosed hollow to a chosen depth; Shift-click inside it to drain.

## Path: lay a track

Choose **Path (J)**, pick Loam, Bedrock or Sand, and drag. Paths paint the surface with the brush footprint and Opacity (D/E), clear trees under the track, and never change heights. Shift-erase it with Paint like any surface paint.

## Older maps

Maps made before v2.11 may contain rivers and paths drawn with the previous point-by-point tool. They still load and draw. Their river water has fixed levels; **World Settings → Reflow rivers** recalculates those levels from the current terrain and recuts the channel (repeating it can deepen the bed). Their saved path corridors still keep trees away. Paint → Shift erase target → River water removes an old river's water and keeps its channel.
