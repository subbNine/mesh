# Color Palette

## Brand Colors

### Primary - Teal (#279FBD)

The heart of the Mesh brand. Used for primary CTAs, navigation highlights, and brand identity.

```
#279FBD (RGB: 39, 159, 189)
HSL: 195°, 65%, 45%
WCAG AAA Contrast Ratio: 7.2:1 against white
```

**Usage:**
- Primary buttons (background)
- Brand logo
- Active navigation items
- Focus states
- Primary links
- Highlights and accents

**Variants:**
- Teal 50: `#e8f5fa` (very light background)
- Teal 100: `#c9eaf5` (light background)
- Teal 200: `#a3ddf0` (lighter)
- Teal 300: `#6dc9e8` (light, good for hover)
- Teal 400: `#3dafcd` (hover state)
- Teal 500: `#279FBD` (main)
- Teal 600: `#1f7fa3` (darker for active/focus)
- Teal 700: `#195f82` (darkest)
- Teal 800: `#124163` (very dark)
- Teal 900: `#0c2a45` (darkest, for special states)

### Secondary - Blue (#266BD4)

Supporting brand color. Used for secondary actions, alternative CTAs, and supporting UI.

```
#266BD4 (RGB: 38, 107, 212)
HSL: 217°, 81%, 49%
WCAG AAA Contrast Ratio: 8.1:1 against white
```

**Usage:**
- Secondary buttons
- Secondary navigation
- Supporting links
- Accents in charts
- Secondary highlights

**Variants:**
- Blue 50: `#eef5ff` (very light background)
- Blue 100: `#d9ebff` (light background)
- Blue 200: `#b3d8ff` (lighter)
- Blue 300: `#80bfff` (light)
- Blue 400: `#4d9fff` (hover state)
- Blue 500: `#266BD4` (main)
- Blue 600: `#1a51b3` (darker)
- Blue 700: `#143d92` (darker)
- Blue 800: `#0e2a72` (very dark)
- Blue 900: `#091854` (darkest)

## Accent Colors

### Purple (#9654B8)

Creative, collaborative accent. Used for special highlights, team features, and creative tools.

```
#9654B8 (RGB: 150, 84, 184)
HSL: 278°, 44%, 53%
WCAG AAA Contrast Ratio: 5.8:1 against white
```

**Usage:**
- Collaboration features
- Creative tools
- Special highlights
- Character/user avatars
- Distinction from primary actions

### Gold (#F6B900)

Positive, success accent. Used for achievements, success states, and valuable highlights.

```
#F6B900 (RGB: 246, 185, 0)
HSL: 45°, 100%, 48%
WCAG AAA Contrast Ratio: 5.2:1 against white
```

**Usage:**
- Success states
- Achievements
- Value highlights
- Positive notifications
- Premium features
- Star ratings

### Red (#EA3E37)

Alert, destructive accent. Used for errors, warnings, and destructive actions.

```
#EA3E37 (RGB: 234, 62, 55)
HSL: 2°, 85%, 57%
WCAG AAA Contrast Ratio: 7.3:1 against white
```

**Usage:**
- Error messages
- Destructive buttons (delete, remove)
- Warning states
- Critical alerts
- Validation errors

## Semantic Colors

These colors communicate status and intent across the interface.

### Success (#10B981)
```
#10B981 (Green)
Usage: Completed tasks, successful actions, positive states
```

### Warning (#F59E0B)
```
#F59E0B (Amber)
Usage: Caution needed, pending states, warnings
```

### Error (#EA3E37)
```
#EA3E37 (Red)
Usage: Errors, failures, destructive actions
```

### Info (#266BD4)
```
#266BD4 (Blue)
Usage: Information, tips, helpful notifications
```

## Neutral Colors

The foundation of visual hierarchy. Provides contrast and readability.

### Light Mode Neutrals

```
White:        #ffffff | RGB(255, 255, 255) - Card backgrounds, surfaces
Off-white:    #f8f9fa | RGB(248, 249, 250) - Page backgrounds
Light Gray:   #f0f2f5 | RGB(240, 242, 245) - Secondary backgrounds
Lighter Gray: #e9ecef | RGB(233, 236, 239) - Borders, dividers
Gray:         #dee2e6 | RGB(222, 226, 230) - Subtle separations
Medium Gray:  #adb5bd | RGB(173, 181, 189) - Placeholder text
Dark Gray:    #6c757d | RGB(108, 117, 125) - Secondary text
Darker Gray:  #495057 | RGB(73, 80, 87) - Tertiary text
Very Dark:    #343a40 | RGB(52, 58, 64) - Disabled state
Dark Navy:    #212529 | RGB(33, 37, 41) - Body text
Navy:         #0a0e27 | RGB(10, 14, 39) - Primary text, headings
```

### Dark Mode Neutrals

```
Very Dark Navy:  #0a0e27 | RGB(10, 14, 39) - Background
Dark Surface:    #131829 | RGB(19, 24, 41) - Card backgrounds
Surface Border:  #2d3142 | RGB(45, 49, 66) - Borders
Text Secondary:  #a0a9b8 | RGB(160, 169, 184) - Secondary text
Off-white:       #f8f9fa | RGB(248, 249, 250) - Primary text
```

## Color Usage Guidelines

### Backgrounds

**Page/View Background:**
- Light: `#f8f9fa`
- Dark: `#0a0e27`

**Card/Container Background:**
- Light: `#ffffff`
- Dark: `#131829`

**Secondary Background:**
- Light: `#f0f2f5`
- Dark: `#1a1f3a`

### Text Colors

**Primary Text (Headings, important text):**
- Light: `#0a0e27` (navy)
- Dark: `#f8f9fa` (off-white)

**Secondary Text (Helper text, labels):**
- Light: `#495057` (dark gray)
- Dark: `#a0a9b8` (medium gray)

**Tertiary Text (Placeholders, disabled):**
- Light: `#6c757d` (medium gray)
- Dark: `#6c757d` (medium gray)

### Borders

**Primary Border:**
- Light: `#e9ecef` (light gray)
- Dark: `#2d3142` (dark gray)

**Hover/Focus Border:**
- Light: `#279FBD` (teal)
- Dark: `#279FBD` (teal)

**Disabled Border:**
- Light: `#f0f2f5` (very light)
- Dark: `#1a1f3a` (very dark)

## Interaction States

### Hover State
Darken by one shade in the color scale.

```
Primary Teal:    #279FBD → #1f7fa3 (Teal 600)
Secondary Blue:  #266BD4 → #1a51b3 (Blue 600)
Text Link:       #266BD4 → #1a51b3
```

### Focus State
Add a 3px outline in primary teal with small offset.

```
outline: 3px solid #279FBD
outline-offset: 2px
```

### Active State
Use the darker shade from color scale.

```
Primary:   Teal 700 (#195f82)
Secondary: Blue 700 (#143d92)
```

### Disabled State
Use neutral gray with reduced opacity.

```
Light: #6c757d with 50% opacity
Dark:  #6c757d with 50% opacity
```

## Color Combinations

### Button Combinations

**Primary Button:**
- Background: Teal (#279FBD)
- Text: White (#ffffff)
- Hover: Teal 600 (#1f7fa3)
- Active: Teal 700 (#195f82)
- Disabled: Gray (#6c757d) + white text at 50% opacity

**Secondary Button:**
- Background: Light Gray (#f0f2f5)
- Text: Navy (#0a0e27)
- Hover: Light Gray (#e9ecef) with Teal border
- Active: Light Gray (#e9ecef)
- Disabled: Light Gray (#f0f2f5) + navy text at 50% opacity

**Tertiary Button:**
- Background: Transparent
- Text: Teal (#279FBD)
- Hover: Teal 50 background (#e8f5fa)
- Active: Teal 100 background (#c9eaf5)
- Disabled: Gray (#6c757d) at 50% opacity

**Destructive Button:**
- Background: Red (#EA3E37)
- Text: White (#ffffff)
- Hover: Darker red
- Active: Much darker red
- Disabled: Gray (#6c757d) + white text at 50% opacity

### Card Combinations

**Light Mode:**
- Background: White (#ffffff)
- Border: Light Gray (#e9ecef)
- Text: Navy (#0a0e27)
- Shadow: Subtle gray shadow

**Dark Mode:**
- Background: Dark Surface (#131829)
- Border: Surface Border (#2d3142)
- Text: Off-white (#f8f9fa)
- Shadow: Very dark shadow

## Dark Mode Adjustments

When transitioning colors to dark mode:

1. **Backgrounds**: Invert from light to dark values
2. **Text**: Invert from dark to light values
3. **Brands colors**: Keep primary, secondary, accents identical
4. **Borders**: Use dark-specific border colors with slight visibility
5. **Shadows**: Use dark shadows with darker colors

## Color Testing

### Contrast Checker
Always verify color combinations using [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/):
- Minimum WCAG AA: 4.5:1 for body text
- Aim for WCAG AAA: 7:1+ for body text

### Accessibility Tools
- Colorblind Simulator: Test for deuteranopia, protanopia, tritanopia
- High Contrast Mode: Test Windows High Contrast detection
- Dark Mode: Test both light and dark preferences

## Color References in Code

All colors should use CSS custom properties (design tokens), never hardcoded values:

```css
/* ✅ Good */
color: var(--foreground);
background: var(--primary);
border-color: var(--border);

/* ❌ Avoid */
color: #0a0e27;
background: #279FBD;
border-color: #e9ecef;
```

Design tokens are defined in `/app/globals.css`:
- Light mode `:root` selector
- Dark mode `.dark` selector

## Color Naming Convention

All color tokens follow this structure:
- **Primary/Secondary**: Specific function (primary, secondary)
- **Semantic**: Use case (success, error, warning, info)
- **Neutral**: Shade (0-950 scale from light to dark)
- **Accent**: Color name (purple, gold, red)

## Updating Colors

When updating the color palette:

1. Update `tokens.json` with new values
2. Update CSS custom properties in `/app/globals.css`
3. Update both `:root` and `.dark` selectors
4. Test contrast with WCAG checker
5. Test in dark mode
6. Update this documentation
7. Commit with clear message: "chore: update color palette to..."
