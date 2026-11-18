# Settlements — v2.5

Implement the user-authorized hamlet/village/town feature and deploy, with no further design approval gate. Preserve ten toolbar tools and the integrated woodland direction.

- Add an expandable Settlements panel with explicit Place, Select, Move and Back to terrain modes; name, rotation, scale and Delete controls. Preview validates the whole bounded footprint against water, steep terrain, overlaps and map edges.
- Store at most64 deterministic settlement records in schema6; import1–6. Keep names as plain text, validate before mutation, one snapshot per successful placement/edit/move/delete. Cancel/invalid previews do not enter history or terrain brushes.
- Original irregular muted roof/road clusters share2D/3D/export rendering. Buildings have shallow derived display relief. Visible footprints suppress canopy without clearing saved density. Hidden settlements restore the underlying forest. Heightmap remains actual bed.
- Test geometry, validation, migration, invalid import atomicity, mode cancellation, locks, undo/redo,3D placement and export composition; inspect actual browser images. Update tutorial/KB/handoff/skill, run full suite, deploy to existing GitHub Pages and verify exact release.
