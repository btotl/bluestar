# The Birth cinematic and the natal chart

The owner presses **BIRTH TOH-LOO**. The timestamp, time zone and coordinates
are frozen by the server, the canonical `BirthRecord` is computed, and the
screen goes fullscreen: no navigation, no form, no cards. The Furby, then the
exact sky of that moment assembling around it. The object they watch form is
the same component, with the same geometry, that they explore afterwards as
the permanent natal chart.

## Rendering architecture (hybrid)

```
React
 ├── ordinary UI
 ├── Motion for React      screen beats, Furby entrance, SVG line drawing, planet arrivals
 ├── SVG NatalChart        zodiac ring · ticks · house ring · cusps · axes · planets · aspects · labels
 └── optional WebGL        CelestialScene: sparse stars at depth, camera drift, motes, one bloom
```

The chart stays SVG: exact polar positioning, crisp custom glyphs, DOM
accessibility, straightforward taps, easy debugging. WebGL is atmosphere
only, behind the SVG, transparent, never load-bearing.

**Why plain Three.js and not React Three Fiber.** R3F 9.7 pins
`react >=19 <19.3`; this project is on React 19.3. Rather than force the peer
or downgrade React, `CelestialScene` is a small imperative Three.js component
(one context, `ResizeObserver`, pause on `visibilitychange`, full dispose on
unmount), lazy-loaded only at the `full` quality level. Swapping it for R3F
later touches one file.

## One geometry

`src/chart/geometry.ts` is pure and unit-tested:

- `degreeToChartAngle(longitude, ascendant)`: Ascendant at 9 o'clock, zodiac counter-clockwise.
- `polarToCartesian`, `sectorPath`
- `getSignSectors`, `getHouseCusps`, `getAxes`, `getPlanetPositions` (with glyph spreading and a small "arrival" offset), `getAspectLines` (between the true positions on the inner circle).

`NatalChart` renders these through layer components (`ZodiacRing`,
`ZodiacTicks`, `ZodiacGlyphs`, `HouseRing`, `HouseCusps`, `AxisLines`,
`PlanetLayer`, `AspectLayer`) plus an HTML glow, the portrait slot and a
foreground sparkle. `mode="static"` renders instantly; `mode="birth-animation"`
reveals every element at its delay from **one** table, `src/chart/birthTimeline.ts`.

## The timeline (seconds)

| beat | t | what |
| --- | --- | --- |
| The moment | 0 | dark sky, the Furby fades in, "The moment is sealed." |
| Zodiac | 1.5 → 3.2 | thin circle draws, twelve sectors lock in clockwise, ticks propagate, glyphs pop |
| Houses | 3.2 → 4.2 | cusps travel inward from the rim, numbers appear softly |
| Horizon | 4.2 → 5.5 | ASC → centre → DSC in cream, MC → IC in yellow, marker lights |
| Planets | 5.5 → 7.3 | Sun first, then Moon, inner planets, outer planets, each settling in from a few px along its orbit |
| Aspects | 7.3 → 8.8 | lines between exact positions, tightest first, cyan / rose / cream, masked away from the face |
| Illumination | 9.0 | strokes and glow lift, surrounding stars brighten, WebGL bloom |
| "The sky remembers." | 9.4 | |
| "NAME has been born" | 11.0 | Furby scales 0.96 → 1.03 and wakes; the chart recedes to 72 % |
| Exit | 13.2 | hand-off to the Reveal, or tap |

Reduced motion uses the same beats at 35 % length with opacity only.

## Face protection and depth

Aspect lines are masked by a radial gradient centred on the chart, so they
fade before the portrait boundary. Layer order back to front: background,
aspect web, house geometry, axes, planet markers, central glow, Furby,
foreground sparkle. A single pair of springs (`useParallax`) drives tiny
offsets: zodiac ring 2 px, planets 3 px; the Furby is the anchor.

## Quality levels

`detectQuality()` in `src/lib/quality.ts`:

| level | what | when |
| --- | --- | --- |
| `full` | SVG + Motion + WebGL atmosphere | WebGL available, ≥3 GB memory, ≥4 cores, no data saver |
| `standard` | SVG + Motion + CSS stars | otherwise |
| `reduced` | static chart, opacity only | `prefers-reduced-motion: reduce` |

`VITE_QUALITY=full|standard|reduced` forces a level for testing.

## Performance rules kept

- Stars on ordinary screens are two CSS `radial-gradient` layers
  (`CelestialBackdrop`), no canvas, no per-star nodes, no animation loop.
- Only transforms, opacity and `pathLength` animate. No per-frame React state.
- The WebGL scene renders at ≤1.5× DPR, pauses when the tab is hidden, and is
  disposed on unmount. One context.
- The static chart has no animation loop.

## Interaction (after Birth)

Tap a planet, the AC/MC label, a house sector or an aspect line. The selected
body lights up with its aspect lines; everything else drops to 12–30 %; the
body's zodiac sector glows; the interpretation appears directly under the
wheel with chips to hop along the connections.

**Not built: dragging the outer ring.** Rotating the zodiac while houses and
planets stay put would misstate the chart, so it was left out on purpose.

## Shared element

The portrait carries `layoutId="furby-portrait"` on the Birth screen, in the
cinematic, on the Reveal, the Profile and the Chart, so Motion animates the
same image between states instead of unmounting and remounting it.
