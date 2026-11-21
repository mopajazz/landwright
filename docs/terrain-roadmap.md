# Terrain behavior roadmap

> **Status, November 21, 2026:** the goal below was delivered: sea-connected reactive water, basin fill/drain and pour water (see [handoff §4.5](../handoff.md#45-water)). No next terrain goal has been agreed yet; candidates are listed in [handoff §12](../handoff.md#12-parked-and-deferred-topics). The text below is kept for context.

## Original goal

**Make water spread into newly connected low ground when the user cuts a channel, with an immediate visual response that keeps sculpting smooth.**

This is the next product focus, not a feature claimed in v2.9. Preserve the small toolset and current editing responsiveness while making the water response visible. Settlement/stamp editing and more decorative assets are outside this direction.

## Existing terrain workflow

River and Path now share a lightweight curve workflow (click to add points, drag to curve, double-click to finish, Escape to cancel). Keep controls to width and a few styles, with advanced behavior hidden. Support both 2D and 3D placement and undo.

Path paints a continuous terrain-following trail, initially dirt, stone, and sand. Routes retain their sampled geometry in project files. The first version supports preview/cancel/undo; editing control points after committing is deferred.

River carves a channel with softened banks, adjustable width and optional depth. Rivers use their own local water surface with a non-rising source-to-mouth profile; ocean sea level is unchanged. This is an authored terrain tool, not fluid simulation. Uphill routes cut through raised terrain. Water can be hidden to inspect the carved bed. River-water erasing removes the water record and keeps the channel; undo restores it.

Storytelling is a later phase, after terrain tools are complete. Revisit scope with the user then. Named river/path records may become useful anchors, but narrative UI, quests, timelines, and AI features are deferred.

## Proposed implementation

Read the [responsive water design](superpowers/specs/2026-11-19-responsive-water-design.md) and [staged implementation plan](superpowers/plans/2026-11-19-responsive-water.md). Planning only: worker-based finite-volume spreading, separate water rendering, schema10 proposal and measured responsiveness gates. The existing app has not acquired this behavior from the plan.
