# Mesh Design System - Brand Guidelines

## Overview

Mesh is a canvas-first project management platform built for small startup teams. Our brand reflects innovation, clarity, and focus—qualities that enable teams to work together on spatial, freeform projects without context switching.

## Brand Values

### Innovation
We push the boundaries of how teams collaborate. Our design reflects cutting-edge thinking without sacrificing usability.

### Clarity
Complex work becomes simple through clear visual hierarchy, intuitive navigation, and thoughtful information architecture.

### Collaboration
Every pixel supports teamwork. We design for pairs, small groups, and distributed teams equally.

### Focus
We eliminate distractions and noise. Every element serves a purpose.

## Brand Personality

**Confident** - We know what we're building and why
**Approachable** - Modern but not intimidating
**Precise** - Attention to detail in every interaction
**Energetic** - Vibrant colors and responsive interactions

## Visual Identity

### Primary Colors

**Teal #279FBD** - Trust, creativity, primary actions
- Used for CTAs, primary buttons, and main brand identity
- Conveys reliability and innovation

**Blue #266BD4** - Intelligence, secondary actions
- Used for secondary buttons, links, and accents
- Represents clarity and precision

### Accent Colors

**Purple #9654B8** - Creativity, collaboration
- Used for highlights, special states, team features

**Gold #F6B900** - Success, value
- Used for achievements, highlights, positive feedback

**Red #EA3E37** - Attention, errors
- Used for destructive actions, errors, warnings

### Neutrals

- **Dark Navy #0a0e27** - Primary text, backgrounds
- **Light Gray #f8f9fa** - Secondary backgrounds
- **Subtle Gray #e9ecef** - Borders, dividers

## Typography System

### Font Family: Geist

Geist is a modern, geometric sans-serif designed by Vercel. It's highly legible at all sizes with excellent spacing and kerning.

- **Weights**: Light (300), Normal (400), Medium (500), Semibold (600), Bold (700)
- **Usage**: All UI text, headings, body copy
- **Fallback**: system-ui, -apple-system, sans-serif

### Type Scale

```
Display: 48px / 56px line-height
Heading 1: 36px / 40px line-height
Heading 2: 30px / 36px line-height
Heading 3: 24px / 32px line-height
Heading 4: 20px / 28px line-height
Body Large: 18px / 28px line-height
Body: 16px / 24px line-height
Body Small: 14px / 20px line-height
Caption: 12px / 16px line-height
```

### Line Height Guidelines

- **Headings**: 1.2x (tight, confident)
- **Body**: 1.5x (readable, comfortable)
- **UI Labels**: 1.4x (balance between tight and loose)

### Usage Rules

- **Always** use text-balance for headings (allows browser to optimize line breaks)
- **Always** use text-pretty for long form content
- **Never** use fonts smaller than 12px
- **Never** exceed 75 characters per line for body text
- **Always** maintain at least 1.4x line-height for accessibility

## Spacing System

Uses an 8px base unit for consistency. All spacing values are multiples of 4px or 8px.

```
Extra small: 4px (gap between adjacent elements)
Small: 8px (internal padding, tight spacing)
Medium: 16px (standard spacing, component padding)
Large: 24px (section spacing)
Extra Large: 32px+ (major section separation)
```

### Spacing Rules

- **Component padding**: 12-16px
- **Section gaps**: 24-32px
- **Page margins**: 16px mobile, 24px+ desktop
- **Never** use arbitrary pixel values—stick to the spacing scale

## Elevation & Depth

### Shadow System

```
Subtle (cards, small elements): 0 1px 3px rgba(0,0,0,0.1)
Medium (modals, dropdowns): 0 10px 15px rgba(0,0,0,0.1)
Strong (overlays, popovers): 0 20px 25px rgba(0,0,0,0.15)
```

### Layering Strategy

1. **Base Layer**: Backgrounds and large containers
2. **Interaction Layer**: Cards, sections, grouped content
3. **Modal Layer**: Dialogs, popovers, menus
4. **Toast Layer**: Notifications, alerts

## Iconography

### Icon Guidelines

- **Size**: Use 16px, 20px, 24px, 32px (never in-between)
- **Weight**: Icons should be consistent with text weight (medium-weight outline icons)
- **Style**: Geometric, clean, minimal
- **Spacing**: 8px minimum from adjacent content
- **Color**: Match text color unless indicating state

### Icon Usage

- **Action icons**: Teal when active, neutral gray when inactive
- **Status icons**: Green (success), Gold (warning), Red (error), Blue (info)
- **Interactive icons**: Should have hover states (slightly darker or teal)

## Motion & Animation

### Timing

- **Fast**: 150ms - Quick feedback, micro-interactions
- **Standard**: 250ms - Primary interactions, transitions
- **Slow**: 350ms - Complex animations, state changes

### Easing

**Cubic Bezier (0.4, 0, 0.2, 1)** - Standard easing for all animations
- Feels natural and responsive
- Not overly snappy or sluggish

### Animation Principles

- **Purposeful**: Every animation serves a function
- **Subtle**: Animations support, not distract
- **Responsive**: Animations finish within 300ms
- **Accessible**: Respect prefers-reduced-motion

## Accessibility Standards

### Color Contrast

- **AAA Standard**: All text must have 7:1 contrast ratio
- **WCAG AA**: Minimum 4.5:1 for body text, 3:1 for large text
- **Test**: Use WCAG Contrast Checker before shipping

### Focus States

- **Always visible**: 2-3px outline in primary color
- **Keyboard navigation**: Tab order matches visual flow
- **Never remove**: outline { outline: none; } without replacement

### Interactive Elements

- **Minimum size**: 44x44px touch targets
- **Label clarity**: All inputs have associated labels
- **Form states**: Clear disabled, error, and loading states
- **Semantics**: Use semantic HTML (button, a, input, etc.)

## Component Hierarchy

### Buttons

**Primary**: Teal background, white text - Main CTAs
**Secondary**: Light gray background, dark text - Alternative actions
**Tertiary**: Text-only, teal text - Minimal actions
**Destructive**: Red background, white text - Delete/remove actions

**States**: Default → Hover (darker) → Active (more saturated) → Disabled (muted)

### Inputs

**Default state**: Light gray background, dark border, dark text
**Focus state**: Teal border (3px), box shadow with teal
**Error state**: Red border, red helper text
**Disabled state**: Muted gray, disabled cursor

### Cards

**Background**: White (light) / #131829 (dark)
**Border**: Subtle gray, 1px
**Padding**: 16px
**Shadow**: Subtle (0 1px 3px rgba(0,0,0,0.1))
**Radius**: 8px

### Modals

**Background**: Semi-transparent dark overlay (rgba(0,0,0,0.5))
**Container**: White card with 16px padding
**Border radius**: 12px
**Shadow**: Strong (0 20px 25px)
**Z-index**: 50 (overlay), 100 (modal)

## Responsive Design

### Mobile-First Approach

Design for mobile first, then enhance for larger screens.

```
xs: 320px  (phones)
sm: 640px  (large phones, small tablets)
md: 768px  (tablets)
lg: 1024px (small laptops)
xl: 1280px (desktops)
2xl: 1536px (large desktops)
```

### Layout Breakpoints

**Mobile (< 640px)**
- Single column layout
- Full-width cards
- Bottom navigation or hamburger menu
- Larger touch targets (48px+)

**Tablet (640px - 1024px)**
- Two-column or adaptive layout
- Adjusted spacing and typography
- Sidebar optional

**Desktop (> 1024px)**
- Multi-column layouts possible
- Standard sidebar navigation
- Optimized information density

## Dark Mode

Dark mode is fully supported and equally polished as light mode.

### Dark Mode Colors

- **Background**: #0a0e27 (very dark navy)
- **Surface**: #131829 (slightly lighter)
- **Text**: #f8f9fa (off-white)
- **Border**: #2d3142 (subtle gray)
- **Primary**: #279FBD (unchanged)

### Dark Mode Guidelines

- **Never** use pure black (#000000) - use #0a0e27
- **Never** use pure white (#ffffff) - use #f8f9fa
- **Test**: Both modes equally at launch
- **Prefer**: User system preference detection

## Design Tokens for Figma

All tokens are available in `tokens.json` format for import:

```json
{
  "colors": { /* primary, secondary, accent, semantic, neutral */ },
  "typography": { /* font families, sizes, weights */ },
  "spacing": { /* 0px to 384px scale */ },
  "borderRadius": { /* border radius values */ },
  "shadows": { /* elevation shadows */ },
  "transitions": { /* timing and easing */ }
}
```

**Figma Import Instructions**:
1. Install "Design Tokens" plugin
2. Upload tokens.json
3. Auto-generate styles for all tokens
4. Use in component library

## Writing Guidelines

### Tone

- **Direct**: Say what something does, not why
- **Concise**: Use short sentences and active voice
- **Helpful**: Anticipate user questions
- **Humble**: We're here to help, not command

### Examples

**❌ Poor**: "You must fill in this field before continuing"
**✅ Good**: "Email required to continue"

**❌ Poor**: "An error has occurred"
**✅ Good**: "Couldn't save changes. Try again or contact support."

**❌ Poor**: "Invalid input detected"
**✅ Good**: "Please enter a valid email address"

## Implementation Checklist

- [ ] All colors use design tokens, never hardcoded hex values
- [ ] All typography uses Geist font family with appropriate scale
- [ ] All spacing follows 4px/8px grid (no arbitrary px values)
- [ ] All interactive elements have focus states
- [ ] All shadows use predefined shadow values
- [ ] All animations respect prefers-reduced-motion
- [ ] All text has sufficient color contrast (AAA)
- [ ] Touch targets are minimum 44x44px
- [ ] Dark mode is fully supported
- [ ] Mobile responsive (tested at 320px, 768px, 1280px)

## Design System Evolution

This design system is living documentation. As Mesh evolves:

1. **Document first**: Add token to this guide before implementing
2. **Test thoroughly**: Ensure changes work across all products
3. **Version control**: Track changes in git with clear commit messages
4. **Team alignment**: Discuss major changes in design reviews

For questions or suggestions, please open an issue in the design-system folder.
