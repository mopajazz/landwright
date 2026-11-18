# Saved settlements

The v2.5.1 update removes the Settlements placement and editing panel from the right sidebar at the user’s request. There is currently no interface for creating, naming, moving, resizing or rotating settlements.

Existing schema6 settlement records remain intact on import, autosave, project download and undo/redo. They still render in2D/3D and visible MapPNG exports, retaining their names. Heightmap continues exporting ground only. Visible places suppress woodland without deleting forest density.

For maps containing settlements, their conditional layer still supports visibility and locks. Paint → Shift erase target → Settlements, then Shift-click/drag, removes whole touched objects; Undo restores removal. Hidden or locked layers are protected. Versions1–6 remain supported; no schema change was needed.
