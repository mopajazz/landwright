# Terrain-shaped settlements implementation plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.
**Goal:** Paint candidate ground and commit five distinctive terrain-shaped places.
**Architecture:** Pure deterministic planner + saved explicit geometry, integrated as Paint mode. Preserve existing seeded settlements through schema8 normalization.
**Tech Stack:** Existing buildless ES modules, Canvas/WebGL composition, Node tests/jsdom.
**Spec:** ../specs/2026-11-18-settlement-brushes-design.md
## Global constraints
Nine tools; left placement controls; no bed/forest/paint mutations; exact-preview commit; imports1–8; at most64 settlements; transient draft; theme/reduced-motion safeguards preserved.
## Review focus
- Partial dry footprints must generate only safe geometry, not reject whole mask.
- Malformed/oversized layouts rejected before import/history mutation.
- Tool changes/cancel/lock prevent draft commits, pan/orbit preserve draft.
- Sculpting must not regenerate chosen layout or alter raw density.
-3D/export must share saved artwork while excluding previews and Heightmap relief.
## Task1 Pure settlement engine
- [ ] Write planner/geometry tests and observe missing-feature failures.
- [ ] Implement planSettlement({kind,mask,n,heights,sea,riverWater,settlements,seed,id,name}) returning explicit record or null; extend settlementLayout/validation/fields/rendering for layout records and old seeded records.
- [ ] Verify deterministic riverbend vs hillside plans, safety, five forms, exact persisted geometry, bounded work and no source mutations.
## Task2 Editor integration
- [ ] Add failing tests for transient paint area, exact commit, cancel/undo, locks, resizing, import validation and3D.
- [ ] Add left Ground/Settlements modes and five choices; frame-queued mask preview; Place/Cancel+Enter/Escape; schema8 canonical geometry; preserve legacy imports.
- [ ] Run targeted and full tests; browser-check reference terrains, modes, exports and responsive UI.
## Task3 Delivery
- [ ] Update tutorial/KB/handoff/portable skill with current contracts; coordinate cache2.8.0.
- [ ] Independent whole-diff review, address correctness/performance findings, syntax/diff/fullsuite; commit/publish authorized Pages deployment; verify exact release live and save screenshots.
