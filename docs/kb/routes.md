# Rivers and paths

## River: draw it and watch it carve

Choose **River (V)**. It is a brush, like Raise or Lower: W/S changes its size and the footprint presets apply.

- **Carve per stroke** (0.25–4 blocks, default 1.5) is how much one stroke cuts under the center of the brush. Holding still cannot cut more; go over the river again to deepen it.
- **Water** (0–100%, default 60%) is how much water the stroke releases. At 0% it only carves.
- **Meander** (0–100%, default 40%) swings the channel from side to side of your stroke in smooth, uneven bends, so even a straight drag makes a winding river. At 40% the bends reach about 5 blocks either side with a size-10 brush; at 100% about 12. The swing builds up over the first bend, so the spring stays where you started.

D/E changes Carve per stroke (Shift: four steps).

As you draw, the channel is kept running **downhill along your stroke**: each new point is held a little below the last, cutting through small rises (up to about 6 blocks, or 4 × Carve per stroke), so the water stays in the river you drew. While you drag, the trail stays wet, water runs downhill, and moving water erodes its bed and carries sediment. Sediment settles where the flow slows: at the foot of slopes, on flats, and where the river meets the sea (just below sea level). Erosion only happens while you draw.

When you release, the **start of the stroke becomes a spring**. Springs keep feeding water, so the river keeps flowing; the sea and the map edge drain it, and water that cannot escape fills hollows into lakes. Springs are saved with the map (up to 64).

**Shift + drag** with River dries an area: it removes springs and standing water under the brush. The carved channel stays.

Gravity decides the final course: water follows the land, not your exact line. The carving respects the world's Seabed floor, and a hidden or locked Relief layer blocks it. Each stroke is one undo step.

## Other water modes

- **Droplet:** pour water without carving. Click, or hold to keep pouring; Shift-click removes water at that spot.
- **Fill / drain basin:** fill an enclosed hollow to a chosen depth; Shift-click inside it to drain.

## Path: lay a track

Choose **Path (J)**, pick Loam, Bedrock or Sand, and drag. Paths paint the surface with the brush footprint and Opacity (D/E), clear trees under the track, and never change heights. Shift-erase it with Paint like any surface paint.

## Older maps

Maps made before v2.11 may contain rivers and paths drawn with the previous point-by-point tool. They still load and draw. Their river water has fixed levels; **World Settings → Reflow rivers** recalculates those levels from the current terrain and recuts the channel (repeating it can deepen the bed). Their saved path corridors still keep trees away. Paint → Shift erase target → River water removes an old river's water and keeps its channel.
