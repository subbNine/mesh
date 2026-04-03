# CSS Implementation Guide

How to implement the Mesh design system in your CSS and React components.

## Design Tokens in CSS

All design tokens are defined as CSS custom properties (CSS variables) in `app/globals.css`.

### Light Mode (Default)

```css
:root {
  /* Colors */
  --background: #f8f9fa;
  --foreground: #0a0e27;
  --primary: #279FBD;
  --secondary: #266BD4;
  
  /* Spacing */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-4: 16px;
  --spacing-6: 24px;
  
  /* Border Radius */
  --radius: 8px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

### Dark Mode

```css
.dark {
  --background: #0a0e27;
  --foreground: #f8f9fa;
  --primary: #279FBD; /* Unchanged */
  --card: #131829;
  --border: #2d3142;
}
```

## Using Tokens in CSS

### Colors

```css
/* Using tokens */
.button {
  background-color: var(--primary);
  color: var(--primary-foreground);
  border: 1px solid var(--border);
}

/* Opacity variations */
.button-subtle {
  background-color: color-mix(in srgb, var(--primary) 10%, transparent);
}
```

### Spacing

```css
/* Use spacing tokens for consistency */
.card {
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-6);
  gap: var(--spacing-2);
}

/* Never use arbitrary pixels */
/* ❌ DON'T DO THIS */
padding: 13px;
margin: 17px;
gap: 9px;

/* ✅ DO THIS */
padding: var(--spacing-3);
margin: var(--spacing-4);
gap: var(--spacing-2);
```

### Border Radius

```css
.card {
  border-radius: var(--radius);
}

.button {
  border-radius: calc(var(--radius) - 2px);
}
```

### Shadows

```css
.card-subtle {
  box-shadow: var(--shadow-sm);
}

.card-elevated {
  box-shadow: var(--shadow-md);
}

.card-overlay {
  box-shadow: var(--shadow-lg);
}
```

## Tailwind CSS Classes

Since the project uses Tailwind CSS with v4, most styling is done via utility classes rather than custom CSS.

### Color Classes

```tsx
// Background colors
<div className="bg-background">
<div className="bg-card">
<div className="bg-primary">
<div className="bg-secondary">

// Text colors
<p className="text-foreground">
<p className="text-foreground/60">  {/* 60% opacity */}
<p className="text-muted-foreground">

// Border colors
<div className="border border-border">
<div className="border border-primary">
```

### Spacing Classes

```tsx
// Padding
<div className="p-4">          {/* All sides */}
<div className="px-4">         {/* Horizontal */}
<div className="py-4">         {/* Vertical */}
<div className="pt-4 pb-6">    {/* Top & bottom */}

// Margin
<div className="m-4">
<div className="mx-auto">      {/* Center horizontally */}
<div className="mb-6">         {/* Margin bottom */}

// Gap (for flex/grid children)
<div className="flex gap-4">
<div className="grid gap-6">
```

### Typography Classes

```tsx
// Font sizes
<h1 className="text-4xl">      {/* 36px */}
<h2 className="text-3xl">      {/* 30px */}
<p className="text-base">      {/* 16px */}
<small className="text-sm">   {/* 14px */}

// Font weights
<strong className="font-bold">
<span className="font-semibold">
<span className="font-medium">
<span className="font-normal">

// Line height
<p className="leading-relaxed">
<p className="leading-tight">

// Text alignment
<h1 className="text-center">
<p className="text-left">
```

### Rounded Corners

```tsx
// Radius options
<div className="rounded-lg">    {/* Default radius */}
<div className="rounded-xl">    {/* Larger radius */}
<div className="rounded-full">  {/* Pill shape */}
```

### Shadows

```tsx
<div className="shadow-sm">     {/* Subtle */}
<div className="shadow-md">     {/* Medium */}
<div className="shadow-lg">     {/* Strong */}
<div className="shadow-none">   {/* No shadow */}
```

### Responsive Classes

All Tailwind classes support responsive breakpoints:

```tsx
<div className="
  text-sm              // Mobile: 14px
  md:text-base         // Tablet: 16px
  lg:text-lg           // Desktop: 18px
  
  p-4                  // Mobile: 16px
  md:p-6               // Tablet: 24px
  lg:p-8               // Desktop: 32px
  
  grid-cols-1          // Mobile: 1 column
  md:grid-cols-2       // Tablet: 2 columns
  lg:grid-cols-3       // Desktop: 3 columns
">

// Breakpoints
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

### Dark Mode Classes

```tsx
// Automatic dark mode support
<div className="bg-white dark:bg-slate-900">
<p className="text-black dark:text-white">

// Or use foreground/background tokens
<div className="bg-background text-foreground">
  {/* Automatically adapts to light/dark */}
</div>
```

### Hover, Focus, Active States

```tsx
<button className="
  bg-primary
  hover:bg-primary-600
  active:bg-primary-700
  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Button
</button>

// Transitions
<button className="transition-colors duration-200">
  Smooth color change
</button>
```

## Building Common Components

### Button

```tsx
<button className="
  px-4 py-2
  bg-primary hover:bg-primary-600 active:bg-primary-700
  text-white
  rounded-lg
  font-medium
  transition-colors
  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Click me
</button>
```

### Card

```tsx
<div className="
  bg-card
  border border-border
  rounded-lg
  p-6
  shadow-sm
">
  <h3 className="text-lg font-semibold mb-2">Title</h3>
  <p className="text-sm text-foreground/70">Content</p>
</div>
```

### Input

```tsx
<input
  type="text"
  className="
    w-full
    px-3 py-2
    bg-white dark:bg-slate-900
    border border-border
    rounded-lg
    text-base
    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
    placeholder:text-foreground/50
    disabled:bg-muted disabled:cursor-not-allowed
  "
  placeholder="Enter text..."
/>
```

### Badge

```tsx
<span className="
  inline-flex items-center gap-1
  px-2.5 py-0.5
  bg-primary/10 text-primary
  rounded-full
  text-xs font-medium
">
  Badge
</span>
```

## Custom CSS for Complex Components

When Tailwind classes aren't sufficient, use CSS custom properties:

```css
/* Custom component CSS */
.canvas-editor {
  background-color: var(--background);
  color: var(--foreground);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-md);
  
  /* Custom logic can use tokens */
  --local-accent: var(--primary);
}

.canvas-editor:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--primary);
}

.canvas-editor.is-focused {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

## Theme Switching

### Using CSS Class

```tsx
// Toggle dark mode
document.documentElement.classList.toggle('dark')

// Set specific mode
document.documentElement.classList.add('dark')
document.documentElement.classList.remove('dark')

// Check current mode
const isDark = document.documentElement.classList.contains('dark')
```

### Using JavaScript

```tsx
// Detect system preference
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

// Listen for changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  document.documentElement.classList.toggle('dark', e.matches)
})
```

### React Hook

```tsx
import { useEffect, useState } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false)
  
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)
  }, [])
  
  const toggle = () => {
    document.documentElement.classList.toggle('dark')
    setIsDark(!isDark)
  }
  
  return { isDark, toggle }
}

// Usage
export function ThemeToggle() {
  const { isDark, toggle } = useDarkMode()
  
  return (
    <button onClick={toggle}>
      {isDark ? '🌙 Dark' : '☀️ Light'}
    </button>
  )
}
```

## Performance Best Practices

### 1. Use Utility-First CSS

✅ Prefer Tailwind utility classes
❌ Avoid writing custom CSS when possible

```tsx
// ✅ Good - Utility classes
<div className="flex items-center justify-between gap-4 p-4">

// ❌ Avoid - Custom CSS
<div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  padding: '16px'
}}>
```

### 2. Use CSS Custom Properties for Theming

✅ Leverage CSS variables for themes
❌ Hardcode colors

```tsx
// ✅ Good - Uses tokens
<div className="bg-primary text-primary-foreground">

// ❌ Bad - Hardcoded
<div style={{ backgroundColor: '#279FBD', color: '#fff' }}>
```

### 3. Avoid Inline Styles

✅ Use classes
❌ Use inline styles

```tsx
// ✅ Good
<div className="p-4 bg-primary text-white rounded-lg">

// ❌ Bad
<div style={{ padding: '16px', backgroundColor: '#279FBD', ... }}>
```

### 4. Use CSS Grid and Flexbox

✅ Modern layout methods
❌ Float, absolute positioning

```tsx
// ✅ Good - Flexbox
<div className="flex items-center gap-4">

// ✅ Good - Grid
<div className="grid grid-cols-3 gap-4">

// ❌ Bad - Float or absolute
<div style={{ float: 'left', position: 'absolute' }}>
```

## Accessibility in CSS

### 1. Focus States

```css
/* Always visible focus states */
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Don't remove default focus */
/* ❌ NEVER DO THIS */
*:focus {
  outline: none;
}
```

### 2. Color Contrast

```css
/* Test with WCAG Contrast Checker */
/* Minimum WCAG AA: 4.5:1 */
/* Target WCAG AAA: 7:1 */

.text-primary {
  color: var(--primary); /* #279FBD on white = 7.2:1 ✅ */
}

.text-on-dark {
  color: #f8f9fa; /* Off-white on dark = 20.3:1 ✅ */
}
```

### 3. Reduced Motion

```css
/* Respect user's motion preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Debugging CSS Issues

### Common Issues & Solutions

**Issue: Color changes with dark mode but shouldn't**
```css
/* ❌ Problem */
.logo {
  color: var(--primary);  /* Changes with theme */
}

/* ✅ Solution */
.logo {
  color: #279FBD;  /* Always same color */
}
```

**Issue: Text too small to read**
```tsx
/* ❌ Problem */
<p className="text-xs">Small text</p>

/* ✅ Solution */
<p className="text-sm">Readable text</p>
```

**Issue: Spacing looks inconsistent**
```tsx
/* ❌ Problem */
<div className="p-3 m-5 gap-7">
  {/* Using arbitrary spacing */}
</div>

/* ✅ Solution */
<div className="p-4 m-6 gap-6">
  {/* Using spacing scale: 4, 8, 12, 16, 24, 32, ... */}
</div>
```

**Issue: Component doesn't respond to dark mode**
```tsx
/* ❌ Problem */
<div style={{ backgroundColor: '#ffffff' }}>
  {/* Won't change in dark mode */}
</div>

/* ✅ Solution */
<div className="bg-card">
  {/* Automatically uses token that changes per theme */}
</div>
```

## CSS Variables Reference

### Complete List

| Variable | Light | Dark | Usage |
|----------|-------|------|-------|
| `--background` | #f8f9fa | #0a0e27 | Page background |
| `--foreground` | #0a0e27 | #f8f9fa | Primary text |
| `--card` | #ffffff | #131829 | Card background |
| `--primary` | #279FBD | #279FBD | Primary actions |
| `--secondary` | #266BD4 | #266BD4 | Secondary actions |
| `--border` | #e9ecef | #2d3142 | Borders |
| `--shadow-sm` | 0 1px 2px... | same | Subtle shadow |
| `--radius` | 8px | 8px | Border radius |

See `app/globals.css` for complete list.

## Migrating from Old System

If migrating from previous styling:

1. **Replace hardcoded colors with tokens**
   ```tsx
   // Before
   color: #0a0e27;
   
   // After
   color: var(--foreground);
   ```

2. **Replace arbitrary spacing with scale**
   ```tsx
   // Before
   padding: 13px 17px 19px 15px;
   
   // After
   padding: var(--spacing-3) var(--spacing-4);
   ```

3. **Use Tailwind classes instead of custom CSS**
   ```tsx
   // Before
   <div style={{ display: 'flex', gap: '16px' }}>
   
   // After
   <div className="flex gap-4">
   ```

4. **Update hover/focus states**
   ```tsx
   // Before
   <button style={{ backgroundColor: '#279FBD' }}>
   
   // After
   <button className="bg-primary hover:bg-primary-600">
   ```

## Further Learning

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [CSS Grid and Flexbox](https://www.smashingmagazine.com/2018/04/common-css-mistakes/)
- [Accessible CSS](https://www.a11y-101.com/design/css)

---

Last updated: April 2024
