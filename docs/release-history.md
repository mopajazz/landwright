# Landwright release history

Engineering notes for each release, moved out of [`handoff.md`](../handoff.md) on November 21, 2026. They are kept for context: why decisions were made, what was measured, and what was rejected. **They are not the current specification.** Later sections supersede earlier ones, and `handoff.md` plus the source and tests describe the app as it is now.

Section numbers match the old handoff so existing references still resolve. Text was kept as written, except that run-together words and numbers were separated and machine-specific `/tmp` and `/workspace` paths were removed.

## 14. UI review — November 17, 2026 (v2.1)

A critical review of the live app compared the UI against this handoff. The interaction model (tool/footprint/material independence, route draft safety) was sound. The layout did not reflect it. Findings and their resolution:

| Finding | Resolution |
| --- | --- |
| Toolbox ordered by component type. With Raise active, the irrelevant paint palette sat above Strength, which was below the fold (toolbox ~1,500px in a 745px viewport). | Sculpt section moved up beside brush controls. Palette shown only for Paint. Filler tip removed. Toolbox is ~1,100px. |
| Opacity and Strength both active on sculpt tools. Opacity silently multiplied strength; Opacity 0 disabled sculpting with no feedback. | Opacity is scoped to Paint, Path, and surface Erase (§3). Regression test added. |
| Size labelled "px" but measured in map cells (~2.4 screen px per cell at 100% zoom on Large). | Labelled "blocks". |
| Footer said "W/S brush size" in Path/River, where W/S changes route width. | Hint is tool-specific. |
| Save/Shortcuts/world name hidden at phone widths, and no Ctrl+S on touch, so no export path. | Download stays visible as an icon at ≤500px. Shortcuts remain hidden on small screens. |
| "Save project" actually downloads; autosave status was buried at the bottom of the toolbox. | Renamed Download. Header badge shows autosave state. |
| Grid/Contours toggles looked identical to the view radio choices. | Distinct toggle style with `aria-pressed`. |
| Selected tool barely distinguishable in dark mode. | Accent ring, bolder label, wider edge marker. |
| Layer lock shown as ◇; layer/water toggles 25×26 and 31×19; undo/redo unlabeled. | SVG eye/lock icons, 32px targets, aria-labels. |
| Route preview ribbon faint and not the result colour. | Material/river-coloured outlined ribbon. |
| New-world cards in a 5+1 grid. | 3×2 grid. |
| "WORLD / Overworld" breadcrumb, OVERWORLD chip, and "Custom terrain · Overworld" implied multiple worlds per project. | Removed in v2.1.1 at the user's request. Chip reads MAP. |

Verified by the full test suite and by screenshots in headless Chromium (Canvas fallback) at 1440×900 in dark and light themes, at 1024px, and at 390px. Real-GPU and touch-device checks are still outstanding (§9 smoke list items 10–12).

## 15. River Taper, Meander and Reflow upgrade

Merged with the contextual-toolbox review and Overworld removal; those UI changes are preserved. No toolbar tool or project schema version was added.

New rivers default to Taper enabled and Meander 25% (slider 0–100%). These controls are hidden for Path. Taper is optional Boolean river metadata in v4; missing metadata means uniform width for older rivers. Meander is baked into sampled coordinates.

Effective radius is `max(0.75, width/2 × (0.25 + 0.75t))` for tapered rivers, where t is normalized cumulative arc length; untapered radius stays width/2. The minimum avoids subcell sources disappearing between terrain samples. Carving, river water, preview, and hit testing share it. Meander uses a deterministic source-coordinate hash and smooth perpendicular sine offset, bounded by width/2 times the slider fraction, clamped to map bounds and exactly zero at both endpoint handles. Work budgets use actual displaced segment lengths and maximum configured width; the 8,000,000/32,000,000 limits are unchanged.

World Settings offers **Reflow rivers** whenever a saved river exists. It is disabled if Relief or River water is hidden/locked. One action cancels pending gestures, samples all profiles against the same current heights snapshot using `level=max(0,min(previousLevel,nearestGroundHeight-0.5))`, recuts beds below the recalculated levels, rebuilds local water/effective geometry, and refreshes. It has one complete undo/redo group and leaves Path data and ocean settings unchanged. Because this formula samples an already carved bed, **repeated Reflow can deepen channels**; this is disclosed beside the button and covered by tests. Undo restores prior bed and levels. No automatic hydrology or finished-point editing is implemented.

Additional coverage includes taper save/load and old v4 compatibility, source/mouth width, thin-source continuity, deterministic bounded endpoint-pinned meander, maximum-width budgets, reflow profiles/recutting, and UI locks/undo/redo. Final merged release verification: **101 tests passed, 0 failed** on November 17, 2026.

## 16. v2.2 Living World and user documentation

Historical v2.2 release scope; §18 supersedes its vegetation scope and preference fields for v2.3.

`living.mjs` renders a separate `living-overlay` Canvas, with a capped 30Hz effect loop rather than continuously re-rendering terrain. Water shimmer samples visible wet cells; route streaks follow source-to-mouth point order; four drifting clouds add stylized projected soft shadows. This is visual atmosphere, not water/lighting/civilization simulation. No vegetation, population, day/night, or storytelling is delivered here.

World Settings offers one Living World toggle (default on) and an expandable choice of Water motion and Clouds & soft shadows. Its browser-local `landwright-living` preferences are `{enabled,clouds,waterMotion}` Booleans; no v4 field, history entry, terrain edit, paint change, reflow, or exported effect is introduced. `syncLiving` pauses/stops animation during pointer edits, pan/orbit, route drafts, hidden documents, reduced-motion preference, diagnostic views, and disabled effects. Resuming after ordinary 2D pointer release is explicitly synchronized and regression-tested with queued animation frames. The overlay has no pointer events and does not alter picking. It is stylized screen compositing, not a depth-buffered physically accurate lighting pass.

`docs/tutorial.md` and `docs/kb/index.md` start the user-facing tutorial/KB, linked in Help. Additional articles cover brushes, routes/reflow, Living World, and projects/troubleshooting. The user explicitly requested the prominent low-Strength lesson: **begin Raise/Lower around 5–10% Strength with short strokes, inspect, then increase gradually**. Keep it in future tutorial revisions. Opacity is reserved for Paint/Path/surface erasing and does not tame sculpting.

Maintain these user docs alongside new features: location, procedure, what changes, save/undo/export behavior, limitations, and common mistakes. Keep planned features clearly separate from shipped behavior.

v2.2 verification: **106 tests passed, 0 failed**. Tutorial/KB local links and syntax/diff checks pass. Living World rendering is deliberately separate from project data, undo and PNG composition; queued-frame tests cover pause/resume after 2D edits.


## 17. Reusable development skill and next session

The repository-scoped skill is [landwright-development](.agents/skills/landwright-development/SKILL.md). It applies to Landwright feature work, regressions, releases, onboarding/tutorial/KB updates, and Holler Maps or storytelling planning. Its `references/handoff.md` is a portable snapshot of this document, not a separate specification. When updating this handoff, refresh that snapshot in the same change; its skill link is rebased to `../SKILL.md`, and its contrast-audit link uses the bundled `references/docs/contrast-audit.md`. Refresh that audit copy if its source changes. In an active checkout, source/tests and this root handoff take precedence over an older installed skill snapshot.

To install elsewhere, copy the entire `landwright-development` directory into that runtime's supported skills directory (commonly `~/.agents/skills/`); retain `SKILL.md` and `references/handoff.md`. A skill file in this repository does not mean it is installed into every ChatGPT session or published to the plugin catalog. The portable `.skill` archive is a ZIP of that directory; extract it into the supported skills directory.

For a fresh session, request: **“Use landwright-development to continue Landwright. Read the current handoff, inspect HEAD and working-tree changes, and implement the requested change while keeping the tutorial and KB current.”** Discover the checkout and remote rather than relying on the cloud path above.

Previous shipped state: v2.2 at `03c1199`, published through successful Pages run `44207290868`. v2.3 adds forests as described in §18. Live-browser smoke checks confirmed the Living World switch/status/options in 2D and Canvas-fallback 3D. These checks do not establish real-GPU performance or a full accessibility audit. The v2.3 runtime changes are described below.

Suggested next product discussion: settlements and named locations as a bridge to storytelling. This remains a candidate, not an implemented or fully specified feature. Holler Maps originals remain unavailable (§11); storytelling remains deferred (§12).


## 18. v2.3 Forests and canopy breeze

Historical published renderer. The user rejected its cartoon stamp appearance; §19 replaces its visuals in v2.4 while preserving density/editing contracts.

**UI and editing.** Forest remains material ID4 inside Paint, but new Forest strokes edit a separate density field instead of surface RGB. The other five materials retain color painting. No toolbar tool or Forest Scatter footprint was added. Forest density is a target from 0–100%, default 65%; Opacity blends toward that target once per gesture against the starting density. A lower target can thin woodland. All four footprints work; Shift Forest clears toward zero. Erase → Forests uses opacity/footprint without changing ground or heights. Forests has independent visibility/locks; Surface controls do not lock woodland. Conditional layer/eraser controls reconcile after pointer release and Escape/pointer cancellation, after clearing gesture state. Escape retains already applied density, matching ordinary brush semantics.

**Schema and history.** New saves/autosaves write v5 with `forest: number[N²]` in 0–1 and `layers.forests`. Imports 1–4 initialize zero density and preserve their original Forest ground color, route data, drawings and marks. Old v4 applications cannot open v5. Import validation precedes mutation/history updates. Undo/Redo snapshots include density and Forests flags. New worlds and image heightmap import clear density; size/load/undo rebuild dependent caches. No individual tree instances enter `marks` or project JSON.

**Deterministic placement.** `buildForest` uses jittered four-block anchors inset three cells from the edge, deterministic noise for density/type/size, and a maximum 4,096 candidates (actual Large inset lattice is slightly smaller). It rejects roots below sea+2, adjacent height differences>6, local river levels more than 0.01 above ground, and saved Path corridors. Eligibility is rebuilt after content/sea changes; masks use all saved rivers independently of Water/River water visibility. Density survives unsuitable terrain and trees reappear when it becomes suitable. Surface-erasing a Path does not erase its saved record or corridor blocker.

**Caching and rendering.** `createForestHabitatCache().get(routes,N)` reuses rasterized path/river masks until route array identity or grid size changes. Committed route arrays must be replaced immutably, including append, erase, reflow, and load. Forest strokes and layer controls must not invalidate these masks. Original pine/broadleaf symbols share `ATLAS_TYPES` with legacy tree/mountain/town symbols in a 320×64 atlas. A 1024² cached forest overlay serves 2D and Map PNGs. GPU 3D batches eligible tree billboards with legacy marks; Canvas fallback draws projected, depth-sorted sprites, with less precise terrain occlusion. Heightmap view/PNG omits trees; Biomes may show static forests.

**Motion.** Living World adds `vegetationMotion` (default true) to browser preferences and a Canopy breeze checkbox. Up to 256 distributed trees receive moving leaf/branch accents, not full mesh animation or growth. Static forests remain with Living World off or reduced motion. Existing 30 Hz cap/pause rules apply. Scene preparation precedes animation-state reconciliation so canopy-only motion starts after the first 3D forest is built. Motion changes never enter history/project data or exports.

**Documentation and verification.** See `docs/kb/forests.md` and the tutorial's forest lesson. Low-Strength Raise/Lower guidance remains. Tests cover target density and per-stroke opacity, deterministic caps, water/cliff/path eligibility and restoration, v5 validation/older imports, populated density below the 12 MB import ceiling, cache reuse,3D editing, conditional controls/cancellation, locks, save/import/undo, and bounded canopy accents. Rendering/pixel checks still require an actual browser; real-GPU performance is not established by jsdom.

No Holler Maps source files were imported. Original symbols are deliberately small in scope. Ecosystem/civilization simulation, full tree swaying, day/night, inhabitants and storytelling remain unimplemented.


v2.3 verification: **118 tests passed, 0 failed**. Syntax and diff checks passed. Local browser smoke checks covered Forest density painting in dark/light themes, stable Paint selection, conditional Forests controls, 2D and Canvas-fallback 3D rendering, independent Canopy breeze, and real 1536² PNG downloads. Comparing visible/hidden Forests exports changed pixels only in the woodland region. Real-GPU rendering/performance is still unverified in this browser.


## 19. v2.4 integrated woodland — Codex continuation

### Start here: release and user intent

- v2.4 replaces the rejected cartoon pine/round-canopy stamps with terrain-integrated woodland. The release uses cache revision `2.4.0` and schema 5; imports 1–5 remain supported. Inspect actual Git/Pages status before quoting a release commit or deployment result.
- The user approved connected textured canopy masses, irregular edges, muted greens, clearings and soft shadows following relief, then explicitly requested release. Preserve the existing painting, opacity, Forests layer/erasing, undo/redo and ten-tool interface.
- Approved concept: [woodland art direction](docs/design/README.md) and [reference image](docs/design/woodland-direction.png). It is generated concept art, **not** a screenshot or an asset pasted over the map. Actual rendering is procedural and is not a pixel-for-pixel reproduction.
- Previous release was `e56269b` (v2.3). No schema migration beyond the existing v5 density contract is needed. Do not restore generated tree stamps or import guessed Holler assets.

### Implementation map

| File | Current changes |
| --- | --- |
| `forests.mjs` | Retains density-stroke compositing and route-identity habitat caching; replaces `buildForest` / `drawForestSymbol` with `buildWoodland`, `renderWoodland`, `woodlandSurface` |
| `app.mjs` | Separates derived geometry updates from RGBA texture rasterization; shares canopy relief with display/picking/brush projections; composites woodland into 2D/3D/Map PNG; removes generated forest billboards |
| `landmarks.mjs` | Atlas returns to legacy tree/mountain/town only; legacy artwork and content preserved |
| `terrain3d.mjs` | Optional cached texture mapping for woodland-covered Canvas fallback triangles; untextured coarse mesh during orbit; full detail on release |
| `living.mjs` | Canopy breeze uses low-opacity moving foliage glints instead of drawn twig strokes; ≤256 accents, existing pause rules |
| `index.html`, local module imports | Footer v2.4 and coordinated `?v=2.4.0`; runtime remains static/buildless |
| `tests/forests.test.mjs` | Continuous deterministic coverage, density monotonicity, habitat clipping, texture alpha, derived-height isolation, existing data/migration/cache contracts |
| `tests/interactions.test.mjs` | Added protection against reordering saved legacy marks during 3D rendering |
| `tests/living-interactions.test.mjs` | Queued-RAF regression: multiple 3D pointer events must not trigger RGBA rebuilds before the scheduled frame |
| `tests/terrain3d.test.mjs` | Canvas woodland texture uses only covered cells and finite affine transforms |

### Rendering/data contracts

1. **Authoritative data is unchanged:** `forest` is N² density in v5; `heights` remains the actual terrain/river bed. No canopy heights, noise fields, RGBA textures or accent instances enter project saves/history.
2. **Eligibility derives from the bed:** reject low coasts below sea+2, adjacent height differences>6, local water above bed, and committed Path corridors. All saved rivers count even when Water/River water is hidden. Density is retained where woodland is unsuitable.
3. **Continuous canopy:** deterministic multiscale patch noise creates coverage and clearings; irregular overlapping crown lobes give texture/lighting. No outlined generated forest symbols remain. The outer two cells have no canopy, with an inward feather, preserving the projected perimeter.
4. **Derived visual height:** `woodlandSurface` adds shallow canopy relief (under 3 blocks, capped at 255) to the effective water/terrain surface only while Forests is visible and the view is not Heightmap. This same surface feeds GPU/Canvas rendering, picking, brush/route projections and legacy anchoring. Hiding Forests removes both color and canopy relief. Reflow and Heightmap PNG use actual bed heights.
5. **Shared composition:** the same woodland RGBA layer is drawn once into 2D, the cached 3D surface texture and visible Map PNG. Heightmap view/PNG omits it. Legacy marks are rendered from a copied array: sorting fallback sprites must not mutate `marks`.
6. **Performance:** `updateSurface()` can refresh derived geometry for picking; `flushTexture()` rasterizes RGBA during scheduled rendering/export. `pointer()` calls only `updateSurface()`, preventing per-pointer-event rasterization. `refresh()` dirties both surface and texture.
7. **Resolution/cache:** woodland raster is N×2 during a stroke and N×4 after release/cancel. Two texture-pattern entries keyed by N/resolution avoid alternating-resolution cache thrash. Raster loops visit the woodland bounding box; camera motion/breeze reuse cached textures. Route habitat masks retain their separate immutable-array cache contract.
8. **Canvas fallback:** texture-map only covered cells using affine clipped triangles. During orbit, retain the lighter existing mesh; return to cached textured woodland on release. This remains an approximate painter-sorted fallback, not a GPU-equivalent depth buffer.
9. **Motion:** foliage glints are subtle, bounded, visual-only and excluded from PNGs. Static woodland stays visible with motion disabled/reduced motion. Existing preferences and pause rules are unchanged.

### Verification and visual findings

The earlier v2.4 full suite passed **121 tests** before the latest marks/frame-coalescing/fallback additions. The fresh complete run in a local log (not in the repository) passed **123 tests, 0 failed**, including the marks-order, queued-RAF rasterization and Canvas texture mapping regressions. Syntax checks for every root `.mjs` and `git diff --check` passed during this handoff update.

Real local-browser checks used Evergreen Island at `http://127.0.0.1:8765/`, with saved v5 forest density from v2.3. The first renderer looked too uniformly beaded; crown radii/positions now vary more and lighting is softer. The last actual screenshot shows textured woodland draped across the northwestern slopes in Canvas-fallback 3D, with no generated tree silhouettes. The fallback initially lost texture in flat triangles; affine texture mapping was added and visually checked. Final browser exports verified a 1536² Map PNG containing integrated woodland and a 256² Heightmap whose every pixel matched the saved bed. Project download retained schema 5/density. GPU rendering/performance has not been established. Visible/hidden Forests Map PNGs differ, while Heightmaps are byte-identical; every exported Heightmap pixel matches the saved bed. Live deployment must be checked against the release commit.

Warm local Node measurements for an 80×80 woodland patch on a 256 map: cached 512² texture ~4 ms, cached 1024² ~11 ms; first pattern creation ~75 ms/~261 ms. These are local component timings, not guaranteed app frame rates. Measure held 3D strokes as well as orbit; do not infer GPU performance from Canvas.

Code review identified per-event RGBA rasterization through `pointer()`; the split `updateSurface()` fix and queued-RAF regression address it. A separate regression caught legacy mark sorting mutating saved order; `sceneMarks()` now returns a copy. Recheck the final implementation after these fixes and fallback texturing.

### Continuation and known limits

- Keep the tutorial, forest KB, README, handoff and skill snapshot current with future changes. The low-Strength 5–10% Raise/Lower lesson remains required.
- Canvas fallback is textured but approximate, with reduced detail while orbiting. Final screenshots were checked in 2D/Canvas 3D; this does not establish real-GPU performance or full WCAG conformance.
- Full-tree swaying, growth/ecosystem simulation, individual route-point editing, inhabitants and storytelling remain unimplemented. Saved Path records continue blocking canopy after surface erasure; density remains dormant on unsuitable terrain.
- Verify the actual Pages deployment/live release before claiming publication. A push alone is not evidence. Future terrain changes must keep derived canopy out of bed/river calculations, saves and Heightmap exports.

Useful commands:

```bash
cd landwright
git status --short
git diff --stat
npm test
node --check app.mjs
node --check forests.mjs
node --check terrain3d.mjs
git diff --check
```

The local preview server was restarted as `python3 -m http.server 8765 --bind 0.0.0.0`, with output at a local log (not in the repository). It may need restarting in another environment. Browser local storage is tied to the 8765 origin; a different port will not load the same map. Browser tab IDs are ephemeral.

Do not use a local file (not in the repository) as a v2.4 acceptance image: it shows the rejected v2.3 stamps. Capture fresh screenshots through the supported browser tool. The generated concept is not a substitute for testing the implemented renderer.

## 20. v2.5 settlements — current Codex continuation

### Scope and interaction

The user explicitly authorized implementing and deploying settlements. Preserve ten terrain/surface/navigation tools. The right-sidebar collapsed Settlements panel contains Hamlet/Village/Town, Place, Select, existing-place dropdown, Name, Size, Rotation, Move, Delete and Back to terrain. It is separate from removed Drawing/Details tools. Original deterministic muted roof clusters replace any assumption of access to Holler originals. No inhabitants, growth, roads between places, auto-relocation or narrative authoring shipped.

Place/Move are transient modes with stable seed and exact chosen fields. Pointer preview validates without mutation; click/Enter commits one snapshot. Escape, selecting a tool, view changes, New world or imports clear the draft. Pointer events must not fall through into sculpting. Selecting/renaming/moving works in 2D and 3D. Middle-pan and right/Alt orbit remain available. Form fields retain normal text editing. Move must compare the full record, not only x/y, so same-position rotation/scale/name changes commit.

### Authoritative persistence and validation

`editor.mjs` writes schema 6, imports 1–6, migrates older versions with settlements[]. Required v6 list: max 64, unique IDs, canonical fields `{id,kind,x,y,scale,rotation,seed,name}`. ID is 1–40 ASCII alphanumeric/underscore/hyphen; name is nonblank plain text up to 80 chars without control characters. Kind is hamlet/village/town; finite scale 0.5–1.5, rotation 0–360, unsigned 32-bit integer seed. Entire circular footprint fits the grid. Unknown fields are stripped. Validate imports before replacing active project/history. Never insert names into HTML; use textContent and Canvas text. Autosave/history use the same authoritative records, no roof fields.

### Site and rendering contracts

`settlements.mjs` owns deterministic layout, validation, derived fields and Canvas composition. Base radii 6/9/13; bounded packing targets 6/15/30 irregular buildings with curved internal lanes. Every footprint cell must be at least sea+1 and dry against raw riverWater even when hidden. Ground range<=8 and adjacent differences<=3; circular footprints cannot overlap (one-cell separation). Failure reports a reason. Prepare ground manually with Flatten, or reduce size; placement never sculpts. Terrain changes can leave an existing record unsuitable; do not silently remove it.

`settlementFields` builds bounded mask and shallow gable heights; cache by records-array identity/N. All committed edits replace the array immutably. Combine visible footprints with woodland suppression masks without changing saved forest density. Derived roofs add only to `surfaceHeights`, capped 255, shared by GPU/Canvas/picking. Bed, river reflow, saved heights and Heightmap remain untouched. Hiding Settlements removes roofs and allows eligible woodland to return. Separate cached 1024² settlement texture is reused during orbit and composited into2D/3D/MapPNG. Names remain overlay text, clamped/flipped inside actual N for export and screen projection in 3D. Heightmap view suppresses labels/buildings. Conditional layer and Erase target remove whole objects regardless of Opacity; visibility/locks protect edits.

Living World pauses during Place/Move drafts. UI themes use existing tokens. No claim of full WCAG conformance or real-GPU performance is established by Node tests or Canvas screenshots.

### Verification and maintenance

Fresh full `npm test`: **135 passed, 0 failed**, including 5 settlement module tests and 7 DOM integration tests. Coverage includes deterministic bounded layout, whole-footprint suitability, derived-height isolation, schema migration and rejection, label edges, safe names, cancel/undo/redo, locks/erasing, all types placed in 3D, same-position Move transform, image-import draft cleanup and malformed-import atomicity. Reviewer confirmed the three reproduced bugs fixed, with no concrete remaining blocker. Node DOM tests stub Canvas; actual browser visual/export checks remain separately required for release.

Update tutorial, `docs/kb/settlements.md`, KB index, projects/brush guidance and README with behavior changes. Preserve the mandatory 5–10% initial Raise/Lower Strength lesson. Refresh this skill's reference copy with its relative skill link rebased. Deployment remains GitHub Pages `main:/`; verify actual successful run and live footer 2.5 before claiming release. All root module/style query revisions are 2.5.0. Prior v2.4 release 95c5ea6 remains historical. See Git history for this release commit.

Actual v2.5 local-browser verification: placed Village Willowbank and Hamlet Northwatch in Evergreen Island after explicitly preparing a flat site. Inspected light/dark controls and 2D/Canvas 3D composition. Downloaded schema 6 retained both names/types. MapPNG is 1536² and includes roofs/lanes/labels. The 256² Heightmap matched every rounded saved bed pixel; visible/hidden Settlements heightmaps were byte-identical. No real-GPU frame-rate claim is made.

## 21. v2.5.1 sidebar removal and Space pan — current override

The user rejected the right-sidebar Settlements options. Remove the entire placement/editing panel, controls, CSS and interaction modes; do not silently move them elsewhere. §20 describes historical v2.5 creation behavior only. Preserve schema 6 records, import validation, derived roof/woodland composition, labels, MapPNG exports, conditional visibility/lock layer and whole-object Erase support for saved maps. No new schema or eleventh tool.

Space keydown outside inputs/selects/textareas/contenteditable and open dialogs prevents scrolling/activation and enables temporary camera panning. Left pointerdown chooses pan before editing/route logic.2D uses existing pan offsets;3D uses camera panX/panY without changing yaw/pitch, even off terrain and with Orbit active. A started pan stays a pan until pointerup even if Space is released first. Tool selection and authoritative data/history stay unchanged. Mid-stroke Space ends the stroke before enabling pan. Keyup, window blur and hidden-page transitions clear key state; blur/hidden also cancel held gestures. Brush cursor hides during navigation; grab cursor indicates Space.

Tests replace removed creation-mode integration tests with current sidebar-absence, saved-content retention,2D/3D translation, no-terrain-change, tool persistence, keyup/blur/typing and route-pan tests. Full suite 134 passes. Tutorial/KB/README/help describe current controls. §20 historical 135-test count is superseded.

Real-browser v2.5.1 checks used held Space with native left-mouse drags:2D moved the map80px/40px;3D translated the camera without changing the selected Raise tool. Inspected simplified sidebar in dark/light themes; existing Willowbank/Northwatch records remained visible. Canvas fallback was used; no GPU performance claim.

## 22. v2.5.2 opacity shortcuts and Shift erase — current override

The user removed the standalone Erase toolbar tool and requested D/E opacity adjustment. **Nine tools** now supersede all historical ten-tool requirements. E never selects Erase. D lowers and E raises Paint/Path Opacity by 5 percentage points, bounded 0–100; keys preserve tools, Strength, saved project and undo history. They respect editable fields/dialogs and existing Ctrl/Cmd shortcuts. Hidden non-opacity tools ignore these keys. The opacity slider includes the shortcut hint and Help documents it.

`gestureTool(e)` treats Shift+Paint as erase while keeping the actual tool Paint. Event-aware `activeLayer(e)` and `opacity(e)` route validation before snapshot/mutation. Normal paint always paints its selected material, regardless of chosen Shift target. Choosing a ground material resets Shift target to Surface; Forest chooses Forests (available even when empty). Paint contains the former target selector labelled Shift erase target; existing rivers, settlements and legacy shapes/landmarks remain erasable. Target changes preserve the current tool. Whole-object erase ignores paint Opacity (even 0%); surface and forest clearing uses opacity-once-per-stroke coverage. Layer locks/visibility follow the target, not the selected paint material. Erasing river water keeps the carved bed. Conditional controls reconcile on release/Escape, not mid-stroke. No schema change; save/import remain 6/1–6.

Shift reverses Raise/Lower and removes Land as before; it erases only with Paint. Path’s Opacity keys affect newly committed route paint; Shift is not a path-record deletion tool. Space-panning still takes precedence over Paint and modifiers. Removed Erase icon may remain in the reusable icon module, but has no toolbar, shortcut or tool dispatch.

Verification: full Node suite **139 passed, 0 failed**, including new D/E clamping/no-project-change, typing/dialog protection, nine-tool UI, Path committed-opacity and zero-opacity whole-object Shift-erasing tests. Existing2D/3D surface, forest, river and legacy erasing tests now send genuine Shift-modified Paint events. Preserve tutorial low-Strength 5–10% guidance and refresh the skill snapshot with changes.

Actual local-browser v2.5.2 check: D/D/E produced 100→90→95% with Paint retained; painted a Hard Round Sand patch and Shift-clicked it away, then undid both test strokes. Inspected 2D/Canvas 3D and light/dark controls. No real-GPU performance claim.

## 23. v2.6 New World and independent export resolution — current override

User authorized export-resolution presets and improving New World. Current scope keeps square 128/192/256 editable grids; no unprofiled larger grids, rectangular worlds, device presets or retro renderer. Nine tools and schema 6/import 1–6 remain. Footer v2.6; cache 2.6.0.

New World is a responsive, labelled native modal with name, six thumbnail shape buttons, Terrain detail selector and descriptive live preview, collapsed Generation settings, backup action and sticky footer. Quick sketch/Small 128 has 16,384 samples; Standard/Medium 192 has 36,864; Detailed/Large 256 has 65,536. The selected canvas preview is generated at that exact N with selected seed/relief; thumbnail previews use 80. It uses a lightweight terrain palette/slope shader, not atmosphere or saved forests. Reuse deterministic `generate`; never mutate active arrays or history from previews. Flat grass is 80 everywhere; ocean bed 30 everywhere. Their relief is disabled and explained. Re-enable when selecting another shape. Keep arbitrary names as text, trim on creation, and preserve native required/seed validation. Backup invokes editable project download without closing modal; Cancel/X/Escape don’t create. Only Create submits the form, so Enter in name field creates. Opening resets scroll to top. Generation remains one undo step; test Undo restores all previous arrays, size, records and layers.

Export has a separate Map image resolution selector:1024,2048(default),4096. Validate allowed values with 2048 fallback. The label follows selection and the actual offscreen PNG canvas/draw dimensions use that value; vector names and legacy content scale accordingly. Existing ground/woodland/settlement rasters are scaled, not new geographic detail. Heightmap remains actualN² bed data regardless of selector; project and undo data unchanged.4K square is 4096², not UHD 3840×2160. Choice is session UI, not schema persistence. Previous 1536-only statements are historical.

Full Node suite 142 passes, including preview/detail/cancel isolation, in-dialog backup and each image output size plus unchanged heightmap/project data. Browser verified native Enter creates named 128 Flat grass (all heights 80), Undo returns the entire original downloaded project byte-equivalent as parsed JSON, actual 4096² MapPNG, and 256² Heightmap with every rounded pixel matching saved bed. Inspected dark/light dialogs and 500px narrow-window layout with no horizontal dialog overflow and accessible scrolled controls/footer. No real-device touch or GPU-performance claim.

Update `docs/kb/worlds.md`, tutorial, project KB and README alongside behavior changes. Preserve the mandatory initial 5–10% Raise/Lower Strength lesson. Portable skill references this current override before older contracts.

Final v2.6 review found no concrete release blocker. Fresh full run a local log (not in the repository): 142 passed, 0 failed. Root module syntax and whitespace checks pass. Release deployment was subsequently verified: Pages run 44341029194 succeeded for exact commit d7ae907; production browser confirmed v2.6 and its controls without application errors.

## 24. Earthen material study — visual proposal only

The user requested an eight-material swatch sheet before editor implementation. Standalone page: `studies/earthen/index.html`, `study.css`, `study.mjs`; public route `/studies/earthen/`. The v2.6 editor and cache/schema remain unchanged. The study imports no app modules, reads/writes no project or preference storage, and renders original deterministic Canvas textures. Proposed palette: Grass, Loam, Clay, Bedrock, Scree, Mud, Sand, Snow, grouped into five families. Loam subsumes everyday Dirt; Forest stays the existing separate density layer. Other proposed materials remain deferred.

Each material displays identical flat/ridge/hollow samples in parchment and midnight frames; the global UI theme toggle never changes terrain pixels. A mixed-material landscape demonstrates slope, hollow, shelter and wetness cues. Download builds an 1800×2370 PNG with all eight materials and both frame themes. This is an art-direction prototype, not shipped editor behavior, a schema design, or material transport/erosion physics. Grain has not been removed from the actual app. Do not integrate or rename saved material IDs until the user reviews the visuals and migration/rendering costs are designed.

Source reference: the compendium image supplied earlier in chat informed restrained marks/colour choices. No local Holler compendium file was found and no Windows/ChatGPT Library asset access is claimed. The study uses no copied artwork. Test through the real browser for all eight materials, both themes, PNG download, narrow layout and console errors. App tests need not be rerun for this isolated prototype; no application runtime files changed.

Swatch study browser evidence: eight material cards and sixteen comparison canvases rendered with no application errors. Parchment/midnight theme switch checked. Actual exported PNG verified as 1800×2370; final comparison PNG is a local file (not in the repository). No app-suite rerun is claimed because editor source/tests were untouched.

The study was also inspected at 500px viewport width with no horizontal overflow; desktop window restored after inspection.

## 25. v2.7 — approved earthen material integration

This section supersedes §24's standalone-study status and earlier palette/schema/footprint counts. The approved study remains available, unchanged, in `studies/earthen/`.

### Product contract

Eight surface materials grouped by family: Grass(1), Loam(6), Clay(7), Bedrock(3), Scree(8), Mud(9), Sand(2), Snow(5). Forest(4) remains a separate density action below the palette. Stone/Dirt are now named Bedrock/Loam for new selections. Nine tools remain. Soft Round, Hard Round and Coastline control footprint; Grain is removed from UI but its legacy helper remains internally. Selecting a material/footprint preserves the tool. D/E, Shift erase, Space pan, layer protection and forest density semantics are unchanged.

Texture responds automatically to raw slope, curvature/shelter, light and proximity to sea/all saved river water. It is a visual treatment, not sediment transport, erosion or material redistribution. Terrain diagnostic views bypass pigment texture. Visible submerged cells keep water appearance; hidden river water still supplies wetness context.

### Implementation and persistence

- `earthen.mjs`: deterministic procedural renderer and material definitions. A128² periodic atlas caches five Float32 noise fields (~320KiB), with world-anchored sampling and bilinear coverage. Base RGB compositing remains the authority for old paint; texture contributes weighted color offsets without multiplying hill shading twice.
- `material-paint.mjs`: eight absolute coverage bytes/cell, ordered `[1,2,3,5,6,7,8,9]`. Forest is excluded. Snapshot-based painting blends old weights by 1−amount then adds selected material; erasing attenuates all channels. Quantized sums must not exceed round(alpha×255), allowing1byte import tolerance.
- Schema 7 adds `surfaceMaterials`: canonical Base64 of N×N×8 bytes, or empty string for all-zero coverage. A256² map costs 524288 raw bytes /699052 Base64 characters when nonempty. Never serialize derived texture images. Validate canonical encoding, size and coverage sums before history/world mutation.
- `editor.mjs` imports versions 1–7. Versions 1–6 migrate to zero material coverage; RGB/alpha remains exact. Frozen original six colors preserve v1/v2 migration. Old versions still reject new material IDs. Older app releases cannot read schema 7.
- `app.mjs` includes coverage in save/load/autosave/history/stroke snapshots, clears it on generation/image import, and supplies it to new path commits. Saved paths are not replayed on load. Legacy fully painted colors remain unchanged until repainted; natural unpainted ground uses procedural materials.
- `groundMap` is the shared derived raster for2D, combined3D and MapPNG. The original N² `off` raster remains legacy/base compositing. Active strokes use N²; release/cancel promotes to(4N)² in Terrain, capped 1024². Diagnostic views useN². Heightmap exports remain authoritative bed-only.
- Texture/raster rebuilding stays on queued frames, not pointer events. Orbit reuses cached raster; Canvas fallback maps ground texture in addition to woodland. Raw river habitat cache remains independent of layer visibility.

### Verification and limitations

Full Node suite: 155 passed, 0 failed. Added coverage for canonical compact storage, distinct deterministic textures, terrain/water response, legacy-color preservation, bilinear/resolution consistency, material blend/erase caps, undo/redo, malformed import atomicity, new path coverage, grouped UI and all eight materials in 3D DOM interaction. DOM tests stub canvas and do not establish GPU performance or pixel quality.

Pure renderer warm measurements at 256² terrain→1024² raster were approximately 350–360 ms, excluding canvas/upload. A release rebuild can pause briefly; no guaranteed FPS. Keep render budgets bounded and profile actual hover/edit/orbit before raising editable-grid limits. No new topology, asset integration, settlements UI, simulation or storytelling is included. Tutorial and KB retain the 5–10% beginner Strength guidance.

Browser acceptance (local): light 2D and dark Canvas 3D showed distinct Clay/Scree paint; Shift erase, D→95% opacity, Undo and 3D painting/orbit exercised. Actual schema 7 project download 449795 bytes at 128², 131072 decoded coverage bytes. Actual MapPNG 4096² exported;128²Heightmap matched every saved bed pixel. No application console errors observed; extension metadata errors were unrelated. WebGL unavailable in this browser, so GPU visual/performance acceptance remains unverified.

Detailed 256² local map: paint release produced the full-resolution ground texture and stayed interactive; this was a functional observation, not an FPS benchmark.

Release evidence: application commit `f0ab812c57e7e1e3a3526c19dcd7c500151cc8a1`; GitHub Pages run 44390191940 completed successfully. Production browser showed v2.7, eight grouped ground materials, separate Forest density and preserved legacy landmarks; no application console errors. Screenshots were session artifacts and are not in the repository. Subsequent documentation-only commits do not change the runtime release.

## 26. v2.7.1 — Flatten target height and gentler Raise/Lower

User correction: D/E must adjust Flatten target height, not sculpt Strength. D decreases / E increases target by 1 block; Shift+D/E by 10, clamped 1–255. Paint/Path retain 5% opacity increments. Other tools ignore D/E. Input/select/contenteditable focus, dialogs and Ctrl/Meta/Alt combinations remain protected. Changing the setting alone neither edits terrain nor creates history. Inline Target height guidance, canvas hint and Shortcuts explain the mapping.

Raise/Lower now share an 8% starting Strength; Smooth/Flatten share their existing 35%. The two groups retain independently chosen strengths during this session; full 1–100% remains. No rate model, terrain limits, schema or existing map geometry changed. Holding a brush still continues sculpting; inspect in 3D and start with short strokes at 5–10%.

Future direction: develop consistent, distinctive tool icons and an MX Creative Console profile after interaction bindings settle. No hardware profile is shipped or configured by this change.

Verification for §26:157/157 full-suite tests pass, including target bounds/steps, focus/dialog/modifier guards, unchanged project state and separate strength-group memory. Local browser showed Raise 8%, Flatten 35%, target 120→119→129 in 2D and 129→128 in 3D; Lower returned to 8%. Syntax and diff checks pass.

## 27. v2.8 — terrain-shaped settlement brushes

Current request explicitly supersedes the old ban on settlement creation. Preserve nine toolbar tools and the removed right placement sidebar. Paint has Ground / Settlements modes. Settlements offers Hamlet, Village, Town, Abbey and Castle, brush Size/W/S, optional name, live status and Place/Cancel. Ground-material/Forest behavior remains separate. D/E is inactive for settlement placement; Flatten Target height and Ground Paint/Path Opacity shortcuts remain. Raise/Lower still start 8%.

### Planner and exact layout

`settlement-planner.mjs` exports `planSettlement({kind,mask,n,heights,sea,riverWater,settlements,occupancy?,seed,id,name})`. It preprocesses bounded safety/clearance/water-distance fields, chooses a connected dry buildable region and traces bank/contour-cost lanes, then places individually checked footprints. Water/cliffs/outside-mask/occupied cells stay clear. Partly suitable masks fit smaller layouts. Hamlet has a short approach; Town a square/branches; Abbey requires its hall; Castle requires a high defensible keep with safe ridge wall/court where possible. Courts/walls may be omitted if they cannot fit. No source arrays are mutated, no terrain flattened. This is procedural geometry, not imported Holler assets or civilization simulation.

Saved absolute geometry is authoritative: `layout:{version:1,buildings:[{corners:XY[4],ridge:XY[2],tone,rise}],lanes:XY[][],walls:XY[][],courts:XY[][]}` alongside existing id/kind/x/y/scale/rotation/seed/name. `settlementLayout` returns stored layout exactly, otherwise preserves the previous seeded 3-kind output. Sculpting updates the rendered ground beneath it but never replans horizontal geometry. New clearings follow features rather than a circular plot; forest density remains untouched. Names are sanitized to bounded plain text, including pasted controls.

### Persistence and budgets

Schema 8 imports 1–7 and preserves legacy records. Prior schema versions cannot introduce layout records or the new Abbey/Castle kinds. `canonicalSettlement` deep-copies permitted fields; invalid shapes, controls, IDs, non-finite coordinates and oversized geometry reject before history/world mutation. Max 64 records. Each layout caps 120 buildings,12 lanes/8walls/8courts,128points per line/32 per court; building extent≤20 per axis and bboxarea≤256, rise≤12. `settlementWork` caps each explicit record at 250000 and the project at 8000000. Commit enforces the same shared cap as import. Use cached `settlementCache.mask` as planner occupancy keyed by immutable settlement records/N.

### Preview lifecycle

Paint samples union brush discs into one transient N² search mask; frame scheduling coalesces replanning. Mask boundary plus actual proposal is drawn separately in 2D/3D. No preview pixels/records enter exports, autosave or history. End stroke keeps it; Place/Enter commits the reviewed non-dirty record with one snapshot. Cancel/Escape, tool/mode changes, valid imports and world creation discard it. Pan/orbit and 2D/3D switches preserve it. Sea/scene changes invalidate and rebuild before commitment. Names handle Enter/Escape locally, preserving ordinary text input. Locks/hiding/diagnostics prevent commit; dirty/unreviewed proposals cannot commit. Cancelling queues redraw so no ghost remains.

### Render and erase

Committed roofs/lanes/courts/walls share the existing 2D/3D/MapPNG composition. Heightmap stays actual bed-only. `settlementTouches` tests actual feature intersections for new records; legacy records retain circle hit behavior. Shift+Paint in settlement mode erases saved places, protected by the Settlements layer. Ground mode retains its target selector. No standalone Erase/Details/Drawing/settlement toolbar tool is added.

### Evidence and limits

Pure planner fixtures compare riverside and hillside Village lanes, all five forms, high Castle placement, partial dry masks, no-authority mutation, principal halls, canonical copying and adversarial work limits. DOM tests cover transient previews, exact commit/oneUndo/Redo, later sculpt preservation,3D placement, cancel/lock, sea invalidation, name-key handling and malformed imports. Browser fixture `docs/examples/river-and-hillside.world.json` has Bendhaven 10 buildings beside the river and Ridgewell 8 on the slope, both from 42-block brushes; actual project is schema 8 and terrain matches post-import Float32 bed exactly. Actual 4096² MapPNG export verified. Pure 256² planning medians 5–11 ms in this environment, with cold max ~41 ms; not a guaranteed FPS. Natural artwork scale is intentionally small; this release is not hand-painted sprite import, inhabitants, water-speed simulation, new clouds or erosion.

Final v2.8 verification:175/175 Node tests passed, including the final name-control reload test and cached-occupancy path. Read-only whole-change review found no remaining release blocker after corrections. Actual 128² Heightmap matched every saved Float32 bed pixel; actual 4096² MapPNG and schema 8 project with 10/8-building Village layouts were inspected. Browser 2D/Canvas 3D and both themes were checked; realGPU performance is not established.

Release v2.8: runtime commit `c4d3428c69f024b9accf57d80c74a021d9e1cd23`, Pages run 44451516984 succeeded. Production browser confirmed v2.8, all five settlement choices inside left Paint mode and preserved old terrain/landmarks; no application console errors. Later documentation-only commits do not change the runtime release. Session screenshot a local file (not in the repository) shows the two-Village acceptance fixture, not generated concept art.

## 28. v2.8.1 — settlement selector art correction

User rejected v2.8 selector buttons: tiny procedural roof previews did not resemble the supplied illustrated swatches, and the final Castle card stretched to a different size. Root cause was `renderPlaceCards()` repurposing tiny map geometry with fixed transforms and CSS giving Castle a full-width canvas.

Replace that thumbnail generator with five original painted atlas illustrations in `assets/settlements/*.webp`. Their HTML images have explicit square dimensions, lazy loading, async decoding and decorative empty alt text; the button itself retains the accessible kind label and aria-pressed selection semantics. All five cards share the same dimensions; Castle centers in the final row at one-column width. Labels are Georgia, and the active card has a gold outline/check while keyboard focus remains distinct.

These images illustrate place archetypes in the selector, not exact on-map sprite stamps. Terrain-aware geometry, layouts, project schema 8, placement/Undo and nine tools keep their v2.8 contract. Removed five startup planner/thumbnail-render calls. Art provenance is in `assets/settlements/README.md`. WebP encoding preserves original square composition; about 3.4MiB total, loaded lazily.

Full suite 175/175 passes. Browser checks confirmed all five images loaded, correct selected-kind handling, both themes, and identical 63×93pixel buttons at 180px sidebar width (image area square, name below). Wider sidebars scale cards consistently. Visual acceptance must inspect actual screenshots; passing geometry tests alone did not catch this art-direction failure.

## 29. v2.9 — remove settlements; behavior before decoration

**Current user decision supersedes all settlement instructions in §§20–22 and §§27–28. Do not restore settlement creation, a stamp editor or AI-art selection cards.** The user rejected both the settlement appearance and the direction/crowding it introduced.

Actionable next goal: **Make water spread into newly connected low ground when the user cuts a channel, with an immediate visual response that keeps sculpting smooth.** This is a product direction; the removal release does not add a fluid or erosion simulation.

Removal covers settlement modules/planner, generated artwork, Paint mode switch/type buttons/name/Place/Cancel/preview, geometry and canopy-clearance composition, labels, roofs, dedicated layer and erasing target, save/autosave/history fields, practice map and active tutorial/KB links. The legacy town landmark drawing/atlas entry is also removed. Nine toolbar tools, earthen materials, Forest density, paths/rivers, Living World, D/E Flatten target height and 8% Raise/Lower defaults remain.

Schema 9 writes no `settlements` or `layers.settlements` field. Imports 1–8 retain supported terrain/paint/colors/alpha/material coverage/forest/routes/legacy drawings/tree/mountain marks/layer controls, while ignoring retired settlement records/layers and omitting legacy town markers. Downloaded source project files are not rewritten; new saves contain the cleaned project. Settlement-specific tests retired with their modules; regression tests verify removal, clean imports and preservation of the remaining map data.

Archived release history is retained below/above for engineering context, not as active feature specifications. Current source, §0 and this section are authoritative.

Verification for v2.9: full Node suite **151 passed, 0 failed**. Local browser loaded the former two-village schema 8 map with terrain and river intact, no settlement controls/layer, a ground-only Paint palette with Forest density and all nine tools. 2D and 3D remain available. Responsive water is a future goal, not a delivered simulation.

Production v2.9: runtime commit `ed7776dd7374f8062468a75b0db244eaf4ba3864`, Pages run 44583324840 succeeded. Browser confirmed footer v2.9, simplified Paint controls, no settlement menus or layer, and the existing terrain project intact. No application-origin console errors; browser-extension metadata warnings excluded. Local light/dark and 2D/Canvas 3D inspected; no claim of real-GPU performance or new hydrology. Screenshots were session artifacts and are not in the repository.

## 30. v2.9.1 — restore Grain

The user missed Grain. Restore its existing deterministic `brushWeight` behavior as the fourth footprint; no new tool, slider, texture system or schema change. Four buttons use two columns, including narrow toolboxes. Grain modulates coverage with stable cell noise and soft edges; it works with selected materials, Forest density and sculpting without changing tool/material. Material texture is independent. Section 25 statements retiring Grain are superseded. Keep water behavior as the next major goal and settlements removed.

Verification: full suite 151/151 passes, including all four footprints painting Sand in 3D without changing relief/landmarks, no tool switching, and Grain status text. Local light/dark and 2D/Canvas 3D menus inspected. No schema change; writes 9.

## 31. v2.9.2 — sharp textures throughout editing

Root cause of the whole-map blur: texture() chose N² while pointer-down and(4N)² after release; woodland switched2N/4N. That shortcut is superseded. Both derived rasters now keep 4N in Terrain throughout strokes; diagnostics retainN and project schema stays 9.

`raster-cache.mjs` retains the previous RGBA buffer and cell-input copies. The renderers compute current terrain context/woodland fields, compare actual dependencies, and rerender the rectangle containing changed cells plus two cells of interpolation/shadow padding. Earthen dependencies include bed, base RGBA, visible river field, material coverage and derived wetness/slope/shelter/light; view/water/sea and size/resolution invalidate appropriately. Woodland clears the dirty area before repainting the current forest extent so removal cannot leave ghosts. Empty forest clears RGBA. Camera motion reuses textures; normal scheduled-frame coalescing remains. Cache state is derived only and excluded from save/history/export data. Full exports use the same sharp pixels.

Verification: full Node suite 155/155 passes. Tests compare cached material/woodland pixels against fresh renders after local edits, water/diagnostic changes and forest clearing, verify bounded/empty cache damage and resize invalidation, and hold a Paint gesture while asserting both displayed raster canvases remain 4N before/after release. One 256² flat scene benchmark: local 48 ms vs full 313 ms with byte-identical pixels. This is a single CPU measurement, not an FPS guarantee; large edits/global settings can still rebuild large areas.

Local browser acceptance: sculpted the existing 128² river/hillside map, restored it with Undo and switched to Canvas 3D. No application-origin errors were observed; extension metadata errors are unrelated. The automated held-gesture test verifies raster sizes; browser visual checks do not establish a GPU frame rate.

Release attempt: runtime commit `ae40db854d3e37e704e37770e3864a493e0940f6`; Pages run 44587451759 built successfully but GitHub returned HTTP 500 creating the deployment. A failed-job retry remained queued with no jobs. This is hosting evidence, not a test failure; verify a subsequent successful deployment and live v2.9.2 before claiming release.


## 32. Draft experiment — sea-connected water

PR #4 adds the visual response described in §29. The ocean reaches below-sea-level cells through four-neighbor routes from the map perimeter. Enclosed basins start dry, and a new cut can flood while the user is sculpting. The compact ocean raster and derived surface are shared by 2D and WebGL/Canvas 3D. Ground and woodland retain their existing terrain resolution. Authored river levels, bed heights, project schema 9 and the nine-tool editor are preserved.

Project open, Undo/Redo, reduced motion and Map PNG export use settled water. Heightmap view and its PNG show bed elevation. Hidden tabs pause the advance. Living World or Water motion off settles the coastline. This draft approximates ocean coverage visually and keeps all transient data out of project saves. See [experiment notes](docs/reactive-water-experiment.md). Verify frame pacing on representative hardware before marking the PR ready.

## 33. Walk mode, 512 terrain and basin fill (d1d9526)

Walk is a transient WebGL camera state. Movement uses the existing heightfield, and Esc restores the previous workspace. It has no project field, editing, or export effect. Under River, basin fill stores a bounded, validated `waterDrops` record and drain removes the fills covering the clicked cell. Both use the existing undo path and schema 9.

## 34. v2.9.3 — cumulus clouds and handoff rewrite (9b43bdb)

Clouds were rebuilt as cached cumulus sprites with ground-mapped shadows (see handoff §4.8). The previous renderer drew three overlapping 16%-opacity ellipses per cloud, which left visible seams; its polygon shadows were clamped at the border, and clouds popped when they wrapped. Art direction went through five rounds: too smooth (one blob), cotton balls (crisp puff edges with individual highlights), towers with a dip ("cat ears"), then merged heads with stronger shadows, then lower and larger in 3D. The handoff was rewritten as a current-state document and this file was split out. The repository was renamed to `landwright`; the old Pages path returns 404.

## 35. v2.9.4 — organic water shimmer

The old shimmer drew a 2-cell horizontal line at every cell of a regular n/32 lattice where both neighbors were wet, pulsing with one shared frequency. It read as graph paper. A 384-stroke cap also took the first rows, so marks bunched at the top of large maps.

Replacement (see handoff §4.8): jittered lattice thinned by patch noise; tapered curved crests with per-crest angle, length, period and drift; sparse brief glints; caps applied after a per-mark rank so coverage is even. First pass bowed crests upward and read as seagulls; the bend was reduced and turned to bow forward with the swell. Glints were made flatter and briefer after reading as dots in 3D. Measured JS draw cost about 0.1 ms per frame at 256² and 512² (Node, stub context); scene build 2–6 ms. Two tests cover grid-free placement, even quadrant coverage, varied orientation and length, no marks on dry land, full fade at cycle ends, and the per-frame projection budget.

## 36. v2.10 — height baseline

The user found Raise/Lower too hard to dial in and too easy to make extreme: terrain that looked good in 2D looked like "an EKG of a hummingbird" in 3D and worse in Walk. Measurements on the default seed-42 island before the change: the tallest peak stood 65% of the map's width at 128, 33% at 256 and 17% at 512, and 90% / 64% / 13% of land cells were steeper than 45° in 3D. Causes: 3D drew 0.65 blocks per height unit at every map size while generated heights do not scale with size; and Raise/Lower added `strength × 3` per dab with no per-stroke cap or slope limit, so holding still stacked height and small brushes built needles.

Changes, approved by the user after a side-by-side of today's 3D against half the vertical scale: size-independent 3D proportions (`verticalScale`); a per-world height range (default 20–190, inside 0–255) saved with the project; Raise/Lower as a height budget per stroke (default 3, 0.5–20 blocks) with easing near the limits; a natural slope limit (~50° in 3D) applied only to cells a stroke changed; new worlds fitted into the range. The beginner lesson moved from "5–10% Strength" to "1–3 blocks per stroke". Cloud altitude was raised to 235 so clouds stay above the ceiling. 193 tests pass, including a new `height-baseline.test.mjs`. While checking Walk, an existing problem was found: Walk starts on the central summit facing a steep face (recorded in handoff §11).

## 37. v2.10.1 — Walk start and flying

Walk used to start at the dry cell nearest the map center, which on generated islands is the summit, facing the center, so the first frame was the face of the peak: a dark wall. It now starts over lowland (lowest quarter of dry, gentle ground, nearest the land's centroid) facing inland. A first attempt at eye height still filled the view with the rising slope, so Walk now arrives hovering 14 blocks up. The user asked for Space to fly and Shift to descend: holding neither hovers, descending to eye height lands and resumes ground-following. Two tests cover the start position and flying, and the original ground-following test now lands first.

## 38. v2.11 — the river wand and freehand paths

The user wanted the *act* of drawing a river: "a micro anti-matter wand… the river carving, delta-swilling, swamp-ass brushing hydration station". The previous River was a pen tool (click points, a draft bar with a point count, Finish). Decisions: carving only while drawing; remove click points and Finish for both River and Path ("we can be trusted to draw roads on our own").

Built on the existing poured-water simulation (flow by surface-height difference every 90 ms). First playable version: a stroke carved 0.75 blocks and released water at the cursor. In the browser this was underwhelming: the groove was invisible through hill shading, and the water ran to the sea and vanished, leaving only a short streak and a few drops. Added: water along the whole held trail, a spring at the stroke's start so rivers keep flowing, Shift to dry, carve default 1.5, and a sea drain (poured water previously piled invisibly on the seabed). A test caught end-of-stroke sediment building islands above sea level; it now caps at 0.2 below sea level.

Performance: a spring keeps the simulation moving, and every tick re-rendered terrain (p95 frame 83 ms, ~2.2 s of long tasks per 2 s). A first threshold on depth change did not help, because the spring cell itself changes every tick. Redraw now happens only when more than 24 cells change visibly, otherwise every 1.5 s: an idle map with a spring holds 60 fps.

Tests: twelve route-drafting interaction tests were removed; added a legacy-route fixture (older maps still load and Reflow), river wand and Path brush interaction tests, and `river-wand.test.mjs` (bounded carving, Water 0%, erosion deepens beyond the brush cut, deltas below sea level, floor, sea drain). 192 pass. Known: settled rivers can look thin and dashed; old drafting code remains unreachable pending cleanup.

Before merging, the user asked for D/E to adjust strength for sculpting and channel depth for River, and found the meander slider ineffective ("try again"). D/E now steps the current tool's main setting (Flatten keeps the target height, an earlier explicit user decision). Meander was rebuilt as a wand setting with a visible swing; the old route meander was capped at half the river width. Checking meander with a map of carved cells showed the bends were right, but with Water on most of the water ignored the drawn channel: the stroke crossed slopes and water spilled over the lower bank. Grading the channel downhill along the stroke fixed that; a test then caught grading digging a pit when the brush was held still, so it now applies only when the stroke moves on. 195 tests pass.

## 39. v2.11.1 — Strength restored

The user found v2.10's "Height per stroke" confusing and the Raise tool overcorrected, and asked for Strength back with D/E. Measured on the live site with a size-24 brush: Height per stroke 3 added exactly 3 blocks per pass in fixed steps; the restored Strength at 8% adds about 1.7 blocks per pass, building smoothly as before. Raise/Lower use the pre-v2.10 formula again (`strength/100 × 3` per dab) through `strengthStroke`, keeping the height range easing; the 50° slope limit became a needle guard at about 68° that ordinary strokes never reach. D/E steps Strength by 1% up to 10% and 5% above (Shift ×4). The beginner lesson returns to "start at 5–10% Strength". The size-independent 3D scale and the height range from v2.10 stay. 196 tests pass.

## 40. v2.11.2 — tame rivers (PR #14)

Merged directly by the user: springs became short-lived with a saved remaining supply, the stroke water default dropped to 15%, trail water was reduced, and **Drain floodwater** clears all flowing and poured water in one undoable step.

## 41. v2.12 — one River setting, creeks, and the droplet

The user's spec: keep one River slider, *Carve depth*; use the brush size for width; let the hand draw the bends (remove Meander); give normal strokes a small, predictable amount of water and move the amount control to the droplet; Shift + River dries a stretch. They borrowed WorldBox's approach: lay out a shallow channel, inspect it, then add water and watch. Acceptance test: on a short mountain creek with a low bank, one pass should make a readable creek, and flooding the meadow should take a deliberate pour.

Measured in the browser after removing the sliders: one pass left about 50 wet cells, mostly pools in pits, and no visible course; the spring's whole supply is 0.28 units. Stronger running water would not help, because water on a slope leaves. So each stroke now also leaves a **creek**, a river route record (the same static local water older maps use, with Living World flow streaks) sitting 0.35 above the carved bed. The first version was broken into segments because the non-rising level rule let one deep scour cap the water downstream; trimming bumps in the channel center under the arriving water made it continuous. A test stroke that crossed a 25-block spur stayed dry over the spur, which is correct (water does not run uphill); a stroke traced down a valley produced a continuous creek with every point wet. New tests: the creek scenario (readable creek, meadow behind a low lip stays dry after the spring is spent, a deliberate pour floods it), creek continuity past a scour and a bump, Shift + River removing a creek. Meander code and its test were removed. 199 tests pass.

## 42. v2.12.1 — more creeks, no knife-edge walls

The user shared their Evergreen Island: 97% land with sea raised to 72, a snow range in the north, a lake, a forested river basin with hand-drawn meanders, a braided delta in the south-west and badlands with mesas in the south-east, and exactly 64 creeks, the project limit. The raster-work budget was about 1% used, and riverField for 512 such creeks takes about 90 ms (on route changes only), so the limit became 512 routes and 65,536 points, centralised as `MAX_ROUTES` / `MAX_ROUTE_POINTS`.

The map also had about 1,050 neighbor pairs jumping more than 15 blocks, many near the south edge, including a 92-block wall one cell thick at y=250. The coast there was a plain at exactly 54 = sea − 18 (Shift + Land's target) with isolated cells and lines still standing. Experiments ruled out Shift + Land alone (it cuts cleanly) and the river wand's sediment (no piles over 0.2). The cause is Land's full-depth, near-hard-edged cut: a gap between parallel passes leaves a wall one or two cells thick. Fix: `removeSpikes` after every Land dab, and a **Smooth spikes** World Settings action to repair existing maps (walls, spikes and the mirror-image pits, one or two cells thick; wider features and one-sided cliffs kept). On the user's map it changed 216 cells (0.33%); about 377 one-sided coastal cliffs remain by design. 204 tests pass.

## 43. v2.13.0 — compact toolbox

The user asked for less vertical space in the toolbox, with Strength, Opacity and the other dials in the same visual group as the tools, Pan removed, and shortcut keys easy to see. They use every tool, brush and material about equally, so the goal was to need no scrolling rather than to rank controls. Design: `docs/superpowers/specs/2026-11-24-compact-toolbox-design.md`; plan: `docs/superpowers/plans/2026-11-24-compact-toolbox.md`.

- **Measured before** (headless Chromium, 1440×900, 228px sidebar, 745px panel): Raise ~960px of content, Flatten ~1,100px, River ~1,200px, Paint ~1,600px. **After:** every tool fits in 745px, in both themes.
- Eight tools in a 4×2 grid with `<kbd>` key badges. The Terrain/Surface/Navigate sub-headings were dropped.
- **Dials** (`#brush-controls`) sit directly under the tools: Size (W/S) and the control D/E adjusts for the active tool. Strength, Target height and Carve depth moved here; all control IDs and behaviour are unchanged.
- Brush presets became 34px icon buttons with the selected name in the section title. Paint materials became swatches (name and family in the tooltip and accessible name) on an auto-fill grid that can grow when new materials arrive.
- **Pan removed.** Touch had no other way to pan, so a two-finger drag now pans the 2D map or the 3D camera. A stroke the first finger had started is rolled back without leaving an undo/redo entry. There is no pinch zoom. This is tested in jsdom only; real touch devices are unverified.
- Rejected: a Photoshop-style options bar (separates the dials from the tools, runs out of width) and tabs or accordions (add clicks for controls used constantly).
- Fixed: the River droplet (Pour water) button had been blank since v2.12 (commit 82f85b0), when its text label became an icon-only SVG with no size; `.tool-icon` sizes only apply inside the tool grid. It is now a 34px button with a 20px icon and a selected state while pouring.
- Styled River's *Fill / drain basin* and *Drain floodwater* as bordered buttons (they inherited the borderless global button reset and read as plain text); basin mode shows the shared selected state.
- *Smooth spikes* (World Settings) had the same plain-text look; it now shares the *Reflow rivers* button style.
