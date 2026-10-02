# Hero asset register

October 2, 2026 · Scott Brand System v1.0 · Generated with the built-in image_gen tool.

| Asset | Purpose | Source and processing | Distribution |
| --- | --- | --- | --- |
| `ticket-meal.jpg` | Decorative Ticket / Ticket Ocean hero | Original generated burger photograph, encoded as JPEG quality 85 without resizing or compositional changes | `src/images/` and `dist/images/` |
| `table-meal.jpg` | Decorative Table / Table Ocean hero | Original generated overhead meal photograph, encoded as JPEG quality 85 without resizing or compositional changes | `src/images/` and `dist/images/` |
| Inline plate SVG | Preserved original geometric hero; hidden in the current Local iteration | Original basic geometry based on the vision boards; uses palette variables | `src/index.html` and built HTML |
| Compact favicon SVGs | Selected identity in browser tabs | Original 32-unit pin, ticket, and table drawings with explicit palette colors; no font dependency | Static default in HTML; selected variants in `templates.js` |

The food is illustrative, not a photograph from a listed restaurant and not an offer. No third-party photo, logo, or stock asset was supplied. All three photos are outside meaningful page content and hidden from assistive technology. They do not contain prices, controls, or essential information. Keep them separate from offer records. Review recognizable content before release; generated imagery is not automatically cleared for every use.

## Ticket generation prompt

Use case: photorealistic-natural. Asset type: LoudounDeals Ticket theme website hero photograph. Wide landscape close-up of an appetizing unbranded cheeseburger with lettuce tomato toasted bun and a modest portion of golden fries on a plain ceramic plate at a neighborhood restaurant. Burger on right half, left half soft out-of-focus dark dining surface, warm natural window light, editorial food photography, realistic portions and textures. No text, logos, packaging, hands, price labels, or claims of a named restaurant. Image will be an illustrative decorative photo beside live webpage copy, not behind it. Simple uncluttered composition suitable for crop to 3:2 or wide.

## Table generation prompt

Use case: photorealistic-natural. Asset type: LoudounDeals Table theme website hero photograph. Landscape overhead editorial photograph of a fresh Mediterranean-style meal on a large plain white plate: leafy greens, tomato, chickpeas, cucumber, feta, a piece of pita; a simple fork and clear water glass on a light neutral tabletop. Plate located right of center with a little empty tabletop on left. Natural daylight, realistic inviting meal, sophisticated minimal composition. No text, logos, hands, packaging, restaurant identity, prices. This is illustrative decorative food photography, not a depicted listing or claim. Color neutral background so both warm Hearth and cool Tidal website palettes complement it. Crop-friendly at 3:2.

[Vision boards](README.md) · [Brand application](../../BRAND.md)

## Local generation

Prompt: Use case: photorealistic-natural. Asset type: original LoudounDeals Local and Local Ocean website hero photograph. Create a landscape editorial food photo of three appetizing soft corn tortilla tacos filled with grilled chicken, fresh pico de gallo, avocado and cilantro, with a lime wedge on a simple cream ceramic plate at a casual neighborhood cafe. Natural window daylight, honest everyday portions, inviting tactile textures, warm minimal styling. Slightly overhead three-quarter view. Plate and food centered slightly right, entire main meal comfortably inside the central 70 percent so it works in a circular crop. Neutral light tabletop and softly blurred surroundings complement both warm clay/olive and sea-glass/teal palettes. This is an illustrative decorative image, not a real restaurant or depicted offer. No text, logos, branding, people, hands, packaging, prices, recognizable third-party artwork, or watermark. Distinct from the site's burger and overhead salad photographs.

local-meal.jpg is an original generated taco photograph for Local and Local Ocean, encoded as JPEG quality 85 without resizing. It uses a rounded rectangular frame with one sweeping corner, distinct from Table’s circular crop. Distributed in src/images/ and dist/images/. Generated with the built-in image_gen tool on October 2, 2026.

Local’s frame accents reuse the original logo pin geometry as a CSS mask in the left margin and the logo’s 3:1 Signal dash in the top margin. Neither accent overlays the food.
