# Settlements and named places

Open **Settlements** in the right sidebar. This panel adds places without adding a toolbar tool.

## Place a settlement

1. Choose Hamlet, Village, or Town. Click **Place settlement**.
2. Move over gentle, dry ground. The preview and status explain whether the site is suitable.
3. Adjust Name, Size (50–150%), or Rotation (0–360°) while previewing.
4. Click a valid site, or press Enter after positioning the preview. Escape cancels without edits.

The whole circular footprint must fit inside the map, remain above sea level and river water, avoid other settlements, and have gentle slopes. A broad Flatten pass can prepare a site; choose the target height carefully. Placement itself never flattens ground. A smaller Hamlet is easier to fit on rugged terrain. A project supports up to 64 settlements.

## Edit and remove

Use **Select on map** and click a footprint, or choose a place in Existing settlements. Change its name, size, or rotation. Name changes commit when you leave the field; size and rotation commit when you release the control. Names are plain text, up to 80 characters; visible labels shorten long names.

**Move selected** opens a preview. Click the new site to confirm; Escape keeps the original. **Delete selected** removes the selected place. Erase → Settlements removes whole touched places, independently of brush Opacity. Undo/redo restores committed edits. Escape or **Back to terrain** exits settlement interaction; normal toolbar tools resume terrain editing.

## Layers, terrain and exports

The conditional **Settlements** layer can be hidden or locked. Both protect against editing/erasing. Visible settlement footprints suppress woodland, retaining the saved forest density. Hide or delete a settlement to reveal eligible woodland again. Roof relief is derived display geometry shared by 3D rendering and picking; it never changes bed heights.

Map PNG includes visible roofs, lanes and names. Heightmap PNG contains only actual ground/river-bed heights. Preview outlines and animation are excluded. Editing terrain later can make an existing site unsuitable: records stay in place, but moving/resizing requires a valid site. There is no automatic relocation or population simulation.

Project schema **6** stores settlement records and retains forest density; versions 1–5 migrate with an empty settlements list. Older app versions cannot read schema 6. Download an editable project backup. The source Holler Maps library has not been imported; these are original, deterministic building clusters with muted roofs.
