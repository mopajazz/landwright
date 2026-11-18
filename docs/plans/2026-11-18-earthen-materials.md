# Earthen materials implementation plan

Goal: integrate the approved eight-material study into Landwright, with natural automatic terrain response and a separate Forest density layer.

Spec: user approved `studies/earthen/` and requested integration. Preserve nine tools, D/E opacity, Shift erasing, Space panning and all existing content. No physical transport simulation, new story/settlement UI, runtime dependency or larger grid.

## Architecture and global constraints

- Retain IDs1 Grass,2 Sand,3 Stone (now Bedrock),4 Forest density action,5 Snow,6 Dirt (now Loam). Add7 Clay,8 Scree,9 Mud. Group surface materials into five families; separate Forest control. New Path choices remain2 Sand,3 Bedrock,6 Loam; old routes unchanged.
- Schema7 adds compact `surfaceMaterials` Base64 bytes: N² cells ×8 absolute material coverage channels, channel IDs `[1,2,3,5,6,7,8,9]`. Empty string means all zeros. Weights are0–255, approximately absolute alpha; sum percell ≤ round(alpha*255), with1-byte validation tolerance. Existing paint RGB/alpha remain canonical; old versions1–6 receive zero texture coverage so old blended paint remains exact. Additional data≤699,052 characters atN256.
- Render texture offsets from each material's base color weighted by absolute material coverage, atop the existing composited paint RGB/alpha. This preserves old paint and allows true material mixing under opacity. Never change heights, paint, weights or forest density from rendering. New unpainted terrain uses procedural Grass/Sand/Bedrock/Snow; old painted areas remain exact RGB over their base until repainted.
- Derive slope, curvature/shelter and wetness from raw bed/sea/all saved river water, independent of visibility. Automatic visual response, no geographic relocation/erosion. Render2D/3D/MapPNG from the same cached high-resolution ground canvas. Heightmap/diagnostic views use actual bed. Cache spatial patterns and bound active resolution: ground N during gestures, N×4 after release (max1024). Camera orbit reuses cache. Keep picking surface geometry unchanged.
- Retire Grain only from visible brush UI. Keep `brushWeight('grain')` for compatibility/internal tests; no saved preset changes needed.

## Tasks

1. Pure material engine and compact stroke storage: `earthen.mjs`, `material-paint.mjs`, dedicated meaningful tests. Deterministic material sampler, raw terrain context, bounded raster; byte packing/validation/per-stroke blend+erase. Review APIs before integrating.
2. App/schema integration: schema7 migration/validation before mutations, state/load/undo/new/import lifecycle, packed weights, opacity-once snapshots, Path resets affected weight cells, cached high-res shared ground composition and smaller diagnostic/heightmap input.
3. UI: grouped eight materials plus independent Forest density control; three footprints, updated accessible labels/hints. Nine tools retained.
4. Verification: unit and DOM tests for every material, blend+erase+locks+undo, older imports, malformed7 import atomicity, Path persistence, hiding layers and no bed edits. Full suite; renderer timing; real screenshots in2D/3D/dark/light; real map+heightmap+project exports.
5. Documentation/handoff/skill migration notes, releasev2.7/cache2.7.0, review, commit/push and exact Pages/live verification.

## Rulings

- User authorization covers implementing and publishing this update; no additional design approval gate.
- Raw old RGB is retained instead of guessing material blends from historical v3–6 colors. New material identity uses absolute quantized weights with residual legacy color.
- Study is a frozen approved visual reference. Production pure module may adapt its formulas for real terrain units/performance; do not import the standalone page into the editor.
