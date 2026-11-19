# Landwright knowledge base

User documentation is being compiled alongside the application. These articles describe shipped behavior, with limitations called out explicitly. Start with the [tutorial](../tutorial.md); use the [engineering handoff](../../handoff.md) for implementation details.

| Topic | What you will find |
| --- | --- |
| [New worlds and resolution](worlds.md) | Live previews, terrain detail, backups, 1K/2K/4K exports |
| [Brushes and strength](brushes.md) | Low-strength first strokes, material/footprint independence, opacity, edge protection |
| [Paths and rivers](routes.md) | Placement, taper, meander, reflow, layers and erasing |
| [Forests and clearings](forests.md) | Density painting, terrain eligibility, layers, breeze and save/export behavior |
| [Living World](living-world.md) | Water motion, atmosphere, pause behavior, preferences and performance |
| [Projects and troubleshooting](projects.md) | Saving, exports, shortcuts, common problems, recovery |

## Documentation maintenance

For each new feature, update its article with: where to find it, a short procedure, what it changes, undo/save/export behavior, limits, and common mistakes. Update the tutorial only when the beginner workflow changes. Link new articles here and keep the in-app Help links working. Verify claims against current handlers and tests; label planned features as planned.

The user specifically asked that Raise/Lower guidance teach low Strength first. Preserve that warning prominently in the tutorial and brush article.

Current scope: terrain and cartographic routes, forests, plus visual atmosphere. Holler Maps source assets have not been imported, and storytelling remains deferred. Do not describe future population, simulation, or narrative tools as available.

- [Earthen materials, blending and terrain response](materials.md)
