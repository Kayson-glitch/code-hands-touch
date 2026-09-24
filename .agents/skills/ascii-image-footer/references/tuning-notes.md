# Tuning notes — locked defaults

These values have been iterated on across multiple review rounds. Do **not** change them when merely swapping the image. Change only when the user explicitly asks for "stronger / weaker / faster / slower", and update this file in the same turn so the next reproduction inherits the new default.

All constants live at the top of `src/components/AsciiHandsFooter.tsx`.

## Current locked values

| Constant                                    | Value                          | Meaning                                                                                                                                               |
| ------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FONT_PX`                                   | `8`                            | Glyph optical size inside the 10 px cell                                                                                                              |
| `CELL_W`, `CELL_H`                          | `10`, `10`                     | Cell pitch in CSS px                                                                                                                                  |
| `GOOEY_RADIUS_UV`                           | `0.0376`                       | Reveal disc radius in UV space                                                                                                                        |
| `GOOEY_SOFTNESS_UV`                         | `0.023`                        | Reveal disc edge softness                                                                                                                             |
| `GOOEY_NOISE`                               | `0.018`                        | Noise breakup on the disc edge                                                                                                                        |
| `PARALLAX_MAX`                              | `13`                           | Max whole-scene parallax drift (CSS px)                                                                                                               |
| `PARALLAX_LERP`                             | `0.08`                         | Parallax easing                                                                                                                                       |
| Per-cell depth multiplier                   | `0.30 + bb*0.55 + c.armT*0.45` | Inside the `showGooey` block (~line 706). Controls how strongly each glyph rides the parallax based on brightness `bb` and along-arm progress `armT`. |
| `TILT_MAX_DEG`                              | `8`                            | Per-glyph tilt on hover                                                                                                                               |
| `TILT_FALLOFF`                              | `320`                          | Tilt distance falloff (px)                                                                                                                            |
| `REVEAL_TILT_MAX_DEG`                       | `12`                           | Per-glyph random tilt inside reveal disc                                                                                                              |
| `DISC_LERP_MIN` / `DISC_LERP_MAX`           | `0.08` / `0.22`                | Reveal disc follow easing (slow → fast pointer)                                                                                                       |
| `INTENSITY_LERP_MIN` / `INTENSITY_LERP_MAX` | `0.05` / `0.12`                | Reveal intensity easing                                                                                                                               |
| `SPEED_REF`                                 | `2.0`                          | Pointer speed (px/ms) that saturates the lerp                                                                                                         |
| `ARM_ANGLE_DEG`                             | `60`                           | Arm line orientation from horizontal                                                                                                                  |
| `ARM_ALIGN_STRENGTH`                        | `0.85`                         | 0 = isotropic edge noise, 1 = fully arm-aligned                                                                                                       |
| `INTRO_DURATION_MS`                         | `1600`                         | Intro reveal sweep duration                                                                                                                           |
| `INTRO_FRONT_WIDTH`                         | `0.08`                         | Intro sweep front width (UV)                                                                                                                          |

## Rule

> When the task is only "replace the image", touch **nothing** in this list. Rewrite this table only when the user asks for a tuning change and approves it.
