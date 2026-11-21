# Starting worlds and export resolution

Open **New world**. Give the world a name, choose one of six starting terrains and inspect the large preview. Shape, terrain detail, seed and relief update the preview without touching the current map. Island, Archipelago, Continent and Atoll generate land; Open ocean begins underwater and Flat grass is entirely level at height 80. An enclosed Atoll basin starts dry in the reactive-water draft. A channel below sea level lets ocean water reach the basin. Generation settings contains a repeatable seed and relief; relief is disabled for level starts.

## Terrain detail

| Choice | Editable grid | Samples | Use |
| --- | --- | --- | --- |
| Quick sketch · Small |128×128|16,384|Lightest workload, quick ideas|
| Standard · Medium |192×192|36,864|Balance of detail and speed|
| Detailed · Large |256×256|65,536|Finer edits, four times Quick sketch’s samples|
| Experimental |512×512|262,144|Finer edits with a higher frame time and memory cost|

Every size supports 2D and 3D editing and the same image export options. At 512 × 512, material paint can exceed browser autosave storage. Use **Save project** to download the editable JSON if the save badge reports a storage limit. See the [512 terrain experiment](../terrain-resolution-512.md) for profiling results.

## Keep the current world

**Download current project first** saves an editable JSON backup without closing the dialog or creating a world. Cancel, the close button or Escape leaves the current project unchanged. Create world replaces it in one undoable operation. Enter from the name field creates the world after normal form validation. Session undo can return to the previous map; downloaded backups are safer for important work.

## Map image resolution

Open **Export map** and choose 1K(1024×1024),2K(2048×2048, default), or 4K square(4096×4096), then select Map image. The choice changes PNG dimensions only: it does not resample the editable world, alter terrain, change undo history or add geographic detail. Existing raster textures are scaled and vector labels/artwork render at output size. 4K square is not UHD landscape 3840×2160. Larger images need more memory and may take longer to encode.

Heightmap remains an N×N grayscale export of saved bed heights, independent of the image selector. Project JSON remains editable schema 9; generation-preview settings and export resolution are not saved as project data. See [Projects](projects.md).
