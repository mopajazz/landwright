# Landwright color contrast audit

The UI palette is checked against WCAG 2.2 AA contrast thresholds: 4.5:1 for normal text (SC 1.4.3), and 3:1 for essential control/focus indicators (SC 1.4.11).

| Theme | Lowest UI text pair | Primary button text | Eraser text | Lowest checked control pair |
| --- | ---: | ---: | ---: | ---: |
| dark | 5.03:1 | 10.55:1 | 8.44:1 | 4.06:1 |
| light | 4.98:1 | 7.83:1 | 8.96:1 | 3.60:1 |

The automated test reads the actual palette declarations in `theme.css`. Visible UI text uses these semantic colors; form tracks, borders, focus outlines, and icons use contrasting theme indicators. Canvas artwork and terrain colors, disabled controls, and decorative separators are not included in these pair calculations.

This is a color-pair audit, not a claim of complete WCAG conformance. Keyboard navigation, text alternatives for interactive canvas content, assistive-technology support, and usability require broader assessment.

Sources: [Text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
