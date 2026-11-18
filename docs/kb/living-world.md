# Living World: water and atmosphere

## Enable or pause

Find Living World in World Settings. It is on by default for this first pass. Expand Atmosphere settings to independently choose Water motion and Clouds & soft shadows. Turning it off clears the visual overlay and stops its animation loop.

Preferences are local to this browser under `landwright-living`. They are not terrain/project properties and do not change undo history.

## What it does

- Ocean and visible river water receive gentle shimmer strokes.
- River streaks travel in sampled source-to-mouth order. They are visual indicators, not moving water volumes.
- A small number of clouds drift over the landscape with low-opacity shadows.
- The separate overlay works in 2D and 3D; the base map and terrain geometry remain authoritative.

This pass does not add vegetation, creatures, settlements, boats, travelers, day/night, weather simulation, or storytelling. Those remain future work. Cloud shadows are stylized projected overlays, not physically accurate lighting or volumetric clouds.

## Automatic pause behavior

Motion pauses during terrain gestures, panning/orbiting, and open route previews. It resumes when the gesture/preview ends. It also stops in hidden tabs, in Heightmap/Biomes views, and when the browser reports `prefers-reduced-motion: reduce`. The status text explains why motion is paused. If both effect options are off, no animation is needed.

The loop targets at most 30 effect draws per second and does not continuously rebuild terrain or repaint the full 3D mesh. A device may still run slowly; disable Clouds first or turn Living World off. Actual frame rate depends on hardware and map complexity.

## Does it change my map or exports?

No. Effects do not carve terrain, change paint, alter river records, trigger reflow, enter project saves, or appear in Map/Heightmap exports. Export produces clean static cartography. Browser screenshots can capture the atmosphere, but no video/animated export is included.

## Why is nothing moving?

Check the Living World switch, its two options, the displayed pause status, and Terrain view. Finish/cancel an open route. Water motion needs Water enabled and visible wet terrain. Reduced-motion preferences intentionally prevent animation; there is no forced-motion override in this first pass.
