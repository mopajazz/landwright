# Projects, exports, and troubleshooting

## Keep an editable backup

Use Download project or Ctrl/Cmd+S. The `.world.json` file contains terrain, paint, forest density, route geometry/levels, settlements, and layers. Import it to continue editing. Browser autosave is specific to this browser and hosting origin, has finite storage, and is not a cloud backup. The save badge distinguishes saving from a completed local save.

New world replaces the active canvas. Download anything important first; session undo is useful but is not a substitute for a file. Supported grid sizes are Small 128², Medium 192², Large 256². Versions 1–5 import into v6; new saves include forest density and settlements. Older app versions cannot read v6. Legacy dark-green Forest paint remains color until you paint new forest density deliberately.

## Export types

- Map image:1536² top-down PNG of the selected visualization and visible content, including static forests and visible settlements with names.
- Heightmap:N² grayscale PNG of actual terrain, including the carved river bed, without water surfaces, trees, or buildings.
- Project JSON: editable authoritative data, not an image.

Map export is not the orbit-camera screenshot. Neither PNG includes editor UI, route previews, or Living World atmosphere. Downloaded projects also do not store camera/tool/slider choices or Living World preferences.

## Common questions

**Sand does not appear.** Select Paint explicitly, choose Sand and a footprint, and check Surface visibility/lock. Enabled water conceals underwater paint. Land changes height, not paint.

**Raise/Lower is too strong.** Undo and start around 5–10% Strength. Use short strokes and increase gradually. Paint Opacity does not reduce sculpting power.

**I cannot finish a route.** Place at least two distinct points inside the map; make sure required layers are visible/unlocked. Use Enter, double-click, or Finish route. Very complex routes may exceed safety limits. Focus the canvas after editing a form field if keyboard shortcuts seem inactive.

**My river is dry or buried after sculpting.** Check Water and River water visibility. Reflow can recalculate and recut the river, but repeated reflow deepens the bed. Undo is available.

**The map edge appears bent in 3D.** This is projected elevation, not an automatic resize. Flatten preserves the perimeter by default; other tools can intentionally alter edges.

**Animation is paused.** Read the Living World status; editing, a route preview, reduced motion, hidden tabs, and diagnostic views pause effects intentionally.

**My forest is missing.** Check Forests visibility, density and suitable terrain. Water, cliffs and saved path corridors suppress trees while retaining density. [Forest guidance](forests.md) explains clearing, old paint, and dormant density.

**3D is slow.** Try a smaller map, disable Living World/clouds, and compare GPU versus Canvas in the renderer indicator. Canvas fallback has lower detail while orbiting. There is no guaranteed frame rate.

**Where are the asset library and story tools?** Holler Maps source assets have not been imported. The cloud editor cannot read the user's Windows folder or general ChatGPT Library automatically. Storytelling is deferred until terrain tools are ready.

## Main shortcuts

R Raise · L Lower · Q Smooth · F Flatten · C/M Land · P/B Paint · J Path · V River · H Pan. D/E decreases/increases Opacity by5% in Paint or Path. Shift-click/drag in Paint erases the chosen target. W/S changes brush or route width; Shift changes it by 10. Right/Alt-drag orbits in 3D; Space + left-drag or middle-drag pans. Ctrl/Cmd+Z undoes; Ctrl/Cmd+Shift+Z redoes. Escape cancels a route draft.
