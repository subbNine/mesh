# Mesh Design System - Visual Guide

A visual reference guide for the Mesh design system. Use this for quick lookups of colors, typography, components, and patterns.

## Color Palette at a Glance

### Primary Brand Colors

```
Teal #279FBD
████████████████████ 100%
████████████████░░░░ 75%
████████████░░░░░░░░ 50%
████████░░░░░░░░░░░░ 25%

Blue #266BD4
████████████████████ 100%
████████████████░░░░ 75%
████████████░░░░░░░░ 50%
████████░░░░░░░░░░░░ 25%
```

### Accent Colors

```
Purple #9654B8  |  Gold #F6B900  |  Red #EA3E37
███████████████ | ██████████████ | ██████████████
```

### Neutral Scale

```
0%   10%   20%   30%   40%   50%   60%   70%   80%   90%   100%
█░░  ███░  █████ ██████░ ████████░ ██████████░ ████████████░ ██████████████░ ████████████████░ ██████████████████░ ██████████████████████
```

## Typography Scale

```
Display (48px)
████████████████████████████████████████████████

Heading 1 (36px)
██████████████████████████████████

Heading 2 (30px)
██████████████████████████

Heading 3 (24px)
████████████████████

Heading 4 (20px)
████████████████

Body Large (18px)
██████████████

Body (16px)
████████████

Small (14px)
██████████

Caption (12px)
████████
```

## Component Quick Reference

### Button Variants

```
┌─────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ Primary Button  │ Teal BG, White Text
├─────────────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░ Secondary Button │ Gray BG, Dark Text
├─────────────────────────────────────┤
│ Tertiary Button                     │ Transparent, Teal Text
├─────────────────────────────────────┤
│ 🗑 Destructive Button               │ Red BG, White Text
└─────────────────────────────────────┘
```

### Button States

```
Default:
┌──────────────┐
│ Click Me     │
└──────────────┘

Hover:
┌──────────────┐
│ Click Me     │ (darker background)
└──────────────┘

Focus:
┌─────────────────────┐
│ Click Me            │ (outline ring)
└─────────────────────┘

Disabled:
┌──────────────┐
│ Click Me     │ (grayed out, 50% opacity)
└──────────────┘
```

### Card Layouts

```
Default Card:
┌─────────────────────────┐
│ Card Title              │
│ Some content here       │
│ More information        │
└─────────────────────────┘

Elevated Card:
   ╱─────────────────────╲
  │ Card Title            │ (shadow)
  │ Content with shadow   │
   ╲─────────────────────╱

Outlined Card:
┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Card Title             ┃
┃ Content with border    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Input States

```
Default:
┌──────────────────────┐
│ Enter text...        │
└──────────────────────┘

Focus:
┌──────────────────────┐
│ Enter text...        │ (blue outline)
└──────────────────────┘

Error:
┌──────────────────────┐
│ Enter text...        │ (red outline)
└──────────────────────┘
! Error message

Disabled:
┌──────────────────────┐
│ Enter text...        │ (grayed out)
└──────────────────────┘
```

## Spacing Reference

```
4px   ███
8px   ██████████
12px  ██████████████████
16px  ████████████████████████
24px  ██████████████████████████████████
32px  ████████████████████████████████████████████████
```

## Responsive Breakpoints

```
┌─────────────────────────────────────────────────┐
│ Mobile (320px) - Single Column                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Card                                        │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Card                                        │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ Tablet (768px) - Two Columns                                     │
│ ┌─────────────────────┐ ┌─────────────────────┐                 │
│ │ Card                │ │ Card                │                 │
│ └─────────────────────┘ └─────────────────────┘                 │
│ ┌─────────────────────┐ ┌─────────────────────┐                 │
│ │ Card                │ │ Card                │                 │
│ └─────────────────────┘ └─────────────────────┘                 │
└──────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ Desktop (1024px) - Three Columns                                           │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐                             │
│ │ Card       │ │ Card       │ │ Card       │                             │
│ └────────────┘ └────────────┘ └────────────┘                             │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐                             │
│ │ Card       │ │ Card       │ │ Card       │                             │
│ └────────────┘ └────────────┘ └────────────┘                             │
└────────────────────────────────────────────────────────────────────────────┘
```

## Layout Patterns

### Sidebar Navigation

```
┌─────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░ │ Main Content                      │
│ ░ Home              │ ┌──────────────────────────────┐ │
│ ░ Projects          │ │ Page Title                   │ │
│ ░ Teams             │ │                              │ │
│ ░ Settings          │ │ Content here...              │ │
│ ░░░░░░░░░░░░░░░░░░ │ │                              │ │
│                     │ └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Header Navigation

```
┌────────────────────────────────────────────────────┐
│ Logo    Home Projects Teams Settings      [Avatar]│
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│ Main Content                                       │
│                                                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Grid Layout

```
┌──────────┬──────────┬──────────┐
│  Item    │  Item    │  Item    │
├──────────┼──────────┼──────────┤
│  Item    │  Item    │  Item    │
├──────────┼──────────┼──────────┤
│  Item    │  Item    │  Item    │
└──────────┴──────────┴──────────┘
```

## Typography Hierarchy

```
Display (Hero Text)
This is the largest, most prominent text
used for main page titles and hero sections.

Heading 1
Used for major section headings throughout the page.

Heading 2
Subsection headings break up content into manageable chunks.

Heading 3
Component titles and card headings sit here in the hierarchy.

Body Text (16px)
This is the default paragraph text size. It's designed for comfortable
reading over longer periods. The line height of 1.5x ensures optimal
readability without sacrificing information density.

Small Text (14px)
Secondary text like labels, metadata, and helper text uses this size.

Caption (12px)
Fine print, timestamps, and minimal text use the smallest scale.
```

## Focus & Interaction States

### Focus State Indicator

```
┌─────────────────────┐
│ Interactive Element │ (Standard)
└─────────────────────┘

┏━━━━━━━━━━━━━━━━━━━┓
┃ Interactive Element ┃ (Focused - blue outline)
┗━━━━━━━━━━━━━━━━━━━┛
```

### Hover State Evolution

```
1. Default
┌──────────────┐
│ Button       │
└──────────────┘

2. Hover (darker)
┌──────────────┐
│ Button       │ ← Slightly darker
└──────────────┘

3. Active (much darker)
┌──────────────┐
│ Button       │ ← More contrast
└──────────────┘
```

## Dark Mode Comparison

```
LIGHT MODE
┌──────────────────────────┐
│ ██████████ Card Title    │ (Dark text on light bg)
│ Card content with        │
│ light background         │
└──────────────────────────┘

DARK MODE
┌──────────────────────────┐
│ ██████████ Card Title    │ (Light text on dark bg)
│ Card content with        │
│ dark background          │
└──────────────────────────┘
```

## Accessibility Contrast

```
High Contrast (7:1 ratio - AAA standard)
████████████████ Dark Text on Light Background
████████████████ Light Text on Dark Background

Acceptable Contrast (4.5:1 ratio - AA standard)
████████████░░░░ Medium Text on Light Background

Low Contrast (FAIL - do not use)
████████░░░░░░░░ Barely visible text
```

## Icon Reference

```
Common Icon Sizes:
▯▯  16px (dense UI, inline)
▯▯▯▯  20px (default, balanced)
▯▯▯▯▯▯  24px (spacious UI, large)
▯▯▯▯▯▯▯▯  32px (hero, prominent)

Icon States:
✓ Default (neutral gray)
✓ Hover (primary teal)
✓ Active (darker teal)
✓ Disabled (muted gray)
```

## Form Pattern

```
┌────────────────────────────────┐
│ Email Address *                │ (Label + required)
├────────────────────────────────┤
│ Enter your email here...       │ (Input field)
│                                │
├────────────────────────────────┤
│ We'll never share your email   │ (Helper text)
└────────────────────────────────┘

Error State:
┌────────────────────────────────┐
│ Email Address *                │
├────────────────────────────────┤
│ Enter your email here...       │ (Red border)
│                                │
├────────────────────────────────┤
│ ! Please enter a valid email   │ (Error text in red)
└────────────────────────────────┘
```

## Modal/Dialog Layout

```
┌─────────────────────────────────────────────────────┐
│ Confirm Action                            [×]       │ (Header + close)
├─────────────────────────────────────────────────────┤
│                                                     │
│ Are you sure you want to delete this item?          │ (Content)
│ This action cannot be undone.                       │
│                                                     │
├─────────────────────────────────────────────────────┤
│                              [Cancel] [Delete]      │ (Action buttons)
└─────────────────────────────────────────────────────┘
```

## Badge Examples

```
Status Badges:
┌──────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ ● Active │ │ ◐ Next │ │ ○ Idle │ │ ✕ Done │
└──────────┘ └────────┘ └────────┘ └────────┘

Category Badges:
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Feature  │ │ Bug Fix  │ │ Refactor │
└──────────┘ └──────────┘ └──────────┘

Value Badges:
┌─────────┐ ┌──────────┐ ┌──────────┐
│ ★ High  │ │ ★★ Crit │ │ ★ Normal │
└─────────┘ └──────────┘ └──────────┘
```

## Alert Messages

```
Success:
├─ ✓ Action completed successfully
│  Your changes have been saved.

Warning:
├─ ⚠ Please review
│  This action might have unintended consequences.

Error:
├─ ✕ Something went wrong
│  Unable to save your changes. Please try again.

Info:
├─ ℹ Helpful information
│  You have 3 days left to complete this task.
```

## Animation Examples

### Button Click Feedback

```
1. Default
╔════════════╗
║ Click Me   ║
╚════════════╝

2. On Click (ripple effect)
╔════════════╗
║ Click Me ⊙ ║  ← Feedback animation
╚════════════╝

3. Transitions
Duration: 150-250ms
Easing: cubic-bezier(0.4, 0, 0.2, 1)
```

### Loading State

```
Spinner:
  ⊙ → ◐ → ◑ → ◕ → ⊙

Button with Loading:
┌──────────────────┐
│ ⊙ Saving...      │ (Spinner + text)
└──────────────────┘
```

## Spacing Grid

```
0px:  │
4px:  ▫
8px:  ▪
12px: ▪ ▫
16px: ▪ ▪
24px: ▪ ▪ ▫ ▫
32px: ▪ ▪ ▪ ▪
```

## Component Sizes

```
Touch Targets (minimum 44x44px):

  │
  ├─ 8px padding
  │
  ├──────────────────────┤
  │                      │
  │     Button Text      │ 44px
  │                      │
  ├──────────────────────┤
  │
  └─ 8px padding
```

## Responsive Grid

```
Mobile Grid (4 columns, 4px gutter):
┌┐┌┐┌┐┌┐
│││││││
└┘└┘└┘└┘

Tablet Grid (8 columns, 8px gutter):
┌───┐┌───┐┌───┐┌───┐
│   ││   ││   ││   │
└───┘└───┘└───┘└───┘

Desktop Grid (12 columns, 16px gutter):
┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐
│    ││    ││    ││    ││    ││    │
└────┘└────┘└────┘└────┘└────┘└────┘
```

## Color Usage Matrix

```
                Primary    Secondary   Accent     Neutral
Backgrounds      ✓          ✓          ✓          ✓
Text             ✓          ✓          ✓          ✓
Borders          ✓          ✓          ✓          ✓
Interactive      ✓          ✓          ✓          
Accents          ✓          ✓          ✓          
Status           ✓          ✓          ✓
```

## Typography Rules

```
✓ DO:
  ├─ Use text-balance on headings
  ├─ Maintain 1.5x line height for body
  ├─ Keep line length 45-75 characters
  ├─ Use bold for emphasis
  └─ Test at actual reading distance

✗ DON'T:
  ├─ Use fonts below 12px
  ├─ Use ALL CAPS (except labels)
  ├─ Use more than 2 font weights
  ├─ Change line height on the fly
  └─ Forget dark mode testing
```

---

## Quick Lookup Table

| Element | Light | Dark | Size | Weight |
|---------|-------|------|------|--------|
| H1 | #0a0e27 | #f8f9fa | 36px | 600 |
| H2 | #0a0e27 | #f8f9fa | 30px | 600 |
| Body | #0a0e27 | #f8f9fa | 16px | 400 |
| Primary Button | #279FBD | #279FBD | 40px | 500 |
| Card | #ffffff | #131829 | N/A | N/A |
| Border | #e9ecef | #2d3142 | 1px | N/A |
| Shadow | 0 1px 2px | 0 1px 2px | N/A | N/A |

---

Use this visual guide for quick reference. For detailed information, see the main design system documentation.
