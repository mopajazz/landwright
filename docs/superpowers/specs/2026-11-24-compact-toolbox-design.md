# Compact toolbox — design

**Date:** 2026-11-24 · **Status:** awaiting approval

## Intent

Every tool and its controls are used about equally often: Size and Strength
constantly with Raise, Lower and Smooth; Target height with Flatten; brush
presets and paint materials as often as tools. So the goal is not to rank
things. It is that **nothing in regular use needs a scroll to reach**, the
dials sit in the same visual group as the tools, and keyboard shortcuts are
easy to see.

Today, at 1440×900, the toolbox holds 960px (Raise) to 1,600px (Paint) of
content in a 745px panel. Shortcut letters are 9px grey text in each tile's
corner.

## Goals

- Tools, Size, the tool's main dial and the brush presets form one block at the top.
- Shortcut keys are visible on tiles and next to dials (W/S, D/E).
- At 1440×900 with the default 228px sidebar, Raise, Lower, Smooth, Flatten,
  Land and Paint fit without scrolling. River and Path may scroll a little
  for their route extras.
- The brush row and paint swatch grid wrap cleanly as more brushes and
  materials are added (a planned next project: moss, pines, cliffs…).

## Non-goals

- New brushes, materials or tree types (a separate project after this one).
- Changes to the right panel, the top nav or how the canvas behaves.
- Changes to any sculpt or paint behavior, values or defaults.

## Anti-goals

- Hiding controls behind tabs, accordions or extra clicks.
- Losing keyboard or screen-reader access. Tools stay a `role="toolbar"`,
  sliders keep their labels, and swatches keep accessible names.
- Breaking the collapsed rail, narrow sidebars (down to 128px effective) or
  the light theme.

## Approaches considered

- **A. One compact panel, regrouped (chosen).** Same sidebar, contents
  rebuilt into a tight top block. This is the only option that keeps tools
  and their dials together and all within reach.
- B. A Photoshop-style options bar over the map. This splits the dials from
  the tools and runs out of width on smaller screens.
- C. Tabs or collapsible sections. These add clicks for things used
  constantly.

## Decided

1. **Remove the Pan tool** and its H shortcut. Space-drag and middle-drag
   already pan from every tool. Saved UI state that names `pan` falls back
   to Raise. The tool count goes from nine to eight, and the handoff doc's
   "keep nine tools" rule is updated.
2. **Tools:** a 4×2 grid of compact tiles. Each has an icon, a short label
   and a visible key badge: Raise R · Lower L · Smooth Q · Flatten F /
   River V · Land C · Path J · Paint P. The Terrain/Surface sub-headings go;
   a single grid reads as one group.
3. **Dials block**, directly under the tools:
   - Size, with a `W/S` badge.
   - The **main dial**: whichever control D/E adjusts for the active tool.
     That is Strength (Raise, Lower, Smooth), Target height (Flatten),
     Opacity (Paint, Path) or Carve depth (River). It has a `D/E` badge. Land
     has no main dial.
   - Each slider row is a single line: label · slider · value · key badge.
4. **Brush presets:** one row of small icon buttons that wraps. The selected
   brush's name shows beside the row or under it, and each button has a
   tooltip and an accessible name.
5. **Paint palette:** a wrapping grid of colour swatches. The name appears on
   hover/focus (tooltip) and for the selected swatch. Forest stays in the
   grid as a swatch.
6. **Tool extras** (Flatten's edge option, River/Path route settings, forest
   density, Shift-erase target) go below the top block, keeping their
   current behaviour.
7. Help dialog, canvas hints, tests and `handoff.md` are updated to match.

## Left to the builder

- Exact tile, badge and slider sizes, as long as the fit targets above are
  met in both themes and at the narrow and collapsed widths.
- Whether to move the existing sliders into the dial slot or show/hide
  them in place. Behaviour must stay identical either way: the same element
  IDs, values and D/E logic.
- Where the selected brush or material name sits.
