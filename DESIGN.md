# Design Brief

| Field | Value |
|-------|-------|
| **Tone** | Premium tech × disciplined focus; luxury minimalism with neon precision |
| **Primary Color** | Purple Neon `oklch(0.65 0.25 280)` — vibrant command, sophisticated restraint |
| **Secondary Color** | Deep Blue `oklch(0.42 0.18 245)` — anchor stability |
| **Accent Color** | Neon Cyan `oklch(0.68 0.22 200)` — focus highlights, active indicators |
| **Background** | True Black `oklch(0.08 0 0)` — premium depth |
| **Card Surface** | Purple-tinted Dark `oklch(0.15 0.015 280)` — glassmorphism foundation |
| **Text (Foreground)** | Warm White `oklch(0.94 0 0)` — high contrast, refined warmth |
| **Display Font** | Space Grotesk (400, 600, 700) — geometric precision, hierarchy leadership |
| **Body Font** | DM Sans (400, 600) — legible, warm, professional clarity |
| **Mono Font** | JetBrains Mono (400) — data zones, timers, metrics |

## Visual Hierarchy & Elevation

| Zone | Treatment | Usage |
|------|-----------|-------|
| Sidebar | Dark card `bg-sidebar/40 backdrop-blur-md` with accent highlight on active items | Navigation anchor, persistent context |
| Cards (Default) | Glassmorphism: `bg-card/40 backdrop-blur-md border-border/20` | Information containers, secondary metrics |
| Cards (Elevated) | `bg-card/50 backdrop-blur-xl border-border/30 shadow-elevated` | Primary containers, dashboard cards, interactive zones |
| Cards (Hover) | Lifted transform, enhanced blur `backdrop-blur-2xl`, layered shadow + glow | Interactive affordance, depth feedback |
| Header | Subtle bottom border `border-border/30`, no background lift | Page title, minimal elevation |
| Focus Ring | Conic gradient (purple → cyan → blue → purple), static rotation | Visual focal point, dashboard hero element |

## Spacing & Density

- **Outer margins**: `px-6 sm:px-8 lg:px-10` on main sections
- **Card gaps**: `gap-4 md:gap-6` in grids, consistent rhythm
- **Internal padding**: `p-4` for small cards, `p-6` for panels, `p-8` for hero containers
- **Button sizing**: `px-4 py-2` standard, `px-6 py-3` prominent, `px-3 py-2` compact
- **Label/value spacing**: `space-y-1` tight, `space-y-2` relaxed

## Component Patterns

| Pattern | Treatment |
|---------|-----------|
| **Primary Button** | `bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold transition-smooth`; hover: lifted (+1px transform), shadow elevation |
| **Secondary Button** | `border border-border bg-transparent text-foreground px-4 py-2 rounded-lg`; hover: `bg-muted/20` |
| **Ghost Button** | `text-foreground px-3 py-2 rounded-lg`; hover: `bg-muted/15`, active: `bg-muted/30` |
| **Metric Value** | `font-display text-2xl md:text-4xl font-bold text-foreground` |
| **Metric Label** | `text-xs uppercase tracking-widest text-muted-foreground font-mono` |
| **Active Indicator** | Neon cyan border or text (`text-accent` / `border-accent`) with optional subtle glow |
| **Text Accent** | Gradient text (purple → cyan) for emphasis; `gradient-accent-text` utility class |

## Motion & Interaction

- **Transition Default**: `transition-smooth` (0.3s cubic-bezier(0.4, 0, 0.2, 1)) — all properties
- **Transition Subtle**: `transition-subtle` (0.2s cubic-bezier) — quick feedback
- **Card Hover**: lifted +2px, blur increases 20px→24px, shadow deepens from elevated→glow+accent-glow
- **Button Hover**: lifted +1px, shadow elevation, no motion sickness (no bounce/scale)
- **Focus Ring**: neon cyan 2px ring, 2px offset, respects keyboard nav
- **Animations**: fade-in (0.3s), slide-in-up (0.4s), pulse-glow (2s infinite) — choreographed, purposeful

## Structural Zones

### Sidebar Navigation
- Background: `bg-sidebar/40 backdrop-blur-md border-r border-border/20`
- Nav Item: `rounded-lg p-3 hover:bg-muted/15 transition-smooth`; active: left border-accent 3px + `text-accent`
- Icon + Label: stacked vertically, centered alignment

### Main Content Header
- Border: `border-b border-border/30`
- Layout: horizontal, title left-aligned, actions right-aligned
- Title: `text-display-bold` (Space Grotesk), optional subtitle (body, muted-foreground)

### Content Grid
- Desktop: 3–4 columns; Tablet: 2 columns; Mobile: 1 column
- Card gaps: `gap-4 md:gap-6` consistent rhythm
- Cards: `card-surface` utility (glass-card-hover + rounded-lg + padding)

### Focus Score Ring (Hero)
- Circular SVG (240px diameter), centered in its container
- Gradient stroke: conic (purple → cyan → blue → purple, 360°)
- Inner circle: number (metric-value), label (metric-label)
- Optional outer glow via layered shadows or filter blur

### Analytics Cards
- Small metric containers: number top, label bottom
- Layout: `flex flex-col justify-between` with gap
- Optional: sparkline or trend icon for visual reference
- Hover: same elevated state as all cards

## Signature Detail

**Refined Glassmorphism with Layered Depth** — Cards use multi-layer shadows (base elevation + primary glow + accent highlight on hover) to create premium depth without harshness. Static conic-gradient focus ring combines all three neon colors rotating 360° — this is the interface's signature, signaling active focus tracking and separating the dashboard from generic analytics UIs. Gradients are accents, not decoration.

## Constraints

- **No raw colors** — all colors via CSS custom properties `oklch(var(...))`
- **No arbitrary Tailwind classes** — use semantic token utilities only
- **Max 3 font weights** — 400 (regular), 600 (semibold), 700 (bold)
- **No more than 4 shadow layers** — readable depth hierarchy
- **Glassmorphism on cards only** — focused effect, not full-page backgrounds
- **Transitions max 400ms** — responsive, not sluggish
- **All UI data from backend** — no hardcoded demo values
