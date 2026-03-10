# RevSync UI System

## Token Model
- Colors
  - `shell`, `shell-soft`
  - `surface-1`, `surface-2`, `surface-3`, `elevated`
  - `stroke-soft`, `stroke-strong`
  - `text-primary`, `text-secondary`, `text-tertiary`
  - `accent`, `accent-soft`
  - `primary`, `primary-soft`
  - `success`, `warning`, `danger`
- Spacing
  - `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`
- Radius
  - `10, 14, 18, 24`
- Motion
  - `fast: 100ms`
  - `ui: 160ms`
  - `panel: 220ms`
  - `hero: 320ms`

## Platform Mapping
- Desktop and web tokens are exposed as CSS variables.
- Mobile mirrors the same semantics through `Theme.Colors`, `Theme.Spacing`, `Theme.Layout`, and `Theme.Motion`.
- Existing aliases remain available so incremental refactors do not break current screens.

## Visual Rules
- Dark-first, matte shell backgrounds.
- Panels are layered through contrast and border control, not loud glow.
- Red is reserved for primary actions and safety-critical emphasis.
- Cyan/teal accents communicate structure, intelligence, and readiness.
- Orange remains warning-only.

## Component Taxonomy
- `shell`
- `panel`
- `panel-raised`
- `toolbar-button`
- `tab`
- `status-badge`
- `risk-banner`
- `metric-tile`
- `command-surface`
- `workflow-stepper`
- `inspector-group`
- `output-panel`

## Motion Policy
- Marketing motion is slower and more cinematic.
- Product motion is fast, structural, and low-amplitude.
- Safety-critical flows avoid bounce, scale-pop, or celebratory animation.
- Use opacity, panel continuity, and deterministic step transitions for flashing, validation, and recovery states.
