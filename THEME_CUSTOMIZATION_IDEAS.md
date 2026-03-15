# Theme-Specific Visual Customization Ideas

## 1. Per-Theme Border Radius

### Current State
All themes share identical `borderRadius` tokens:
```
small: '4px', medium: '8px', large: '16px', round: '50%'
```

### Proposal
Move `borderRadius` out of `sharedTokens` and into each theme definition, so every theme can define its own corner style. The TypeScript interface stays the same (`small`, `medium`, `large`, `round`), so every component that already reads `theme.borderRadius.*` just works — zero component changes needed for the base behavior.

### Per-Theme Values

| Theme | small | medium | large | round | Aesthetic Rationale |
|-------|-------|--------|-------|-------|---------------------|
| **Light** | 4px | 8px | 16px | 50% | Friendly, modern, unchanged |
| **Dark** | 4px | 8px | 16px | 50% | Clean, modern, unchanged |
| **Vintage** | 3px | 6px | 10px | 50% | Slightly softer — old amp knobs have subtle rounding, but no sharp edges either |
| **Indie** | 2px | 4px | 8px | 50% | Tighter corners — TASCAM/tape deck hardware has compact, utilitarian radii |
| **Disco** | 8px | 14px | 24px | 50% | Extra bubbly — 70s lounge furniture, rounded plastic, playful shapes |
| **Hip Hop** | 0px | 2px | 4px | 50% | Sharp/angular — TR-808 drum machine, Casio LCD segments, hard-edge industrial |

### Components That Auto-Adapt (use `theme.borderRadius.*`)
- `Card` (all blocks) — medium desktop, small mobile
- `Button`, `Input`, `TextArea`, `Select`
- `ChordDegree` pills — small
- `ScaleToneNoteUpdated` pills — small
- `SettingsDropdown` — medium
- `ControlPillStyled` — large
- `DropdownOption` — small
- `TsDropdown` / `TsOption`
- Nav dropdowns, visualizer elements, etc.

### Hard-Coded Radii to Migrate
These currently use literal px values and should be switched to `theme.borderRadius.*` so they also adapt:
- `StyledBeatBlock` — hardcoded `8px` → `theme.borderRadius.medium`
- `MetronomeToggleContainer` — hardcoded `6px` → `theme.borderRadius.medium`
- `MetronomeToggleBtn` — hardcoded `4px` → `theme.borderRadius.small`
- `SettingsIconBtn` — hardcoded `6px` → `theme.borderRadius.medium`
- `SVolIcon` — hardcoded `4px` → `theme.borderRadius.small`
- `DebugOverlay` — hardcoded `5px` → `theme.borderRadius.small`
- Various inline `borderRadius` values in JSX

### Size Preservation
Border radius changes do NOT affect element dimensions. `border-radius` only clips corners — `width`, `height`, `padding`, `min-width`, `min-height`, `aspect-ratio` all remain untouched. No resizing risk.

---

## 2. Generator — Per-Theme Dice Designs

### Current State
Dice are rendered as SVG shapes inside a `DieSvgWrapper` (96x96 desktop, 80x80 tablet, 72x72 mobile). Five shape functions: `D4Shape`, `D6Shape`, `D8Shape`, `D12Shape`, `D20Shape`. All use thin strokes, no fills, single color.

### Proposal
Create a `DICE_THEME_STYLES` config map. Each theme gets its own visual treatment applied to the SAME SVG paths/viewBox — so the bounding box never changes. Variations are purely cosmetic: stroke style, fill patterns, decorative overlays, glow effects.

### Per-Theme Dice Designs

#### Light (Clean & Minimal)
- **Style:** Current design, no change
- **Stroke:** 2.5px solid, clean color
- **Fill:** none
- **Extra:** none

#### Dark (Neon Outline)
- **Style:** Subtle outer glow on the stroke
- **Stroke:** 2px, slightly brighter primary color
- **Fill:** none
- **Extra:** SVG `<filter>` with `feGaussianBlur` + `feComposite` for a soft neon glow around the edges (like glowing hologram dice). Glow radius ~2px so it stays within the existing drop-shadow area
- **Number text:** Add a faint `text-shadow`-like glow via SVG filter

#### Vintage (Engraved Wood)
- **Style:** Thick, warm strokes with a hand-carved feel
- **Stroke:** 3px, slightly rough `stroke-dasharray: 1 0` (solid but with a subtle grain effect via `stroke-dashoffset` animation or SVG `feTurbulence` filter for texture)
- **Fill:** Very faint radial gradient fill (center lighter, edges darker) to simulate rounded wood/bakelite material — e.g., `fill="url(#vintage-grain)"` using `feTurbulence` + `feColorMatrix`
- **Extra:** Double-line border effect — inner shape 2px smaller with 1px stroke at 30% opacity, giving an engraved/debossed look
- **Number text:** Serif-like positioning, slightly bolder weight

#### Indie (Dot-Matrix / Blueprint)
- **Style:** Dashed/dotted outlines like technical schematics or dot-matrix printout
- **Stroke:** 2px with `stroke-dasharray: 4 3` (dashed lines)
- **Fill:** none
- **Extra:** Faint grid lines in background of each die (like graph paper) — add subtle `<line>` elements at 20x20 intervals, 5% opacity. Corner markers: small cross-hairs (+) at each vertex of the polygon
- **Number text:** Monospace appearance (already VT323 font), add brackets like `[4]`

#### Disco (Holographic / Mirror Ball)
- **Style:** Gradient strokes with shimmer
- **Stroke:** 2.5px, use `<linearGradient>` cycling through neon pink → teal → pink along the path
- **Fill:** Faint animated gradient fill (CSS `@keyframes` rotating a `linearGradient` slowly, ~8s loop) — gives a slow color-shifting holographic effect. Very low opacity (10-15%) so numbers stay readable
- **Extra:** Tiny sparkle dots — 3-4 small circles (r=1.5) placed randomly inside the die shape, each with a `twinkle` animation (opacity 0→1→0, staggered timing). Like light bouncing off a disco ball
- **Number text:** Gradient fill matching the stroke gradient

#### Hip Hop (LCD Segment / Industrial)
- **Style:** Sharp, mechanical, LCD display aesthetic
- **Stroke:** 2.5px, perfectly sharp corners (`stroke-linejoin: miter` instead of `round`)
- **Fill:** Very faint fill (5% opacity of primary color) — like a backlit LCD panel
- **D6 shape override:** Change `rx="8"` to `rx="0"` — perfectly square corners to match the Casio/TR-808 aesthetic
- **Extra:** Inner border line 4px inset, 1px stroke, 15% opacity — mimics the recessed panel border of hardware drum machines. Small "tick marks" at midpoints of each edge (tiny perpendicular lines, 3px long) like measurement markings on equipment
- **Number text:** Use `letter-spacing: 2px` style and sharp rendering, mimicking 7-segment LCD feel. Could add faint horizontal line through the middle of the number area (like LCD segment divider)

### Implementation Approach
```typescript
const DICE_THEME_STYLES: Record<ThemeName, {
  strokeWidth: number;
  strokeLinejoin: 'round' | 'miter' | 'bevel';
  strokeDasharray?: string;
  fillOpacity: number;
  filters?: React.ReactNode;      // SVG <defs> for filters/gradients
  decorations?: React.ReactNode;  // Extra SVG elements overlaid
  d6Rx: number;                   // D6 corner radius
}> = { ... };
```

### Size Preservation
All changes are INSIDE the existing 100x100 viewBox SVG. The wrapper div (`DieSvgWrapper`) dimensions are untouched. No layout shift possible.

---

## 3. Metronome — Per-Theme Block Designs

### Current State
`StyledBeatBlock` — square blocks (`aspect-ratio: 1, height: 100%`) with `border-radius: 8px`, `border: 2px solid`. Active+playing blocks fill with `theme.colors.primary` and pulse (scale 1→1.12→1). Contained in `BlockRow` with `8px gap`, max-height `120px`. Content area is `210px` tall.

### Proposal
Create a `METRONOME_BLOCK_THEME` config. Each theme defines visual treatment for the beat blocks while keeping the same `aspect-ratio: 1`, `height: 100%`, gap, and container dimensions. Only cosmetic properties change: border style, background pattern, inner decoration, animation variant.

### Per-Theme Block Designs

#### Light (Clean Tiles)
- **Style:** Current design, no change
- **Border:** 2px solid
- **Background (inactive):** `theme.colors.background`
- **Background (active):** `theme.colors.primary`
- **Inner decoration:** Beat number only
- **Pulse animation:** Current scale(1.12) pulse

#### Dark (Glowing Pads)
- **Style:** MPC-style pressure pads with glow
- **Border:** 1px solid with subtle glow
- **Background (inactive):** Slightly lighter than card (`background + 05`)
- **Background (active):** Primary with radial gradient (brighter center, darker edges) — simulates a backlit pad being pressed
- **Inner decoration:** Beat number with text-shadow glow. Faint crosshair lines (vertical + horizontal center lines at 8% opacity) like alignment marks on studio pads
- **Pulse animation:** Current pulse + brief `box-shadow` glow burst (0→medium→0 over 0.15s)

#### Vintage (Vacuum Tube Windows)
- **Style:** Rounded rectangles resembling amp indicator windows
- **Border:** 3px solid with slightly darker inner shadow (`inset box-shadow`)
- **Background (inactive):** Dark warm brown (like unlit tube socket)
- **Background (active):** Warm amber/orange radial gradient (bright center → dark edge) — like a vacuum tube glowing when heated
- **Inner decoration:** Beat number in serif-ish weight. Subtle concentric rounded rect at 10% opacity (like the glass envelope of a tube). Faint "filament" — a thin vertical line (1px, 15% opacity) through center
- **Pulse animation:** Slower, warmer — scale(1.05) over 0.25s with a brief brightness increase (filter: brightness 1→1.3→1). Feels like a tube warming up

#### Indie (Cassette Tape Segments)
- **Style:** VU meter segments / tape counter display
- **Border:** 1px solid, utilitarian
- **Background (inactive):** Dark steel-blue (like unlit VU segment)
- **Background (active):** Bright teal-green (#4db8a0) — the classic VU meter "safe zone" color. If it's the accent beat (beat 1), use warm gold (#e8a832) — like the VU meter hitting the "hot" zone
- **Inner decoration:** Beat number in monospace. Two small horizontal lines above and below the number (like the markings on a tape counter). Faint horizontal scanline effect (repeating-linear-gradient with 1px transparent / 1px 3% opacity lines, like an old CRT/LED display)
- **Pulse animation:** No scale — instead, a quick brightness flash (filter: brightness 1→1.5→1 over 0.1s). VU meters don't bounce, they flash

#### Disco (Mirror Tiles)
- **Style:** Reflective mirror-ball facets
- **Border:** 1px solid with gradient border (pink→teal cycling)
- **Background (inactive):** Deep purple with a subtle diagonal gradient (two shades of dark purple at 45deg)
- **Background (active):** Animated gradient cycling through neon pink → purple → teal over 2s. Or a radial burst from center
- **Inner decoration:** Beat number with gradient text. 2-3 tiny "sparkle" pseudo-elements (small diamond shapes ◇ at random positions inside, 20% opacity, with staggered twinkle animation). Faint diagonal line across the block (like light refraction on a mirror tile)
- **Pulse animation:** Scale(1.08) + simultaneous rotate(3deg→0deg) — a little disco bounce/tilt. Box-shadow with neon glow color

#### Hip Hop (TR-808 Drum Pads)
- **Style:** Rectangular rubber pads with sharp edges, like the iconic TR-808/MPC grid
- **Border:** 2px solid, sharp corners (border-radius will be 0-2px from theme)
- **Background (inactive):** Dark charcoal with very faint 1px inset border (recessed pad look)
- **Background (active):** Primary orange with slight inset shadow on top edge (simulates the pad being physically pressed down). Use `box-shadow: inset 0 2px 4px rgba(0,0,0,0.4)` for the pressed-in effect
- **Inner decoration:** Beat number in condensed/bold weight. Small LED-style dot in top-right corner (4px circle) — dim when inactive, bright when active (like the step sequencer LEDs on a drum machine). Faint horizontal line through the middle at 5% opacity (pad crease)
- **Pulse animation:** OPPOSITE of scale-up — instead do scale(1→0.95→1) over 0.1s (pad pushes IN, not out). Combined with the inset shadow deepening briefly. Feels mechanical and percussive

### Implementation Approach
```typescript
const METRONOME_BLOCK_THEMES: Record<ThemeName, {
  borderWidth: string;
  borderStyle: string;
  inactiveBackground: string;    // or gradient
  activeBackground: string;      // or gradient
  inactiveBorderColor: string;
  activeBorderColor: string;
  boxShadowActive?: string;
  boxShadowInactive?: string;
  innerDecoration?: React.ReactNode;  // Extra elements inside block
  pulseKeyframes: Keyframes;
  pulseDuration: string;
}> = { ... };
```

### Size Preservation
All blocks remain `aspect-ratio: 1; height: 100%; max-height: 100%`. Container dimensions (`BlockRow` gap, `ContentArea` height 210px, `BlocksArea` padding) are untouched. Only cosmetic properties (border style, background, shadow, decorations, animation) change. Inner decorations use `position: absolute` within the block so they don't affect layout flow.

---

## 4. Metronome Base (Card Container) Per Theme

The Card's `border-radius` already adapts if we move `borderRadius` out of shared tokens (see Section 1). No extra work needed — every block container automatically gets the theme-appropriate corner style.

Additional per-theme Card tweaks could include:
- **Vintage:** Faint `box-shadow: inset 0 1px 3px rgba(0,0,0,0.2)` for an embossed panel feel
- **Indie:** `border: 1px solid ${border}` for a hardware panel outline
- **Disco:** Extremely subtle gradient border (via `background-clip` trick or border-image)
- **Hip Hop:** `border: 1px solid ${border}` with sharp corners, slight inset shadow

---

## Summary of Changes

| Area | What Changes | What Stays Fixed |
|------|-------------|-----------------|
| Border radius | Per-theme values for small/medium/large | All element dimensions, padding, margins |
| Dice (generator) | Stroke style, fill, filters, decorations | viewBox 100x100, wrapper 96/80/72px, SVG paths |
| Chord/scale pills | Auto-adapt via theme.borderRadius.small | Padding, min-width, min-height, font-size |
| Metronome blocks | Border style, background, animation, inner art | aspect-ratio 1, height 100%, gap 8px, container 210px |
| Metronome base (Card) | Auto-adapt via theme.borderRadius.medium | Padding, max-width, flex layout |

**Zero layout shift. Zero resize. Pure cosmetic differentiation.**
