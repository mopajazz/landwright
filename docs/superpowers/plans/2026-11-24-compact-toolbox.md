# Compact Toolbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the left toolbox so the tools, Size, each tool's main D/E dial and the brush presets form one compact group with visible shortcut keys, and remove the Pan tool.

**Architecture:** Markup is regrouped in `index.html`, keeping every existing control ID so `app.mjs`'s `selectTool()` visibility logic and the D/E/W/S handlers keep working. The new layout is a clearly labelled block appended to the end of `theme.css`, following the repo's established override cascade. The palette markup is generated in `app.mjs`.

**Tech Stack:** Static HTML/CSS/ES modules, no build step. Tests use `node --test` with jsdom (`npm ci` first). Layout is fit-checked with the pre-installed Playwright.

**Spec:** `docs/superpowers/specs/2026-11-24-compact-toolbox-design.md`

## Global Constraints

- Behaviour, values and defaults of every sculpt, paint and route control stay unchanged. Every existing control element ID is kept.
- Eight tools and keys: Raise R · Lower L · Smooth Q · Flatten F · River V · Land C (also M) · Path J · Paint P (also B). H selects nothing.
- Space + left-drag and middle-drag panning keep working from every tool, in 2D and 3D.
- Fit target: at a 1440×900 viewport with the default 228px sidebar, `#left-panel` does not scroll for Raise, Lower, Smooth, Flatten, Land and Paint.
- Both themes pass `tests/contrast.test.mjs`. The collapsed rail, the settings flyout, 180px and 360px sidebars, and a ~500px window still work.
- Release becomes **v2.13.0**, with cache revision `2.13.0` everywhere at once (see handoff §9 "Releasing"; `assets.test.mjs` enforces it).

## Review Focus

1. **Touch users lose their only way to pan.** There is no touch pan gesture; the Pan tool was it. Expected: this is a known, documented trade-off (handoff §11). Zoom ± and Fit still work. Pinned in Task 5 docs, not code.
2. **Saved or remembered state naming `pan`.** No persisted tool exists today (`ui.mjs` stores theme, width, collapsed). Task 1 asserts that `selectTool` is never reachable with `pan` via keys.
3. **Hidden main dial still reacting to D/E.** Land has no main dial; D/E on Land must change nothing. Covered by a Task 2 test.
4. **Collapsed rail.** Tiles must still be icon-only, with the dials in the flyout. Task 4 fit-check covers it.
5. **Swatches without visible names.** Each must keep an accessible name and title. Covered by a Task 3 test.

---

### Task 1: Remove the Pan tool

**Files:**
- Modify: `index.html` (remove the Navigate group and the Pan button; help dialog line drops "· H Pan")
- Modify: `app.mjs:23,242,441-442,451,462-463,476-477,492,507` (drop `pan` from the key map and tool hint/keys/cursor tables; keep Space/middle-pan paths, `last.pan` and the `pan` offset object)
- Modify: `icons.mjs:13` (remove the `pan` icon if nothing else uses it)
- Test: `tests/interactions.test.mjs`

**Interfaces:**
- Produces: `[data-tool]` count = 8. `tool` is never `'pan'`.

- [ ] **Step 1: Update tests first.** Change every `querySelectorAll('[data-tool]').length,9` to `8`. Remove `'pan'` from the tool lists on lines 59 and 78. Add:

```js
test('Pan tool is removed; H selects nothing and Space still pans',()=>{
  assert.equal(doc.querySelector('[data-tool="pan"]'),null);
  clickTool('raise');key('h');key('H');
  assert.equal(doc.querySelector('[data-tool="raise"]').getAttribute('aria-pressed'),'true');
});
```

- [ ] **Step 2:** Run `node --test tests/interactions.test.mjs`. Expected: FAIL (count 9; the pan button exists).
- [ ] **Step 3:** Make the removals listed under Files. Then grep `app.mjs` for `'pan'`; the only remaining matches should be pan-gesture code, not tool code.
- [ ] **Step 4:** Run `npm test`. Expected: all pass, including the existing Space-pan tests (lines 114–116).
- [ ] **Step 5:** Commit: `Remove the Pan tool; Space and middle-drag still pan`.

### Task 2: Tool grid with key badges, and the dials block

**Files:**
- Modify: `index.html` (left panel markup)
- Modify: `app.mjs:477,487,489` (visibility of the moved labels)
- Test: `tests/interactions.test.mjs`

**Markup decisions:**
- `#tools` holds one `.tool-group-buttons` grid with the eight tiles in this order: Raise, Lower, Smooth, Flatten, River, Land, Path, Paint. Each key letter becomes `<kbd class="tool-key">R</kbd>`, keeping the existing `<b>` icon slot and label text. The group labels and dividers are removed. `role="toolbar"` and its aria-label stay.
- Section order in `#tool-settings`: `#brush-controls` (dials) → `#brush-settings` (brushes) → `#sculpt-settings` (now only the edge-protection option) → `#route-settings` → `#palette-section` → `#erase-settings`.
- `#brush-controls` contains, in order: `#size-label`, `#strength-label`, `#target-label`, `#wand-depth`'s label (moved out of `#wand-controls`), and `#opacity-label`.
- Each slider label is one row: name, `<output>`, a key badge, then the range input underneath, full width. Size's badge is `<kbd id="size-shortcuts">W/S</kbd>`; this replaces the old `<p id="size-shortcuts">`, keeping the ID. Each main dial gets `<kbd>D/E</kbd>`. The old `.quiet` hint spans under Opacity, Strength and Target are removed (the help dialog keeps that text).
- `#wand-controls` keeps the Drain floodwater button and its help text.

**Interfaces:**
- Consumes: the existing IDs `size-label`, `strength-label`, `target-label`, `opacity-label`, `wand-depth`, `size-shortcuts`.
- Produces: `#brush-controls` as the single dials container.

- [ ] **Step 1: Write the failing test.**

```js
test('dials block sits under the tools and shows each tool\'s D/E dial',()=>{
  const panel=$('tool-settings'),ids=[...panel.children].map(e=>e.id).filter(Boolean);
  assert.ok(ids.indexOf('brush-controls')<ids.indexOf('brush-settings'));
  const dial={raise:'strength-label',lower:'strength-label',smooth:'strength-label',flatten:'target-label',paint:'opacity-label',path:'opacity-label',river:'wand-depth'};
  const visible=id=>{let el=id==='wand-depth'?$(id).closest('label'):$(id);for(;el&&el!==panel;el=el.parentElement)if(el.hidden)return false;return true;};
  for(const[t,id]of Object.entries(dial)){clickTool(t);assert.ok($('brush-controls').contains($(id)),t);assert.ok(visible(id),t);
    for(const other of new Set(Object.values(dial)))if(other!==id&&!(t==='flatten'&&other==='strength-label'))assert.equal(visible(other),false,`${t} hides ${other}`);}
  clickTool('land');for(const id of new Set(Object.values(dial)))assert.equal(visible(id),false,'land '+id);
  assert.equal(doc.querySelectorAll('#tools kbd.tool-key').length,8);
});
test('D/E on Land changes no dial',async()=>{clickTool('land');const v=['strength','target','opacity','wand-depth'].map(i=>$(i).value),b=await state();key('d');key('e');assert.deepEqual(['strength','target','opacity','wand-depth'].map(i=>$(i).value),v);assert.deepEqual(await state(),b);});
```

Flatten currently shows Strength and Target together. The test allows that, so behaviour doesn't change.

- [ ] **Step 2:** Run it. Expected: FAIL (order and containment).
- [ ] **Step 3:** Restructure `index.html` as described above. In `selectTool`, set `$('wand-depth').closest('label').hidden=t!=='river'||waterTool()`. `#sculpt-settings` stays hidden except for Flatten (only the edge option is left in it). Remove references to deleted nodes.
- [ ] **Step 4:** Run `npm test`. Expected: all pass. If the D/E Land test fails, fix it in the D/E handler with no other behaviour change.
- [ ] **Step 5:** Commit: `Group tools and their dials; show W/S and D/E keys`.

### Task 3: Brush icon row and swatch palette

**Files:**
- Modify: `index.html` (`#brush-presets`: add `<span id="brush-name">`)
- Modify: `app.mjs:147-148` (palette markup) and the brush-select handler (update `#brush-name`)
- Test: `tests/interactions.test.mjs:128` (the earthen palette test)

**Decisions:**
- Brush buttons keep their `<b class="brush-symbol …">` icon. The visible text moves into `aria-label` and `title` (for example "Soft Round"). `#brush-name` shows the selected preset's name, and `#brush-description` stays.
- The palette renders as one flat wrapping list of swatch buttons in `EARTHEN_MATERIALS` order. Each button is `<button data-material="ID" aria-label="NAME" title="NAME · FAMILY">` containing only `.swatch`. The `.material-family` groups are removed. `#forest-paint` renders the Forest swatch the same way (`aria-label="Forest"`, `title="Forest · trees, not ground"`) and is laid out inline after the palette. `#paint-status` already names the selected material.

- [ ] **Step 1: Update the test at line 128.** Keep the order assertion `[1,6,7,3,8,9,2,5]` and the Forest/brush assertions. Replace the `.material-family` count with:

```js
for(const b of doc.querySelectorAll('[data-material]'))assert.ok(b.getAttribute('aria-label')&&b.title,b.dataset.material);
assert.equal(doc.querySelectorAll('#palette .material-family').length,0);
doc.querySelector('[data-brush="coast"]').click();assert.equal($('brush-name').textContent,'Coastline');
for(const b of doc.querySelectorAll('[data-brush]'))assert.ok(b.getAttribute('aria-label'));
```

- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement the markup changes. The brush-name source is the same mapping already used at `app.mjs:490`; extract it into `brushName(preset): string` and use it in both places.
- [ ] **Step 4:** Run `npm test`. Expected: all pass.
- [ ] **Step 5:** Commit: `Brush presets as an icon row; paint materials as swatches`.

### Task 4: Compact layout CSS and fit check

**Files:**
- Modify: `theme.css` (append a block headed `/* v2.13 compact toolbox */`; delete the now-dead `.tool-group-label`/divider rules and the `:last-child` Pan-spanning rules wherever they would fight the new block)
- Verify with: a Playwright script in the session scratchpad (not committed). It serves the repo through `page.route`, because a local server may not be available.

**Decisions:**
- `#tools .tool-group-buttons`: 4 columns. Each tile is about 44px tall, with the icon (22px) above a 9px label and the `kbd.tool-key` badge in the top-right corner. The badge must meet 3:1 contrast against the tile in both themes (reuse `--secondary`/`--accent`; the selected tile's badge uses `--accent`).
- Slider rows: label/output/badge on one ~16px line, with the range under it; about 8px between rows; reduced section padding.
- `#brush-presets`: `display:flex;flex-wrap:wrap;gap:4px` with 32px square buttons; `#brush-name` sits inline after them.
- `#palette` and `#forest-paint`: flex-wrap with 24px swatches. The selected swatch gets an accent ring.
- At sidebar widths below about 200px, tile labels hide (icon + badge stay). The collapsed rail keeps today's single-column icon tiles; badges are hidden there.

- [ ] **Step 1: Write the fit script.** At 1440×900, for each tool key in `r l q f c p`, assert `#left-panel.scrollHeight <= clientHeight+1`. Also log the heights for `v` and `j`. Screenshot the left 420px for Raise, Flatten, Paint and River in both themes (light: set `localStorage['landwright-ui']={"theme":"light"}`). Also capture: collapsed rail, sidebar width 180, and a 500×800 viewport.
- [ ] **Step 2:** Run it before the CSS. Expected: the fit assertions fail.
- [ ] **Step 3:** Write the CSS block.
- [ ] **Step 4:** Rerun until the fit assertions pass. Look at every screenshot, checking for clipped labels, overlapping badges, a broken rail or flyout. Run `npm test`, which includes the contrast test.
- [ ] **Step 5:** Commit: `Compact toolbox layout`.

### Task 5: Docs, help and release bump

**Files:**
- Modify: `index.html` help dialog; `README.md:30-33,64`; `docs/kb/projects.md:43`; `docs/tutorial.md` (if it mentions Pan or toolbox groups)
- Modify: `handoff.md` §0 (release row, Toolbar row → "**Eight** tools…", the "Keep nine tools" line → "Keep eight tools"), §4.2 tool table (drop the Pan row), §4.9 toolbox order (tools → dials → brushes → tool extras), §11 (add "Touch has no pan gesture since the Pan tool was removed in v2.13; zoom ± and Fit remain"), test count
- Modify: `.agents/skills/landwright-development/references/handoff.md` (refresh the snapshot)
- Modify: `docs/release-history.md` (v2.13.0 entry: why, before/after panel heights)
- Modify: every `?v=2.12.1` → `?v=2.13.0`, and the footer `v2.12.1` → `v2.13.0`

- [ ] **Step 1:** `grep -rn "2\.12\.1" --exclude-dir=node_modules .`, then replace the cache/version strings in code and `index.html`. Leave historical mentions in `docs/release-history.md` alone.
- [ ] **Step 2:** Update the docs listed above.
- [ ] **Step 3:** Run `npm test` (expect all pass, including `assets.test.mjs`), `git diff --check`, and `node --check app.mjs icons.mjs`.
- [ ] **Step 4:** Commit: `v2.13.0: compact toolbox docs and cache bump`, then push and update the draft PR description with verification details and what wasn't verified (real touch device, real GPU).
